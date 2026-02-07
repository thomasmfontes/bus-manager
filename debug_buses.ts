import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function writeIds() {
    const { data: buses } = await supabase
        .from('onibus')
        .select('id, nome');

    let content = '--- Ônibus no Banco ---\n';
    buses?.forEach(b => {
        content += `ID: ${b.id} (${b.id.length} chars) | Nome: ${b.nome}\n`;
    });

    fs.writeFileSync('buses_final.txt', content);
    console.log('Arquivo buses_final.txt criado.');
}

writeIds();
