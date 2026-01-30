import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Woovi (OpenPix) API Wrapper
const createWooviPayment = async (amount: number, correlationID: string, tripName: string, customerData: { name: string, email?: string }) => {
    const isSandbox = process.env.WOOVI_ENV === 'sandbox';
    const baseUrl = isSandbox ? 'https://api.woovi-sandbox.com' : 'https://api.woovi.com';
    const appId = isSandbox ? process.env.WOOVI_APP_ID_SANDBOX : process.env.WOOVI_APP_ID_PROD;

    if (!appId) throw new Error('Woovi App ID not configured');

    const response = await fetch(`${baseUrl}/api/v1/charge`, {
        method: 'POST',
        headers: {
            'Authorization': appId,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            correlationID,
            value: amount, // cents
            comment: `Bus Manager - ${tripName}`,
            customer: {
                name: customerData.name,
                email: customerData.email || 'noreply@busmanager.com'
            },
            expiresIn: 3600 // 1 hour
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Woovi charge');
    }

    return await response.json();
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { passengerIds, tripId, payerName, payerEmail } = req.body;

        if (!passengerIds || !tripId || passengerIds.length === 0) {
            return res.status(400).json({ error: 'Passenger IDs and Trip ID are required' });
        }

        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Get Trip Data
        const { data: trip, error: tripError } = await supabase
            .from('viagens')
            .select('*')
            .eq('id', tripId)
            .single();

        if (tripError || !trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // 2. Pre-generate our Internal ID for strict correlation
        const internalId = uuidv4();
        const totalAmountCents = Math.round(passengerIds.length * trip.preco * 100);

        // 3. Initial Record in 'pagamentos'
        const { data: payment, error: paymentError } = await supabase
            .from('pagamentos')
            .insert([{
                id: internalId,
                viagem_id: tripId,
                valor_total: passengerIds.length * trip.preco,
                status: 'pending',
                passageiros_ids: passengerIds,
                payer_name: payerName || 'Administrador',
                correlation_id: internalId // Explicit correlation
            }])
            .select()
            .single();

        if (paymentError) {
            console.error('Error recording payment:', paymentError);
            return res.status(500).json({ error: 'Failed to record transaction header' });
        }

        // 4. Create Woovi Charge
        const wooviResponse = await createWooviPayment(
            totalAmountCents,
            internalId,
            trip.nome,
            { name: payerName || 'Administrador', email: payerEmail }
        );

        const charge = wooviResponse.charge;

        // 5. Update Payment with External details
        await supabase
            .from('pagamentos')
            .update({
                gateway_id: charge.identifier,
                woovi_charge_id: charge.identifier,
                woovi_txid: charge.txid,
                expires_at: charge.expiresDate
            })
            .eq('id', internalId);

        // 6. Record granular passenger payments
        const passengerPayments = passengerIds.map((pid: string) => ({
            pagamento_id: internalId,
            passageiro_id: pid,
            valor: Math.round(trip.preco * 100)
        }));

        await supabase.from('pagamento_passageiro').insert(passengerPayments);

        return res.status(200).json({
            success: true,
            payment: {
                id: charge.identifier,
                brCode: charge.brCode,
                qrCodeImage: charge.qrCodeImage,
                expiresAt: charge.expiresDate,
                databaseId: internalId
            }
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
