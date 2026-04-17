import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('🔍 Buscando a excursão "Água Rasa"...');
    const { data: trips, error: tripError } = await supabase
        .from('viagens')
        .select('id, nome')
        .ilike('nome', '%Água Rasa%');

    if (tripError || !trips || trips.length === 0) {
        console.error('❌ Excursão não encontrada:', tripError);
        return;
    }

    const tripId = trips[0].id;
    console.log(`✅ Excursão encontrada: ${trips[0].nome} (ID: ${tripId})`);

    console.log('🔍 Buscando a passageira "Maria Eduarda Ferreira Viana"...');
    const { data: passengers, error: passengerError } = await supabase
        .from('passageiros')
        .select('id, nome_completo')
        .ilike('nome_completo', '%Maria Eduarda Ferreira Viana%');

    if (passengerError || !passengers || passengers.length === 0) {
        console.error('❌ Passageira não encontrada:', passengerError);
        return;
    }

    const passengerId = passengers[0].id;
    console.log(`✅ Passageira encontrada: ${passengers[0].nome_completo} (ID: ${passengerId})`);

    console.log('🔍 Buscando inscrições duplicadas...');
    const { data: enrollments, error: enrollError } = await supabase
        .from('viagem_passageiros')
        .select('id, created_at, pagamento, assento')
        .eq('viagem_id', tripId)
        .eq('passageiro_id', passengerId)
        .order('created_at', { ascending: false });

    if (enrollError || !enrollments) {
        console.error('❌ Erro ao buscar inscrições:', enrollError);
        return;
    }

    if (enrollments.length <= 1) {
        console.log('ℹ️ Não foram encontradas duplicatas para esta passageira nesta viagem.');
        return;
    }

    console.log(`⚠️ Encontradas ${enrollments.length} inscrições. Removendo as excedentes...`);
    
    // Mantemos a primeira da lista (mais recente) e apagar o resto.
    const toDelete = enrollments.slice(1);
    
    for (const enroll of toDelete) {
        console.log(`🗑️ Removendo inscrição ID: ${enroll.id} (Criada em: ${enroll.created_at})`);
        const { error: deleteError } = await supabase
            .from('viagem_passageiros')
            .delete()
            .eq('id', enroll.id);
        
        if (deleteError) {
            console.error(`❌ Erro ao remover ${enroll.id}:`, deleteError);
        } else {
            console.log(`✅ Inscrição ${enroll.id} removida.`);
        }
    }

    console.log('✨ Limpeza concluída!');
}

cleanup();
