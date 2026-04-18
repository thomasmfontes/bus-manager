import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials (SERVICE_ROLE_KEY required)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    const enrollmentId = 'db706b09-0308-41c1-b6fd-8cf94e788da9';
    console.log(`🗑️ Executando delete administrativo para a inscrição: ${enrollmentId}`);
    
    const { data, error } = await supabase
        .from('viagem_passageiros')
        .delete()
        .eq('id', enrollmentId)
        .select();

    if (error) {
        console.error('❌ Erro Supabase:', error);
    } else {
        console.log('✅ Resultado:', data);
        if (data && data.length > 0) {
            console.log('✨ Inscrição removida com sucesso!');
        } else {
            console.log('⚠️ Nenhuma inscrição encontrada com este ID para remover.');
        }
    }
}

cleanup();
