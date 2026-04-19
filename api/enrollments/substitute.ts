import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { enrollmentId, newPassengerData, requesterId } = req.body;

    if (!enrollmentId || !newPassengerData || !newPassengerData.nome_completo || !newPassengerData.cpf_rg) {
        return res.status(400).json({ error: 'Missing required fields: enrollmentId, newPassengerData (nome_completo, cpf_rg)' });
    }

    try {
        console.log(`🔄 [API] Iniciando substituição para inscrição ${enrollmentId}`);

        // 1. Get current enrollment and verify permission
        const { data: enrollment, error: fetchErr } = await supabase
            .from('viagem_passageiros')
            .select('*')
            .eq('id', enrollmentId)
            .single();

        if (fetchErr || !enrollment) {
            return res.status(404).json({ error: 'Inscrição não encontrada.' });
        }

        // Security check
        if (requesterId) {
            const isPayer = enrollment.pago_por === requesterId;
            const isOwner = enrollment.passageiro_id === requesterId;

            if (!isPayer && !isOwner) {
                // Check if admin
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', requesterId)
                    .single();

                if (profile?.role !== 'admin') {
                    return res.status(403).json({ error: 'Você não tem permissão para realizar esta transferência.' });
                }
            }
        }

        // 2. Find or create the new passenger
        const cleanDoc = newPassengerData.cpf_rg.replace(/\D/g, '');

        // Try to find by doc or name (to be safe, though doc is better)
        const { data: existingPassenger } = await supabase
            .from('passageiros')
            .select('id')
            .or(`cpf_rg.eq.${cleanDoc},nome_completo.ilike.${newPassengerData.nome_completo}`)
            .maybeSingle();

        let targetPassengerId = existingPassenger?.id;

        if (!targetPassengerId) {
            console.log(`🆕 [API] Criando novo passageiro: ${newPassengerData.nome_completo}`);
            const { data: newP, error: createErr } = await supabase
                .from('passageiros')
                .insert([{
                    nome_completo: newPassengerData.nome_completo,
                    cpf_rg: cleanDoc,
                    telefone: newPassengerData.telefone || null,
                }])
                .select()
                .single();

            if (createErr) throw createErr;
            targetPassengerId = newP.id;
        }

        const tripId = enrollment.viagem_id;
        const oldPassengerId = enrollment.passageiro_id;

        // 2.1 Check if target passenger is already enrolled in this trip
        const { data: existingEnrollment } = await supabase
            .from('viagem_passageiros')
            .select('*')
            .eq('viagem_id', tripId)
            .eq('passageiro_id', targetPassengerId)
            .maybeSingle();

        let finalEnrollmentToReturn;

        if (existingEnrollment) {
            console.log(`⚠️ [API] Passageiro já possui inscrição ${existingEnrollment.id} nesta viagem (Assento: ${existingEnrollment.assento})`);
            
            // If it's the exact same enrollment, no-op success
            if (existingEnrollment.id === enrollmentId) {
                return res.status(200).json({ success: true, data: existingEnrollment });
            }

            // If target is DESISTENTE, we can "reactivate" them by transferring the payment from the old enrollment
            if (existingEnrollment.assento === 'DESISTENTE') {
                console.log(`✅ [API] Reativando inscrição desistente ${existingEnrollment.id}`);
                
                // Transfer payment data from source enrollment to this one
                const { data: reactivated, error: reactivateErr } = await supabase
                    .from('viagem_passageiros')
                    .update({
                        assento: null,
                        onibus_id: null,
                        pagamento: enrollment.pagamento,
                        valor_pago: enrollment.valor_pago,
                        pago_por: enrollment.pago_por,
                        status: enrollment.status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingEnrollment.id)
                    .select()
                    .single();

                if (reactivateErr) throw reactivateErr;

                // Mark the ORIGINAL enrollment as deleted/canceled since we merged it
                await supabase.from('viagem_passageiros').delete().eq('id', enrollmentId);
                
                finalEnrollmentToReturn = reactivated;
            } else {
                // If it's an active enrollment, we can't substitute onto a person who already has a spot
                return res.status(400).json({ error: 'O passageiro selecionado já possui uma vaga ativa nesta viagem.' });
            }
        } else {
            // 3. Normal Update the enrollment (original logic)
            const { data: updated, error: updateErr } = await supabase
                .from('viagem_passageiros')
                .update({
                    passageiro_id: targetPassengerId,
                    assento: null, // Clear seat so new passenger can choose
                    onibus_id: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', enrollmentId)
                .select()
                .single();

            if (updateErr) throw updateErr;
            finalEnrollmentToReturn = updated;
        }

        // 4. Sync with Pagamentos
        console.log(`🔗 [API] Sincronizando pagamentos para a troca ${oldPassengerId} -> ${targetPassengerId}`);

        // Get the payment ID from the junction table first for accuracy
        const { data: pLinks } = await supabase
            .from('pagamento_passageiro')
            .select('pagamento_id')
            .eq('passageiro_id', oldPassengerId);

        const paymentIds = (pLinks || []).map(l => l.pagamento_id);

        if (paymentIds.length > 0) {
            // Find payments that belong to this trip
            const { data: paymentsToUpdate } = await supabase
                .from('pagamentos')
                .select('id, passageiros_ids')
                .eq('viagem_id', tripId)
                .in('id', paymentIds);

            if (paymentsToUpdate && paymentsToUpdate.length > 0) {
                for (const payment of paymentsToUpdate) {
                    const currentIds = payment.passageiros_ids || [];
                    const newIds = currentIds.map((id: string) =>
                        String(id).toLowerCase() === String(oldPassengerId).toLowerCase() ? targetPassengerId : id
                    );

                    console.log(`📝 [API] Atualizando pagamento ${payment.id}: [${currentIds}] -> [${newIds}]`);

                    const { error: payUpdateErr } = await supabase
                        .from('pagamentos')
                        .update({ passageiros_ids: newIds })
                        .eq('id', payment.id);

                    if (payUpdateErr) {
                        console.error(`❌ [API] Erro ao atualizar pagamento ${payment.id}:`, payUpdateErr);
                    }

                    // Update the ledger (join table)
                    const { error: junctionUpdateErr } = await supabase
                        .from('pagamento_passageiro')
                        .update({ passageiro_id: targetPassengerId })
                        .eq('pagamento_id', payment.id)
                        .eq('passageiro_id', oldPassengerId);

                    if (junctionUpdateErr) {
                        console.error(`❌ [API] Erro ao atualizar junção pagamento_passageiro:`, junctionUpdateErr);
                    }
                }
            }
        }

        console.log(`✅ [API] Inscrição ${enrollmentId} transferida para passageiro ${targetPassengerId}`);
        return res.status(200).json({ success: true, data: finalEnrollmentToReturn });

    } catch (error: any) {
        console.error('❌ [API] Error in substitution:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
