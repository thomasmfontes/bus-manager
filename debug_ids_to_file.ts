import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkEnrollments() {
    let output = '--- CHECKING ENROLLMENTS ---\n';
    const { data, error } = await supabase.from('viagem_passageiros').select('*, passageiro:passageiros(nome_completo)').limit(10);

    if (error) {
        output += `Error fetching enrollments: ${error.message}\n`;
    } else {
        output += `Found ${data.length} enrollments.\n`;
        data.forEach(e => {
            output += `Trip: ${e.viagem_id} | Seat: ${e.assento} | Passenger: ${e.passageiro?.nome_completo}\n`;
        });
    }

    const { data: ps } = await supabase.from('passageiros').select('id, nome_completo').eq('nome_completo', 'BLOQUEADO').limit(1);
    output += `\nBLOQUEADO identity: ${JSON.stringify(ps[0] || 'Not found')}\n`;

    fs.writeFileSync('debug_output.txt', output);
    console.log('Results written to debug_output.txt');
}

checkEnrollments();
