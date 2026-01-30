import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fixSync() {
    try {
        console.log('--- Iniciando Sincronização Manual ---');

        // Find all paid payments
        const { data: paidPayments } = await supabase
            .from('pagamentos')
            .select('id, viagem_id, passageiros_ids')
            .eq('status', 'paid');

        if (!paidPayments) {
            console.log('Nenhum pagamento pago encontrado.');
            return;
        }

        console.log(`Encontrados ${paidPayments.length} pagamentos confirmados.`);

        for (const pay of paidPayments) {
            if (!pay.passageiros_ids || pay.passageiros_ids.length === 0) continue;

            console.log(`Sincronizando pagamento ${pay.id}...`);
            const { error: pErr } = await supabase
                .from('passageiros')
                .update({ pagamento: 'Pago' })
                .in('id', pay.passageiros_ids)
                .eq('viagem_id', pay.viagem_id);

            if (pErr) {
                console.error(`Erro ao sincronizar passageiros do pagamento ${pay.id}:`, pErr);
            } else {
                console.log(`✅ ${pay.passageiros_ids.length} passageiros atualizados para 'Pago'.`);
            }
        }

        console.log('--- Sincronização Concluída ---');

    } catch (e) {
        console.error(e);
    }
}

fixSync();
