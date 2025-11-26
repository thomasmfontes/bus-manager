import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    login: (email: string, senha: string) => Promise<boolean>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            user: null,
            login: async (email: string, senha: string) => {
                // Simple validation for demo
                if (email && senha) {
                    set({
                        isAuthenticated: true,
                        user: { email, nome: email.split('@')[0] },
                    });
                    return true;
                }
                return false;
            },
            logout: () => {
                set({ isAuthenticated: false, user: null });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
