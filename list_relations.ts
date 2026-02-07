import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listRelations() {
    console.log('--- Relações Viagem-Ônibus ---');
    const { data: relations } = await supabase
        .from('viagem_onibus')
        .select('viagem_id, onibus_id');

    relations?.forEach(r => {
        console.log(`Viagem: ${r.viagem_id} | Ônibus: ${r.onibus_id} (${r.onibus_id.length} chars)`);
    });
}

listRelations();
