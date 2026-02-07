import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function inspectId() {
    const { data: buses } = await supabase
        .from('onibus')
        .select('id, nome')
        .ilike('nome', '%Água Rasa 2%');

    if (!buses || buses.length === 0) {
        console.log('Ônibus não encontrado');
        return;
    }

    const id = buses[0].id;
    console.log(`Nome: ${buses[0].nome}`);
    console.log(`ID: "${id}"`);
    console.log(`Length: ${id.length}`);

    for (let i = 0; i < id.length; i++) {
        console.log(`Char ${i}: ${id[i]} (code: ${id.charCodeAt(i)})`);
    }
}

inspectId();
