import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listBuses() {
    const { data: buses } = await supabase
        .from('onibus')
        .select('id, nome');

    console.log('--- Ônibus no Banco ---');
    buses?.forEach(b => {
        console.log(`ID: ${b.id} (${b.id.length} chars) | Nome: ${b.nome}`);
    });
}

listBuses();
