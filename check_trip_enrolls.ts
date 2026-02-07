import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkTripEnrollments() {
    const tripId = '52fc850c-befc-4bf3-bf9d-13874c46c35b'; // From user screenshot
    const { data, count, error } = await supabase
        .from('viagem_passageiros')
        .select('*', { count: 'exact' })
        .eq('viagem_id', tripId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`--- Inscrições para a viagem ${tripId} ---`);
    console.log(`Total: ${count}`);
    data?.forEach(e => {
        console.log(`ID: ${e.id} | Passageiro: ${e.passageiro_id} | Assento: ${e.assento} | Status: ${e.pagamento}`);
    });
}

checkTripEnrollments();
