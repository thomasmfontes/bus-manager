import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkTripEnrollments() {
    const tripId = '52fc850c-befc-4bf3-bf9d-13874c46c35b';
    const { data: enrolls, error } = await supabase
        .from('viagem_passageiros')
        .select(`
            id,
            assento,
            pagamento,
            passageiro:passageiros(id, nome_completo, cpf_rg)
        `)
        .eq('viagem_id', tripId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`--- Inscrições para a viagem ${tripId} ---`);
    enrolls?.forEach(e => {
        const p = e.passageiro as any;
        console.log(`Assento: ${e.assento || 'NENHUM'} | Status: ${e.pagamento} | Nome: ${p?.nome_completo} (${p?.cpf_rg})`);
    });
}

checkTripEnrollments();
