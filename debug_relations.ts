import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function debugRelations() {
    const { data: relations } = await supabase
        .from('viagem_onibus')
        .select('*');

    let content = '--- Relações Viagem-Ônibus ---\n';
    relations?.forEach(r => {
        content += `Viagem: ${r.viagem_id} | Ônibus: ${r.onibus_id} (${r.onibus_id.length} chars)\n`;
    });

    fs.writeFileSync('relations_debug.txt', content);
    console.log('Arquivo relations_debug.txt criado.');
}

debugRelations();
