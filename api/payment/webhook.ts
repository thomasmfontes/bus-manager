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

// Validate Woovi Signature (Supports SHA256 and SHA1)
const validateSignature = (payload: string, signature: string, secretsString: string) => {
    if (!secretsString) return true;

    // Support multiple secrets separated by comma
    const secrets = secretsString.split(',').map(s => s.trim());

    for (const secret of secrets) {
        // 1. Try SHA256 (Modern) - Hex & Base64
        const expected256Hex = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        const expected256Base64 = crypto.createHmac('sha256', secret).update(payload).digest('base64');

        // 2. Try SHA1 (Legacy/Standard for some Woovi versions) - Hex & Base64
        const expected1Hex = crypto.createHmac('sha1', secret).update(payload).digest('hex');
        const expected1Base64 = crypto.createHmac('sha1', secret).update(payload).digest('base64');

        const isValid = [
            expected256Hex, expected256Base64,
            expected1Hex, expected1Base64
        ].includes(signature);

        if (isValid) return true;
    }

    console.error('❌ Signature Mismatch with all provided secrets');
    console.error('Received Signature:', signature);
    return false;
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

        // Use evento (pt-br) or event (en) as Woovi sometimes varies
        const event = body.event || body.evento;
        const charge = body.charge || body.cobranca;

        // 1. Handle Woovi connectivity test (Prioritize test detection)
        if (event === 'teste_webhook' || body.evento === 'teste_webhook' || body.event === 'teste_webhook') {
            console.log('✅ Connectivity Test Received');
            return res.status(200).json({ received: true, message: 'Test success' });
        }

        // 2. Security Check (Production Strictness)
        if (secret && !validateSignature(rawBody, signature, secret)) {
            console.error('❌ Webhook Signature Invalid');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!event || !charge) {
            console.log('⚠️ Webhook ignored: Missing event or charge data');
            return res.status(200).json({ received: true, ignored: true, reason: 'Missing payload' });
        }

        // Correlation ID can be charge.correlationID or body.correlationID depending on event type
        const correlationID = charge.correlationID || body.correlationID;

        if (!correlationID) {
            console.log('⚠️ Webhook ignored: No correlationID found in event:', event);
            return res.status(200).json({ received: true, ignored: true, reason: 'No correlationID' });
        }

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
            console.error('❌ Transaction not found for correlationID:', correlationID);
            return res.status(404).json({ error: 'Transaction not found' });
        }

        console.log(`📦 Processing event ${event} for transaction ${transaction.id} (Current status: ${transaction.status})`);

        // 3. Handle Charge Completion
        if (event === 'OPENPIX:CHARGE_COMPLETED' || event === 'CHARGE_COMPLETED') {
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
        if (event === 'OPENPIX:CHARGE_EXPIRED' || event === 'CHARGE_EXPIRED') {
            console.log(`⌛ Marking transaction ${transaction.id} as expired`);
            const { error: expireError } = await supabase
                .from('pagamentos')
                .update({
                    status: 'expired',
                    woovi_status: 'EXPIRED',
                    provider_payload: body
                })
                .eq('id', transaction.id)
                .neq('status', 'paid');

            if (expireError) {
                console.error('Error marking as expired:', expireError);
                return res.status(500).json({ error: 'Failed to update status' });
            }

            return res.status(200).json({ success: true, status: 'expired' });
        }

        console.log(`ℹ️ Webhook event ${event} received but not explicitly handled.`);
        return res.status(200).json({ received: true, ignored: true, event });

    } catch (error: any) {
        console.error('❌ Webhook Hardening Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
