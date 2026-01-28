import { create } from 'zustand';
import { Bus } from '@/types';
import { supabase } from '@/lib/supabase';

interface BusState {
    buses: Bus[];
    loading: boolean;
    fetchOnibus: () => Promise<void>;
    createOnibus: (bus: Omit<Bus, 'id'>) => Promise<void>;
    updateOnibus: (id: string, bus: Partial<Bus>) => Promise<void>;
    deleteOnibus: (id: string) => Promise<void>;
}

export const useBusStore = create<BusState>((set, get) => ({
    buses: [],
    loading: false,
    fetchOnibus: async () => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('onibus')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            set({ buses: data || [], loading: false });
        } catch (error) {
            console.error('Error fetching onibus:', error);
            set({ loading: false });
        }
    },
    createOnibus: async (bus) => {
        set({ loading: true });
        try {
            // Get default seats from localStorage if not provided
            const defaultSeats = localStorage.getItem('default_bus_seats');
            const capacidade = bus.capacidade || (defaultSeats ? parseInt(defaultSeats) : 46);

            const { data, error } = await supabase
                .from('onibus')
                .insert([{
                    nome: bus.nome,
                    placa: bus.placa,
                    capacidade
                }])
                .select()
                .single();

            if (error) throw error;

            set({ buses: [data, ...get().buses], loading: false });
        } catch (error) {
            console.error('Error creating onibus:', error);
            set({ loading: false });
            throw error;
        }
    },
    updateOnibus: async (id, bus) => {
        set({ loading: true });
        try {
            const updates: any = {};
            if (bus.nome) updates.nome = bus.nome;
            if (bus.placa !== undefined) updates.placa = bus.placa;
            if (bus.capacidade) updates.capacidade = bus.capacidade;

            const { data, error } = await supabase
                .from('onibus')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            set({
                buses: get().buses.map((b) => (b.id === id ? data : b)),
                loading: false,
            });
        } catch (error) {
            console.error('Error updating onibus:', error);
            set({ loading: false });
            throw error;
        }
    },
    deleteOnibus: async (id) => {
        set({ loading: true });
        try {
            const { error } = await supabase.from('onibus').delete().eq('id', id);
            if (error) throw error;
            set({ buses: get().buses.filter((b) => b.id !== id), loading: false });
        } catch (error) {
            console.error('Error deleting onibus:', error);
            set({ loading: false });
            throw error;
        }
    },
}));
