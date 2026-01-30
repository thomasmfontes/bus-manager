import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const config = {
    api: {
        bodyParser: false,
    },
};

async function getRawBody(req: VercelRequest): Promise<string> {
    const chunks: any[] = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

// Validate Woovi Signature (Supports Hex and Base64)
const validateSignature = (payload: string, signature: string, secret: string) => {
    if (!secret) return true;
    const hmac = crypto.createHmac('sha256', secret).update(payload);

    const expectedHex = hmac.digest('hex');
    // Try Base64 too as some OpenPix versions use it
    const expectedBase64 = crypto.createHmac('sha256', secret).update(payload).digest('base64');

    const isValid = expectedHex === signature || expectedBase64 === signature;

    if (!isValid) {
        console.error('❌ Signature Mismatch Detail:');
        console.error('Expected (Hex):', expectedHex);
        console.error('Expected (B64):', expectedBase64);
        console.error('Received:', signature);
    }

    return isValid;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 0. READ RAW BODY FIRST
    const rawBody = await getRawBody(req);
    let body: any = {};
    try {
        body = JSON.parse(rawBody);
    } catch (e) {
        console.error('Failed to parse JSON body:', e);
    }

    // --- ABSOLUTE TOP LOGGING ---
    console.log('--- WEBHOOK INITIAL CONTACT (RAW) ---');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Body Preview:', rawBody.substring(0, 500));
    console.log('-------------------------------');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Try x-openpix-signature and x-webhook-signature (as backup)
        const signature = (req.headers['x-openpix-signature'] || req.headers['x-webhook-signature']) as string;
        const secret = process.env.WOOVI_WEBHOOK_SECRET;
        const { event, charge } = body;

        // 1. Handle Woovi connectivity test (Bypass signature for tests)
        if (event === 'teste_webhook' || body?.evento === 'teste_webhook') {
            console.log('✅ Connectivity Test Received');
            return res.status(200).json({ received: true, message: 'Test success' });
        }

        // 2. Security Check (Production Strictness)
        if (secret && !validateSignature(rawBody, signature, secret)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!event || !charge || !charge.correlationID) {
            console.log('⚠️ Webhook ignored: Missing required fields');
            return res.status(200).json({
                received: true,
                ignored: true,
                reason: 'Missing payload data'
            });
        }

        const correlationID = charge.correlationID;
        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Fetch transaction
        const { data: transaction, error: fetchError } = await supabase
            .from('pagamentos')
            .select('id, status, passageiros_ids, viagem_id, valor_total')
            .eq('id', correlationID)
            .single();

        if (fetchError || !transaction) {
            console.error('Transaction not found for correlationID:', correlationID);
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // 3. Handle Charge Completion
        if (event === 'OPENPIX:CHARGE_COMPLETED') {
            const { data: updated, error: updateError } = await supabase
                .from('pagamentos')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    woovi_status: 'COMPLETED',
                    fee_cents: charge.fee || 0,
                    provider_payload: body // Audit trail
                })
                .eq('id', transaction.id)
                .neq('status', 'paid')
                .select();

            if (updateError || !updated || updated.length === 0) {
                return res.status(200).json({ message: 'Already processed or no change required' });
            }

            // 4. Update linked passengers status
            const individualValue = (transaction.valor_total || 0) / (transaction.passageiros_ids?.length || 1);
            const { error: pUpdateError } = await supabase
                .from('passageiros')
                .update({
                    pagamento: 'Pago',
                    valor_pago: individualValue
                })
                .in('id', transaction.passageiros_ids)
                .eq('viagem_id', transaction.viagem_id);

            if (pUpdateError) {
                console.error('Error updating passengers:', pUpdateError);
            }

            console.log('✅ Payment and passengers updated successfully!');
            return res.status(200).json({ success: true, status: 'paid' });
        }

        // 5. Handle Charge Expiration
        if (event === 'OPENPIX:CHARGE_EXPIRED') {
            await supabase
                .from('pagamentos')
                .update({
                    status: 'expired',
                    woovi_status: 'EXPIRED',
                    provider_payload: body
                })
                .eq('id', transaction.id)
                .neq('status', 'paid');

            return res.status(200).json({ success: true, status: 'expired' });
        }

        return res.status(200).json({ received: true, ignored: true, event });

    } catch (error: any) {
        console.error('Webhook Hardening Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
