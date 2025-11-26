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
                // Simple validation
                if (!senha) return false;

                try {
                    let role: UserRole = UserRole.VISUALIZADOR;
                    let passageiroId: string | undefined;
                    let userDocumento: string | undefined;
                    let userName: string = '';

                    // Check if admin (only admin can login with email)
                    if (email === 'thomas@fontes.ca') {
                        role = UserRole.ADMIN;
                        userName = 'Administrador';
                    }
                    // All other users MUST provide documento
                    else if (documento) {
                        const { data: passenger } = await supabase
                            .from('passengers')
                            .select('id, documento, nome')
                            .eq('documento', documento)
                            .single();

                        if (passenger) {
                            role = UserRole.PASSAGEIRO;
                            passageiroId = passenger.id;
                            userDocumento = passenger.documento;
                            userName = passenger.nome;
                        } else {
                            // Documento not found in passengers = visualizador
                            role = UserRole.VISUALIZADOR;
                            userDocumento = documento;
                            userName = 'Visitante';
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
