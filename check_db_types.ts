import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkTypes() {
    console.log('--- Verificando tipos das colunas em viagem_passageiros ---');

    // We can't easily get the type without a specific RPC or checking pg_catalog,
    // but we can try to see what's in there or look at the table definition if we had access.
    // Let's try to fetch a single row and check the format.
    const { data, error } = await supabase
        .from('viagem_passageiros')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('Exemplo de IDs:');
    console.log('id:', data.id);
    console.log('viagem_id:', data.viagem_id);
    console.log('passageiro_id:', data.passageiro_id);
}

checkTypes();
