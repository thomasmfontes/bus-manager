import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Instrumento, CategoriaInstrumento } from '@/types';

interface InstrumentoState {
    instrumentos: Instrumento[];
    categorias: CategoriaInstrumento[];
    loading: boolean;
    fetchInstrumentos: () => Promise<void>;
    fetchCategorias: () => Promise<void>;
    getInstrumentosPorCategoria: (categoriaId: string) => Instrumento[];
}

export const useInstrumentoStore = create<InstrumentoState>((set, get) => ({
    instrumentos: [],
    categorias: [],
    loading: false,

    fetchCategorias: async () => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('categorias_instrumentos')
                .select('*')
                .eq('ativo', true)
                .order('ordem', { ascending: true });

            if (error) throw error;
            set({ categorias: data || [], loading: false });
        } catch (error) {
            console.error('Error fetching categorias:', error);
            set({ loading: false });
        }
    },

    fetchInstrumentos: async () => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('instrumentos')
                .select('*')
                .eq('ativo', true)
                .order('ordem', { ascending: true });

            if (error) throw error;
            set({ instrumentos: data || [], loading: false });
        } catch (error) {
            console.error('Error fetching instrumentos:', error);
            set({ loading: false });
        }
    },

    getInstrumentosPorCategoria: (categoriaId: string) => {
        return get().instrumentos.filter(i => i.categoria_id === categoriaId);
    },
}));
