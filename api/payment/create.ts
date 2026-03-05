import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Woovi (OpenPix) API Wrapper
const createWooviPayment = async (amount: number, correlationID: string, tripName: string, customerData: { name: string, email?: string }) => {
    const isSandbox = process.env.WOOVI_ENV === 'sandbox';
    const baseUrl = isSandbox ? 'https://api.woovi-sandbox.com' : 'https://api.woovi.com';
    const appId = isSandbox ? process.env.WOOVI_APP_ID_SANDBOX : process.env.WOOVI_APP_ID_PROD;

    if (!appId) {
        console.error(`[Woovi] Configuration missing. Env: ${process.env.WOOVI_ENV}, SandAppId: ${!!process.env.WOOVI_APP_ID_SANDBOX}, ProdAppId: ${!!process.env.WOOVI_APP_ID_PROD}`);
        throw new Error('Configuração do gateway de pagamento pendente (App ID não encontrado).');
    }

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
            expiresIn: 300 // 5 minutes
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = 'Falha ao criar cobrança no Woovi';
        try {
            const errorData = JSON.parse(errorBody);
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            console.error('Woovi returned non-JSON error:', errorBody);
        }
        throw new Error(errorMessage);
    }

    return await response.json();
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { passengerIds, tripId, payerName, payerEmail, payerId } = req.body;

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

        // 2. Resolve Enrollments (Ensure every passenger is linked to this trip)
        const resolvedPassengerIds: string[] = [];

        for (const pid of passengerIds) {
            // Check if enrollment already exists for this trip
            const { data: enrollment, error: eError } = await supabase
                .from('viagem_passageiros')
                .select('id')
                .eq('passageiro_id', pid)
                .eq('viagem_id', tripId)
                .maybeSingle();

            if (eError) {
                console.error('Error checking enrollment:', eError);
                continue;
            }

            if (!enrollment) {
                // Create enrollment for this trip
                const { error: enrollError } = await supabase
                    .from('viagem_passageiros')
                    .insert([{
                        passageiro_id: pid,
                        viagem_id: tripId,
                        pagamento: 'Pendente',
                        pago_por: payerId || null
                    }]);

                if (enrollError) {
                    console.error('Error creating enrollment during payment:', enrollError);
                    continue;
                }
            } else if (payerId) {
                // Update existing enrollment with payer link
                await supabase
                    .from('viagem_passageiros')
                    .update({ pago_por: payerId })
                    .eq('id', enrollment.id);
            }

            resolvedPassengerIds.push(pid);
        }

        if (resolvedPassengerIds.length === 0) {
            return res.status(400).json({ error: 'No valid passengers found' });
        }

        // 3. Pre-generate our Internal ID for strict correlation
        const internalId = crypto.randomUUID();
        const totalAmountCents = Math.round(resolvedPassengerIds.length * trip.preco * 100);

        // 4. Initial Record in 'pagamentos'
        const { error: paymentError } = await supabase
            .from('pagamentos')
            .insert([{
                id: internalId,
                viagem_id: tripId,
                valor_total: resolvedPassengerIds.length * trip.preco,
                status: 'pending',
                passageiros_ids: resolvedPassengerIds, // Use the NEW IDs
                payer_name: payerName || 'Anônimo',
                correlation_id: internalId
            }])
            .select()
            .single();

        if (paymentError) {
            console.error('Error recording payment:', paymentError);
            return res.status(500).json({ error: 'Failed to record transaction header' });
        }

        // 5. Create Woovi Charge
        const wooviResponse = await createWooviPayment(
            totalAmountCents,
            internalId,
            trip.nome,
            { name: payerName || 'Anônimo', email: payerEmail }
        );

        const charge = wooviResponse.charge;

        // 6. Update Payment with External details
        await supabase
            .from('pagamentos')
            .update({
                gateway_id: charge.identifier,
                woovi_charge_id: charge.identifier,
                woovi_txid: charge.txid,
                expires_at: charge.expiresDate
            })
            .eq('id', internalId);

        // 7. Record granular passenger payments
        const passengerPayments = resolvedPassengerIds.map((pid: string) => ({
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
