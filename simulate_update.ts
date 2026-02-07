import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function simulateUpdate() {
    const enrollmentId = '8c37b2d1-e321-41fd-8f15-70d87bbcd219';
    const assento = '2';
    const onibusId = 'e07753d8-60a1-4ed5-8145-12ccced715a3'; // Removed the extra 'b' if it was there

    console.log(`Tentando atualizar inscrição ${enrollmentId}...`);

    const { data, error, status, statusText } = await supabase
        .from('viagem_passageiros')
        .update({
            assento: assento,
            onibus_id: onibusId
        })
        .eq('id', enrollmentId)
        .select();

    if (error) {
        console.error('❌ Erro no update:', error);
        console.error('Status:', status, statusText);
    } else {
        console.log('✅ Resposta do Supabase (data):', data);
        console.log('Status:', status, statusText);
        if (data && data.length > 0) {
            console.log('Registro atualizado com sucesso no banco.');
        } else {
            console.log('⚠️ Nenhum registro foi alterado (data vazio).');
        }
    }
}

simulateUpdate();
