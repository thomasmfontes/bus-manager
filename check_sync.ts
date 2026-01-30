import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkLastPayment() {
    try {
        console.log('--- Ultimo Pagamento ---');
        const { data: pay } = await supabase
            .from('pagamentos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!pay) {
            console.log('Nenhum pagamento encontrado.');
            return;
        }

        console.log('ID Pagamento:', pay.id);
        console.log('Status Pagamento:', pay.status);
        console.log('Viagem ID:', pay.viagem_id);
        console.log('Passageiros IDs (no pagamentos):', pay.passageiros_ids);

        console.log('\n--- Status dos Passageiros Relacionados ---');
        const { data: passengers } = await supabase
            .from('passageiros')
            .select('id, nome_completo, pagamento, viagem_id')
            .in('id', pay.passageiros_ids || []);

        passengers?.forEach(p => {
            console.log(`- ${p.nome_completo} (${p.id}): ${p.pagamento} [Viagem: ${p.viagem_id === pay.viagem_id ? 'OK' : 'MISMATCH'}]`);
        });

    } catch (e) {
        console.error(e);
    }
}

checkLastPayment();
