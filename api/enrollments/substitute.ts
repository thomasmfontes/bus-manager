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

        // 3. Update the enrollment
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

        console.log(`✅ [API] Inscrição ${enrollmentId} transferida para passageiro ${targetPassengerId}`);
        return res.status(200).json({ success: true, data: updated });

    } catch (error: any) {
        console.error('❌ [API] Error in substitution:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
