
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqhuqsvlcnvleobwdpga.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaHVxc3ZsY252bGVvYndkcGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDExNjA1MywiZXhwIjoyMDc5NjkyMDUzfQ.AL_Bf2jLsQi_05RGIrAOwavLWGCyjPZKEjqqchbuO2Y';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mimic the logic in useAuthStore.ts
function onlyDigits(str) {
    return String(str).replace(/\D/g, '');
}

function maskCPF(value) {
    const digits = onlyDigits(value).slice(0, 11);
    return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

function maskRG(value) {
    const digits = onlyDigits(value).slice(0, 9);
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

async function verifyLoginMatch(documento) {
    const cleanDoc = onlyDigits(documento);
    const maskedCPF = maskCPF(documento);
    const maskedRG = maskRG(documento);

    console.log(`Searching for: "${documento}" (Clean: "${cleanDoc}", MaskedCPF: "${maskedCPF}", MaskedRG: "${maskedRG}")`);

    const { data: results, error } = await supabase
        .from('passageiros')
        .select('id, cpf_rg, nome_completo')
        .or(`cpf_rg.eq."${documento}",cpf_rg.eq."${cleanDoc}",cpf_rg.eq."${maskedCPF}",cpf_rg.eq."${maskedRG}"`);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (results && results.length > 0) {
        console.log('✅ MATCH FOUND:');
        console.dir(results, { depth: null });
    } else {
        console.log('❌ NO MATCH FOUND');
    }
}

async function runTest() {
    // Test with a known CPF from the previous dump (e.g., '500.208.788-42')
    // We'll try to find it using the clean version to test the improved logic.
    await verifyLoginMatch('50020878842');
    console.log('---');
    // Test with another one
    await verifyLoginMatch('07887424771');
}

runTest();
