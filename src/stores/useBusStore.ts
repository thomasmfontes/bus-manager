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
                .from('buses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map snake_case from DB to camelCase for frontend
            const mappedBuses: Bus[] = data.map((bus: any) => ({
                id: bus.id,
                nome: bus.nome,
                placa: bus.placa,
                configuracaoAssentos: bus.configuracao_assentos,
                totalAssentos: bus.total_assentos,
            }));

            set({ buses: mappedBuses, loading: false });
        } catch (error) {
            console.error('Error fetching buses:', error);
            set({ loading: false });
        }
    },
    createOnibus: async (bus) => {
        try {
            // Get default seats from localStorage if not provided
            const defaultSeats = localStorage.getItem('default_bus_seats');
            const totalAssentos = bus.totalAssentos || (defaultSeats ? parseInt(defaultSeats) : 46);

            const dbBus = {
                nome: bus.nome,
                placa: bus.placa,
                configuracao_assentos: bus.configuracaoAssentos,
                total_assentos: totalAssentos,
            };

            const { data, error } = await supabase
                .from('buses')
                .insert([dbBus])
                .select()
                .single();

            if (error) throw error;

            const newBus: Bus = {
                id: data.id,
                nome: data.nome,
                placa: data.placa,
                configuracaoAssentos: data.configuracao_assentos,
                totalAssentos: data.total_assentos,
            };

            set({ buses: [newBus, ...get().buses] });
        } catch (error) {
            console.error('Error creating bus:', error);
            throw error;
        }
    },
    updateOnibus: async (id, bus) => {
        try {
            const updates: any = {};
            if (bus.nome) updates.nome = bus.nome;
            if (bus.placa) updates.placa = bus.placa;
            if (bus.configuracaoAssentos) updates.configuracao_assentos = bus.configuracaoAssentos;
            if (bus.totalAssentos) updates.total_assentos = bus.totalAssentos;

            const { data, error } = await supabase
                .from('buses')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const updatedBus: Bus = {
                id: data.id,
                nome: data.nome,
                placa: data.placa,
                configuracaoAssentos: data.configuracao_assentos,
                totalAssentos: data.total_assentos,
            };

            set({
                buses: get().buses.map((b) => (b.id === id ? updatedBus : b)),
            });
        } catch (error) {
            console.error('Error updating bus:', error);
            throw error;
        }
    },
    deleteOnibus: async (id) => {
        try {
            const { error } = await supabase.from('buses').delete().eq('id', id);
            if (error) throw error;
            set({ buses: get().buses.filter((b) => b.id !== id) });
        } catch (error) {
            console.error('Error deleting bus:', error);
            throw error;
        }
    },
}));
