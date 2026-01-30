import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://uqhuqsvlcnvleobwdpga.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaHVxc3ZsY252bGVvYndkcGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDExNjA1MywiZXhwIjoyMDc5NjkyMDUzfQ.AL_Bf2jLsQi_05RGIrAOwavLWGCyjPZKEjqqchbuO2Y');

async function getIds() {
    const { data: trips } = await supabase.from('viagens').select('id, nome').limit(1);
    const { data: passengers } = await supabase.from('passageiros').select('id, nome_completo').limit(2);

    console.log('TRIP:', trips?.[0]);
    console.log('PASSENGERS:', passengers);
}

getIds();
