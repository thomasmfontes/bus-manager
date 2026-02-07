import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkSpecificEnrollment() {
    const enrollmentId = '8c37b2d1-e321-41fd-8f15-70d87bbcd219';
    console.log(`--- Verificando Inscrição: ${enrollmentId} ---`);

    try {
        const { data: enrollment, error } = await supabase
            .from('viagem_passageiros')
            .select('*')
            .eq('id', enrollmentId);

        if (error) {
            console.error('Erro Supabase:', error);
            return;
        }

        console.log('Resultados encontrados:', enrollment?.length);
        if (enrollment && enrollment.length > 0) {
            console.log('Dados da Inscrição:', JSON.stringify(enrollment[0], null, 2));
        } else {
            console.log('Nenhuma inscrição encontrada com esse ID exato.');
        }
    } catch (e) {
        console.error('Erro Fatal:', e);
    }
}

checkSpecificEnrollment();
