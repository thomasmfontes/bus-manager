import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function findTraces() {
    const leonardo1 = '30fad73d-006f-491d-a866-d24e06a3a961'; // Leonardo de Souza Baldo
    const leonardo2 = '65630f5b-1c4f-4123-a4d0-f1948d85e367'; // Leonardo Baldo
    const ids = [leonardo1, leonardo2];

    console.log('🔍 Iniciando busca profunda por rastros de pagamento (V2)...');

    // 1. Check pagamentos table using the plural column and payer_id
    console.log('\n--- Tabela: pagamentos ---');
    // For arrays in Supabase/Postgrest, we can use 'cs' (contains) or check payer_id
    const { data: payments, error: pError } = await supabase
        .from('pagamentos')
        .select('*');
    
    if (pError) {
        console.error(pError);
    } else {
        const filtered = payments.filter(p => {
            const isPayer = ids.includes(p.payer_id);
            const inList = p.passageiros_ids && p.passageiros_ids.some((id: string) => ids.includes(id));
            return isPayer || inList;
        });
        console.table(filtered.map(p => ({
            id: p.id,
            payer_id: p.payer_id,
            payer_name: p.payer_name,
            valor: p.valor_total,
            status: p.status,
            pIds: p.passageiros_ids
        })));
    }

    // 2. Check viagem_passageiros (Inscrições)
    console.log('\n--- Tabela: viagem_passageiros ---');
    const { data: enrolls, error: eError } = await supabase
        .from('viagem_passageiros')
        .select('*')
        .in('passageiro_id', ids);
    
    if (eError) console.error(eError);
    else console.table(enrolls.map(e => ({
        id: e.id,
        trip_id: e.viagem_id,
        pId: e.passageiro_id,
        pagamento: e.pagamento,
        valor: e.valor_pago,
        assento: e.assento
    })));
}

findTraces();
