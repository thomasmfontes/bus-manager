import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkEnrollments() {
    console.log('--- CHECKING ENROLLMENTS ---');
    const { data, error } = await supabase.from('viagem_passageiros').select('*, passageiro:passageiros(nome_completo)').limit(10);

    if (error) {
        console.error('Error fetching enrollments:', error.message);
    } else {
        console.log(`Found ${data.length} enrollments.`);
        data.forEach(e => {
            console.log(`Trip: ${e.viagem_id} | Seat: ${e.assento} | Passenger: ${e.passageiro?.nome_completo}`);
        });
    }
}

checkEnrollments();
