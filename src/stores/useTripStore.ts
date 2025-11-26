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
            // Fetch trips and their associated buses
            const { data, error } = await supabase
                .from('trips')
                .select(`
                    *,
                    trip_buses (
                        onibus_id
                    )
                `)
                .order('data_hora', { ascending: true });

            if (error) throw error;

            const mappedTrips: Trip[] = data.map((trip: any) => ({
                id: trip.id,
                origem: trip.origem,
                destino: trip.destino,
                data: trip.data_hora,
                onibusIds: trip.trip_buses ? trip.trip_buses.map((tb: any) => tb.onibus_id) : [],
                descricao: trip.descricao,
            }));

            set({ trips: mappedTrips, loading: false });
        } catch (error) {
            console.error('Error fetching trips:', error);
            set({ loading: false });
        }
    },
    createViagem: async (trip) => {
        set({ loading: true });
        try {
            // 1. Create the trip
            const dbTrip = {
                origem: trip.origem,
                destino: trip.destino,
                data_hora: trip.data,
                descricao: trip.descricao,
            };

            const { data: newTripData, error: tripError } = await supabase
                .from('trips')
                .insert([dbTrip])
                .select()
                .single();

            if (tripError) throw tripError;

            // 2. Link buses to the trip
            if (trip.onibusIds && trip.onibusIds.length > 0) {
                const tripBuses = trip.onibusIds.map((busId) => ({
                    viagem_id: newTripData.id,
                    onibus_id: busId,
                }));

                const { error: busError } = await supabase
                    .from('trip_buses')
                    .insert(tripBuses);

                if (busError) throw busError;
            }

            const newTrip: Trip = {
                id: newTripData.id,
                origem: newTripData.origem,
                destino: newTripData.destino,
                data: newTripData.data_hora,
                onibusIds: trip.onibusIds || [],
                descricao: newTripData.descricao,
            };

            set({ trips: [...get().trips, newTrip], loading: false });
        } catch (error) {
            console.error('Error creating trip:', error);
            set({ loading: false });
            throw error;
        }
    },
    updateViagem: async (id, trip) => {
        try {
            // 1. Update trip details
            const updates: any = {};
            if (trip.origem) updates.origem = trip.origem;
            if (trip.destino) updates.destino = trip.destino;
            if (trip.data) updates.data_hora = trip.data;
            if (trip.descricao) updates.descricao = trip.descricao;

            const { data: updatedTripData, error: tripError } = await supabase
                .from('trips')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (tripError) throw tripError;

            // 2. Update bus associations if provided
            if (trip.onibusIds) {
                // First delete existing associations
                const { error: deleteError } = await supabase
                    .from('trip_buses')
                    .delete()
                    .eq('viagem_id', id);

                if (deleteError) throw deleteError;

                // Then insert new ones
                if (trip.onibusIds.length > 0) {
                    const tripBuses = trip.onibusIds.map((busId) => ({
                        viagem_id: id,
                        onibus_id: busId,
                    }));

                    const { error: insertError } = await supabase
                        .from('trip_buses')
                        .insert(tripBuses);

                    if (insertError) throw insertError;
                }
            }

            // Construct the updated trip object
            // We need to preserve existing onibusIds if not updated, or use new ones
            const currentTrip = get().trips.find(t => t.id === id);
            const finalOnibusIds = trip.onibusIds || currentTrip?.onibusIds || [];

            const updatedTrip: Trip = {
                id: updatedTripData.id,
                origem: updatedTripData.origem,
                destino: updatedTripData.destino,
                data: updatedTripData.data_hora,
                onibusIds: finalOnibusIds,
                descricao: updatedTripData.descricao,
            };

            set({
                trips: get().trips.map((t) => (t.id === id ? updatedTrip : t)),
            });
        } catch (error) {
            console.error('Error updating trip:', error);
            throw error;
        }
    },
    deleteViagem: async (id) => {
        try {
            const { error } = await supabase.from('trips').delete().eq('id', id);
            if (error) throw error;
            set({ trips: get().trips.filter((t) => t.id !== id) });
        } catch (error) {
            console.error('Error deleting trip:', error);
            throw error;
        }
    },
}));
