import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function getEvidence() {
    try {
        console.log('--- COLUNAS: pagamentos ---');
        const { data: colsP, error: errorP } = await supabase.rpc('get_table_columns', { table_name: 'pagamentos' });
        // Se rpc não existir, fazemos select 1
        const { data: sampleP } = await supabase.from('pagamentos').select('*').limit(1);
        console.log(Object.keys(sampleP?.[0] || {}));

        console.log('\n--- COLUNAS: pagamento_passageiro ---');
        const { data: samplePP } = await supabase.from('pagamento_passageiro').select('*').limit(1);
        console.log(Object.keys(samplePP?.[0] || {}));

        console.log('\n--- ÍNDICES ---');
        const { data: indexes, error: indexError } = await supabase.rpc('get_table_indexes', { t_names: ['pagamentos', 'pagamento_passageiro'] });
        if (indexError) {
            // Fallback query via raw sql if possible, but rpc might not be enabled.
            // I'll just check if the correlation_id is unique by attempting an insert or similar if I had to, 
            // but I already wrote the migration with UNIQUE constraint.
            console.log('RPC get_table_indexes not active. Reference migration script for index/constraint logic.');
        } else {
            console.log(indexes);
        }

    } catch (e) {
        console.error(e);
    }
}

getEvidence();
