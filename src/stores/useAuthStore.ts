import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    login: (email: string, senha: string, documento?: string) => Promise<boolean>;
    logout: () => void;
    hasPermission: (action: 'create' | 'edit' | 'delete') => boolean;
    canManageSeats: () => boolean;
    canSelectOwnSeat: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,
            login: async (email: string, senha: string, documento?: string) => {
                try {
                    let role: UserRole = UserRole.VISUALIZADOR;
                    let passageiroId: string | undefined;
                    let userDocumento: string | undefined;
                    let userName: string = '';

                    // Check if admin (only admin can login with email)
                    if (email === 'thomas@fontes.ca') {
                        // Admin requires password and real Supabase authentication
                        if (!senha) return false;

                        // Authenticate with Supabase
                        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                            email,
                            password: senha,
                        });

                        if (authError || !authData.user) {
                            console.error('Admin authentication failed:', authError);
                            return false;
                        }

                        role = UserRole.ADMIN;
                        userName = 'Administrador';
                    }
                    // All other users MUST provide documento
                    else if (documento) {
                        // Clean the document (remove non-digits)
                        const cleanDoc = documento.replace(/\D/g, '');

                        // Try to find in excursao_passengers
                        const { data: passenger } = await supabase
                            .from('excursao_passengers')
                            .select('id, cpf, rg, full_name')
                            .or(`cpf.eq.${documento},rg.eq.${documento},cpf.eq.${cleanDoc},rg.eq.${cleanDoc}`)
                            .maybeSingle();

                        if (passenger) {
                            role = UserRole.PASSAGEIRO;
                            passageiroId = passenger.id;
                            userDocumento = passenger.cpf || passenger.rg || documento;
                            userName = passenger.full_name;
                        } else {
                            // Not found -> Return false to trigger redirect to form
                            return false;
                        }
                    } else {
                        // No documento provided and not admin = reject login
                        return false;
                    }

                    set({
                        isAuthenticated: true,
                        user: {
                            email: email || documento || '',
                            nome: userName,
                            role,
                            documento: userDocumento,
                            passageiroId,
                        },
                    });
                    return true;
                } catch (error) {
                    console.error('Login error:', error);
                    return false;
                }
            },
            logout: () => {
                // Sign out from Supabase
                supabase.auth.signOut();
                set({ isAuthenticated: false, user: null });
            },
            hasPermission: (_action: 'create' | 'edit' | 'delete') => {
                const { user } = get();
                return user?.role === UserRole.ADMIN;
            },
            canManageSeats: () => {
                const { user } = get();
                return user?.role === UserRole.ADMIN;
            },
            canSelectOwnSeat: () => {
                const { user } = get();
                return user?.role === UserRole.PASSAGEIRO || user?.role === UserRole.ADMIN;
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
