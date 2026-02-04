
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqhuqsvlcnvleobwdpga.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaHVxc3ZsY252bGVvYndkcGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDExNjA1MywiZXhwIjoyMDc5NjkyMDUzfQ.AL_Bf2jLsQi_05RGIrAOwavLWGCyjPZKEjqqchbuO2Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPassengers() {
    const { data, error } = await supabase
        .from('passageiros')
        .select('id, nome_completo, cpf_rg')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching passengers:', error);
        return;
    }

    console.log('Sample passengers:');
    console.dir(data, { depth: null });
}

checkPassengers();
