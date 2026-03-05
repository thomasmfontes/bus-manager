import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { enrollmentId, requesterId } = req.body;

    if (!enrollmentId) {
        return res.status(400).json({ error: 'Missing required field: enrollmentId' });
    }

    try {
        console.log(`🗑️ [API] Removendo (soft-delete) inscrição ${enrollmentId}`);

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
                    return res.status(403).json({ error: 'Você não tem permissão para realizar esta desistência.' });
                }
            }
        }

        const { data: updated, error: updateError } = await supabase
            .from('viagem_passageiros')
            .update({
                assento: 'DESISTENTE',
                onibus_id: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', enrollmentId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ [API] Supabase Update Error:', updateError);
            throw updateError;
        }

        if (!updated) {
            return res.status(404).json({ error: 'Inscrição não encontrada.' });
        }

        console.log('✅ [API] Registro atualizado para DESISTENTE:', updated.id);
        return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        console.error('❌ [API] Error in removal:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
