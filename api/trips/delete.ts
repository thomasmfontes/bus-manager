import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { tripId } = req.query;

    if (!tripId || typeof tripId !== 'string') {
        return res.status(400).json({ error: 'Missing required field: tripId' });
    }

    try {
        console.log(`🗑️ [API] Deletando viagem e dependencias: ${tripId}`);

        // 1. Delete all payments associated with this trip
        const { error: paymentError } = await supabase
            .from('pagamentos')
            .delete()
            .eq('viagem_id', tripId);

        if (paymentError) console.error('⚠️ [API] Erro ao deletar pagamentos associados:', paymentError);

        // 2. Delete all enrollments (viagem_passageiros)
        const { error: enrollError } = await supabase
            .from('viagem_passageiros')
            .delete()
            .eq('viagem_id', tripId);

        if (enrollError) console.error('⚠️ [API] Erro ao deletar inscricoes da viagem:', enrollError);

        // 3. Delete trip-bus relationships
        const { error: relationError } = await supabase
            .from('viagem_onibus')
            .delete()
            .eq('viagem_id', tripId);

        if (relationError) console.error('⚠️ [API] Erro ao deletar relacoes onibus-viagem:', relationError);

        // 4. Finally, delete the trip itself
        const { data: deletedTrip, error: deleteError } = await supabase
            .from('viagens')
            .delete()
            .eq('id', tripId)
            .select()
            .single();

        if (deleteError) {
            console.error('❌ [API] Supabase Delete Error:', deleteError);
            throw deleteError;
        }

        if (!deletedTrip) {
            return res.status(404).json({ error: 'Viagem nao encontrada no banco de dados.' });
        }

        console.log('✅ [API] Viagem deletada com sucesso:', deletedTrip.id);
        return res.status(200).json({ success: true, data: deletedTrip });
    } catch (error: any) {
        console.error('❌ [API] Error in deletion:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
