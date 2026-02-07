import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testAssignment() {
    // Let's find a passenger who is in a trip but has no seat
    console.log('--- Buscando passageiro para teste ---');
    const { data: enrolls } = await supabase
        .from('viagem_passageiros')
        .select('*, passageiros(nome_completo)')
        .is('assento', null)
        .limit(1);

    if (!enrolls || enrolls.length === 0) {
        console.log('Nenhum passageiro sem assento encontrado para teste.');
        return;
    }

    const testEnroll = enrolls[0];
    const passageiroId = testEnroll.passageiro_id;
    const viagemId = testEnroll.viagem_id;
    const testSeat = '99'; // Dummy seat
    const onibusId = testEnroll.onibus_id || '00000000-0000-0000-0000-000000000000'; // Fallback or use existing

    console.log(`Testando atribuição para: ${(testEnroll.passageiros as any)?.nome_completo}`);
    console.log(`ID: ${passageiroId}, Viagem: ${viagemId}, Assento: ${testSeat}`);

    // Simulation of atribuirAssento logic
    const normalizedViagemId = viagemId.trim().toLowerCase();

    const { data: enrollment, error: eError } = await supabase
        .from('viagem_passageiros')
        .select('id')
        .eq('passageiro_id', passageiroId)
        .eq('viagem_id', normalizedViagemId)
        .maybeSingle();

    if (eError) {
        console.error('Erro na busca:', eError);
        return;
    }

    console.log('Busca resultou em:', enrollment);

    if (enrollment) {
        console.log('Atualizando registro existente...');
        const { data, error: updateError } = await supabase
            .from('viagem_passageiros')
            .update({
                assento: testSeat,
                onibus_id: onibusId
            })
            .eq('id', enrollment.id)
            .select();

        if (updateError) {
            console.error('Erro no update:', updateError);
        } else {
            console.log('✅ Update realizado com sucesso:', data);
        }
    } else {
        console.log('Inserindo novo registro...');
        const { data, error: insertError } = await supabase
            .from('viagem_passageiros')
            .insert([{
                passageiro_id: passageiroId,
                viagem_id: normalizedViagemId,
                assento: testSeat,
                onibus_id: onibusId,
                pagamento: 'Pendente'
            }])
            .select();

        if (insertError) {
            console.error('Erro no insert:', insertError);
        } else {
            console.log('✅ Insert realizado com sucesso:', data);
        }
    }
}

testAssignment();
