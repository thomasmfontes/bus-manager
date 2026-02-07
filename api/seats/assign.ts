import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { passageiroId, assento, viagemId, onibusId } = req.body;

    if (!passageiroId || !viagemId) {
        return res.status(400).json({ error: 'Missing required fields: passageiroId and viagemId' });
    }

    const normalizedViagemId = viagemId.trim().toLowerCase();

    try {
        console.log(`🚀 [API] Atribuindo assento ${assento} para passageiro ${passageiroId} na viagem ${normalizedViagemId}`);

        // 1. Check if enrollment exists
        const { data: enrollment, error: eError } = await supabase
            .from('viagem_passageiros')
            .select('id, pagamento')
            .eq('passageiro_id', passageiroId)
            .eq('viagem_id', normalizedViagemId)
            .maybeSingle();

        if (eError) throw eError;

        if (enrollment) {
            // 2. Update existing
            const { data: updated, error: updateError } = await supabase
                .from('viagem_passageiros')
                .update({
                    onibus_id: onibusId || null,
                    assento: assento || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', enrollment.id)
                .select()
                .single();

            if (updateError) throw updateError;
            console.log('✅ [API] Registro atualizado:', updated.id);
            return res.status(200).json({ success: true, data: updated });
        } else {
            // 3. Create new
            const { data: inserted, error: insertError } = await supabase
                .from('viagem_passageiros')
                .insert([{
                    passageiro_id: passageiroId,
                    viagem_id: normalizedViagemId,
                    onibus_id: onibusId || null,
                    assento: assento || null,
                    pagamento: 'Pendente',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (insertError) throw insertError;
            console.log('✅ [API] Novo registro criado:', inserted.id);
            return res.status(200).json({ success: true, data: inserted });
        }
    } catch (error: any) {
        console.error('❌ [API] Error in assignment:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
