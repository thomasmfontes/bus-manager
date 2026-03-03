import { create } from 'zustand';
import { Bus } from '@/types';
import { supabase } from '@/lib/supabase';

interface BusState {
    buses: Bus[];
    loading: boolean;
    fetchOnibus: () => Promise<void>;
    createOnibus: (bus: Omit<Bus, 'id'>) => Promise<Bus>;
    updateOnibus: (id: string, bus: Partial<Bus>) => Promise<void>;
    deleteOnibus: (id: string) => Promise<void>;
    releaseBuses: () => Promise<void>;
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

            // Auto-release buses after fetching
            get().releaseBuses();
        } catch (error) {
            console.error('Error fetching onibus:', error);
            set({ loading: false });
        }
    },
    releaseBuses: async () => {
        try {
            const now = new Date();
            const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

            // 1. Fetch all trip-bus relationships with trip dates
            const { data: relations, error } = await supabase
                .from('viagem_onibus')
                .select(`
                    onibus_id,
                    viagens (
                        data_ida
                    )
                `);

            if (error) throw error;

            // 2. Identify buses that are "active" (have a trip in the future or departed < 24h ago)
            const activeBusIds = new Set();
            (relations || []).forEach((rel: any) => {
                if (rel.viagens && new Date(rel.viagens.data_ida) >= twentyFourHoursAgo) {
                    activeBusIds.add(rel.onibus_id);
                }
            });

            // 3. Identify candidate buses for release (those NOT in activeBusIds but present in relations)
            // AND check which of them currently have a plate set
            const currentBuses = get().buses;
            const busesToRelease = currentBuses.filter(bus =>
                !activeBusIds.has(bus.id) &&
                bus.placa &&
                bus.placa.trim() !== "" &&
                (relations || []).some((rel: any) => rel.onibus_id === bus.id)
            );

            if (busesToRelease.length === 0) return;

            console.log(`🚌 Auto-releasing ${busesToRelease.length} buses:`, busesToRelease.map(b => b.nome));

            // 4. Update plates in Supabase
            const { error: updateError } = await supabase
                .from('onibus')
                .update({ placa: "" })
                .in('id', busesToRelease.map(b => b.id));

            if (updateError) throw updateError;

            // 5. Update local state
            set({
                buses: get().buses.map(bus =>
                    busesToRelease.some(b => b.id === bus.id)
                        ? { ...bus, placa: "" }
                        : bus
                )
            });

        } catch (error) {
            console.error('Error in releaseBuses:', error);
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
            return data;
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
            // 1. Delete trip-bus relationships first
            await supabase.from('viagem_onibus').delete().eq('onibus_id', id);

            // 2. Delete the bus itself
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
