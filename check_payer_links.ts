import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkPayerLinks() {
    const { data: passengers, error } = await supabase
        .from('passageiros')
        .select('id, nome_completo, viagem_id, pago_por, pagamento')
        .not('pago_por', 'is', null);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- Passengers with Payer Links ---');
    passengers.forEach(p => {
        console.log(`ID: ${p.id} | Name: ${p.nome_completo} | Trip: ${p.viagem_id} | Paid By: ${p.pago_por} | Status: ${p.pagamento}`);
    });
}

checkPayerLinks();
