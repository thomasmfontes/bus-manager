import { create } from 'zustand';
import { Trip } from '@/types';
import { supabase } from '@/lib/supabase';

interface TripState {
    trips: Trip[];
    loading: boolean;
    fetchViagens: () => Promise<void>;
    createViagem: (trip: Omit<Trip, 'id'>) => Promise<void>;
    updateViagem: (id: string, trip: Partial<Trip>) => Promise<void>;
    deleteViagem: (id: string) => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
    trips: [],
    loading: false,
    fetchViagens: async () => {
        set({ loading: true });
        try {
            // Fetch trips with their associated buses
            const { data: viagens, error: viagensError } = await supabase
                .from('viagens')
                .select('*')
                .order('data_ida', { ascending: true });

            if (viagensError) throw viagensError;

            // Fetch all trip-bus relationships
            const { data: viagemOnibus, error: viagemOnibusError } = await supabase
                .from('viagem_onibus')
                .select('viagem_id, onibus_id');

            if (viagemOnibusError) throw viagemOnibusError;

            // Map buses to trips
            const tripsWithBuses = (viagens || []).map(viagem => {
                const busIds = (viagemOnibus || [])
                    .filter(vo => vo.viagem_id === viagem.id)
                    .map(vo => vo.onibus_id);

                return {
                    ...viagem,
                    onibus_ids: busIds.length > 0 ? busIds : undefined,
                };
            });

            set({ trips: tripsWithBuses, loading: false });
        } catch (error) {
            console.error('Error fetching viagens:', error);
            set({ loading: false });
        }
    },
    createViagem: async (trip) => {
        set({ loading: true });
        try {
            // Create the trip
            const { data: newTrip, error: tripError } = await supabase
                .from('viagens')
                .insert([{
                    nome: trip.nome,
                    destino: trip.destino,
                    data_ida: trip.data_ida,
                    data_volta: trip.data_volta,
                    preco: trip.preco,
                }])
                .select()
                .single();

            if (tripError) throw tripError;

            // Create trip-bus relationships
            const busIds = trip.onibus_ids || (trip.onibus_id ? [trip.onibus_id] : []);

            if (busIds.length > 0) {
                const viagemOnibusRecords = busIds.map(onibus_id => ({
                    viagem_id: newTrip.id,
                    onibus_id,
                }));

                const { error: relationError } = await supabase
                    .from('viagem_onibus')
                    .insert(viagemOnibusRecords);

                if (relationError) throw relationError;
            }

            // Add onibus_ids to the trip object
            const tripWithBuses = {
                ...newTrip,
                onibus_ids: busIds.length > 0 ? busIds : undefined,
            };

            set({ trips: [...get().trips, tripWithBuses], loading: false });
        } catch (error) {
            console.error('Error creating viagem:', error);
            set({ loading: false });
            throw error;
        }
    },
    updateViagem: async (id, trip) => {
        try {
            // Update trip basic info
            const updates: any = {};
            if (trip.nome) updates.nome = trip.nome;
            if (trip.destino) updates.destino = trip.destino;
            if (trip.data_ida) updates.data_ida = trip.data_ida;
            if (trip.data_volta !== undefined) updates.data_volta = trip.data_volta;
            if (trip.preco) updates.preco = trip.preco;

            const { data: updatedTrip, error: tripError } = await supabase
                .from('viagens')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (tripError) throw tripError;

            // Update trip-bus relationships if onibus_ids is provided
            if (trip.onibus_ids !== undefined) {
                // Delete existing relationships
                const { error: deleteError } = await supabase
                    .from('viagem_onibus')
                    .delete()
                    .eq('viagem_id', id);

                if (deleteError) throw deleteError;

                // Create new relationships
                const busIds = trip.onibus_ids || (trip.onibus_id ? [trip.onibus_id] : []);

                if (busIds.length > 0) {
                    const viagemOnibusRecords = busIds.map(onibus_id => ({
                        viagem_id: id,
                        onibus_id,
                    }));

                    const { error: insertError } = await supabase
                        .from('viagem_onibus')
                        .insert(viagemOnibusRecords);

                    if (insertError) throw insertError;
                }

                // Add onibus_ids to the updated trip
                updatedTrip.onibus_ids = busIds.length > 0 ? busIds : undefined;
            }

            set({
                trips: get().trips.map((t) => (t.id === id ? updatedTrip : t)),
            });
        } catch (error) {
            console.error('Error updating viagem:', error);
            throw error;
        }
    },
    deleteViagem: async (id) => {
        try {
            const { error } = await supabase.from('viagens').delete().eq('id', id);
            if (error) throw error;
            set({ trips: get().trips.filter((t) => t.id !== id) });
        } catch (error) {
            console.error('Error deleting viagem:', error);
            throw error;
        }
    },
}));
