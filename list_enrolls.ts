import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listEnrolls() {
    const { data: enrolls } = await supabase
        .from('viagem_passageiros')
        .select(`
            id,
            passageiro_id,
            viagem_id,
            assento,
            pagamento,
            passageiro:passageiros(nome_completo)
        `)
        .order('created_at', { ascending: false });

    console.log('--- Inscrições Atuais ---');
    enrolls?.forEach(e => {
        console.log(`P: ${(e.passageiro as any)?.nome_completo} | V: ${e.viagem_id} | Assento: ${e.assento} | Status: ${e.pagamento}`);
    });
}

listEnrolls();
