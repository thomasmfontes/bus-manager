import { create } from 'zustand';
import { Passenger, TripEnrollment } from '@/types';
import { supabase } from '@/lib/supabase';

interface PassengerState {
    passengers: Passenger[];
    enrollments: TripEnrollment[];
    loading: boolean;
    fetchPassageiros: (viagemId?: string) => Promise<void>;
    createPassageiro: (passenger: Omit<Passenger, 'id'>, viagemId?: string, enrollmentData?: Partial<TripEnrollment>) => Promise<void>;
    updatePassageiro: (id: string, passenger: Partial<Passenger>, enrollmentId?: string, enrollmentData?: Partial<TripEnrollment>) => Promise<void>;
    deletePassageiro: (id: string, enrollmentId?: string) => Promise<void>;
    deleteAllPassageiros: () => Promise<void>;
}

export const usePassengerStore = create<PassengerState>((set, get) => ({
    passengers: [],
    enrollments: [],
    loading: false,
    fetchPassageiros: async (viagemId?: string) => {
        set({ loading: true });
        try {
            // 1. Fetch ALL Enrollments (for global counts like occupied seats)
            const { data: allEnrollments, error: enrollError } = await supabase
                .from('viagem_passageiros')
                .select('*')
                .order('created_at', { ascending: false });

            if (enrollError) throw enrollError;

            // 2. Fetch Passengers
            let query = supabase
                .from('passageiros')
                .select(`
                    *,
                    enrollment:viagem_passageiros (*)
                `);

            if (viagemId) {
                const cleanViagemId = viagemId.toLowerCase();
                // Return passengers in THIS trip OR the "BLOQUEADO" identity
                const travelerIds = (allEnrollments || [])
                    .filter((e: TripEnrollment) => e.viagem_id?.toLowerCase() === cleanViagemId)
                    .map(e => e.passageiro_id);

                // Find the BLOQUEADO identity ID if not already there
                const { data: blockedData } = await supabase
                    .from('passageiros')
                    .select('id')
                    .eq('nome_completo', 'BLOQUEADO')
                    .maybeSingle();

                if (blockedData && !travelerIds.includes(blockedData.id)) {
                    travelerIds.push(blockedData.id);
                }

                query = query.in('id', travelerIds);
            }

            const { data, error } = await query.order('nome_completo', { ascending: true });
            if (error) throw error;

            // Map and Flatten
            const mappedPassengers = (data || []).map(p => {
                // If filtered by trip, take exactly THAT enrollment
                // If global, take the latest one (or first)
                const enrolls = Array.isArray(p.enrollment) ? p.enrollment : (p.enrollment ? [p.enrollment] : []);
                const relevantEnroll = viagemId
                    ? enrolls.find((e: TripEnrollment) => e.viagem_id?.toLowerCase() === viagemId.toLowerCase())
                    : enrolls[0];

                return {
                    ...p,
                    enrollment: relevantEnroll
                };
            });

            set({
                passengers: mappedPassengers,
                enrollments: (allEnrollments || []),
                loading: false
            });
        } catch (error) {
            console.error('Error fetching passageiros:', error);
            set({ loading: false });
        }
    },
    createPassageiro: async (passenger, viagemId, enrollmentData) => {
        set({ loading: true });
        try {
            // 1. Find or Create Identity
            let { data: identity, error: findError } = await supabase
                .from('passageiros')
                .select('*')
                .eq('cpf_rg', passenger.cpf_rg)
                .maybeSingle();

            if (findError) throw findError;

            if (!identity) {
                const { data: newIdentity, error: createError } = await supabase
                    .from('passageiros')
                    .insert([{
                        nome_completo: passenger.nome_completo,
                        cpf_rg: passenger.cpf_rg,
                        telefone: passenger.telefone,
                        comum_congregacao: passenger.comum_congregacao,
                        estado_civil: passenger.estado_civil,
                        idade: passenger.idade,
                        instrumento: passenger.instrumento,
                        auxiliar: passenger.auxiliar,
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                identity = newIdentity;
            } else {
                // Simple update of master info if changed
                await supabase.from('passageiros').update({
                    telefone: passenger.telefone || identity.telefone,
                    comum_congregacao: passenger.comum_congregacao || identity.comum_congregacao,
                    instrumento: passenger.instrumento || identity.instrumento,
                }).eq('id', identity.id);
            }

            // 2. Create Enrollment if viagemId is provided
            if (viagemId) {
                const { error: enrollError } = await supabase
                    .from('viagem_passageiros')
                    .insert([{
                        passageiro_id: identity!.id,
                        viagem_id: viagemId,
                        onibus_id: enrollmentData?.onibus_id,
                        assento: enrollmentData?.assento,
                        pagamento: enrollmentData?.pagamento || 'Pendente',
                        valor_pago: enrollmentData?.valor_pago || 0,
                        pago_por: enrollmentData?.pago_por,
                    }]);

                if (enrollError) throw enrollError;
            }

            await get().fetchPassageiros(viagemId);
        } catch (error) {
            console.error('Error creating passageiro:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    },
    updatePassageiro: async (id, passenger, enrollmentId, enrollmentData) => {
        try {
            // 1. Update Identity (Local)
            if (Object.keys(passenger).length > 0) {
                set(state => ({
                    passengers: state.passengers.map(p => p.id === id ? { ...p, ...passenger } : p)
                }));

                const { error: identityError } = await supabase
                    .from('passageiros')
                    .update(passenger)
                    .eq('id', id);
                if (identityError) throw identityError;
            }

            // 2. Update Enrollment (Local & DB)
            if (enrollmentId && enrollmentData && Object.keys(enrollmentData).length > 0) {
                set(state => ({
                    // Update global enrollments array
                    enrollments: state.enrollments.map(e => e.id === enrollmentId ? { ...e, ...enrollmentData } : e),
                    // Update current passenger list item (nested enrollment)
                    passengers: state.passengers.map(p => {
                        if (p.id === id && p.enrollment?.id === enrollmentId) {
                            return { ...p, enrollment: { ...p.enrollment, ...enrollmentData } };
                        }
                        return p;
                    })
                }));

                const { error: enrollError } = await supabase
                    .from('viagem_passageiros')
                    .update(enrollmentData)
                    .eq('id', enrollmentId);
                if (enrollError) throw enrollError;
            }
        } catch (error) {
            console.error('Error updating passageiro:', error);
            // Fallback: full refresh on error to ensure consistency
            await get().fetchPassageiros();
            throw error;
        } finally {
            set({ loading: false });
        }
    },
    deletePassageiro: async (id, enrollmentId) => {
        set({ loading: true });
        try {
            if (enrollmentId) {
                // Just delete the enrollment for this trip
                const { error } = await supabase.from('viagem_passageiros').delete().eq('id', enrollmentId);
                if (error) throw error;
            } else {
                // Delete the entire identity (and by cascade, all enrollments)
                const { error } = await supabase.from('passageiros').delete().eq('id', id);
                if (error) throw error;
            }

            set({
                passengers: get().passengers.filter((p) => enrollmentId ? p.enrollment?.id !== enrollmentId : p.id !== id),
                loading: false
            });
        } catch (error) {
            console.error('Error deleting passageiro:', error);
            set({ loading: false });
            throw error;
        }
    },
    deleteAllPassageiros: async () => {
        try {
            const { error } = await supabase.from('passageiros').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
            set({ passengers: [] });
        } catch (error) {
            console.error('Error deleting all passageiros:', error);
            throw error;
        }
    },
}));
