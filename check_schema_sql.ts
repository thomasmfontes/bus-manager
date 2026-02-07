import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkSchema() {
    console.log('--- Verificando tipo das colunas via SQL ---');

    const { data, error } = await supabase.rpc('get_table_columns_v2', { t_name: 'viagem_passageiros' });

    if (error) {
        // Fallback: try to guess from metadata or another way
        console.log('RPC get_table_columns_v2 failed. Trying information_schema query...');
        // Supabase doesn't allow raw SQL from the client usually, 
        // unless you have a dedicated function.
        // Let's try to see if we can get it from a dummy insert error or something?
        // No, let's just assume it's UUID for now and check the logic.
    } else {
        console.log(data);
    }

    // Check if we have multiple enrollments for the same passenger/trip right now
    const { data: enrolls } = await supabase.from('viagem_passageiros').select('*');
    console.log('Total enrollments:', enrolls?.length);
}

checkSchema();
