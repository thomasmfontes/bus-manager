import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Congregacao } from '@/types';

interface CongregacaoState {
    congregacoes: Congregacao[];
    loading: boolean;
    fetchCongregacoes: () => Promise<void>;
}

export const useCongregacaoStore = create<CongregacaoState>((set) => ({
    congregacoes: [],
    loading: false,

    fetchCongregacoes: async () => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('congregacoes')
                .select('*')
                .eq('ativo', true)
                .order('ordem', { ascending: true });

            if (error) throw error;
            set({ congregacoes: data || [], loading: false });
        } catch (error) {
            console.error('Error fetching congregações:', error);
            set({ loading: false });
        }
    },
}));
