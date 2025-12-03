import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { User, Lock, Save } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [fullName, setFullName] = useState('');
    const [loadingProfile, setLoadingProfile] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingPassword, setLoadingPassword] = useState(false);

    useEffect(() => {
        if (user?.nome) {
            setFullName(user.nome);
        }
        fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser?.user_metadata?.full_name) {
                setFullName(authUser.user_metadata.full_name);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingProfile(true);
        try {
            // Check if user has an active session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast('Sessão expirada. Por favor, faça login novamente.', 'error');
                return;
            }

            // Update Supabase Auth Metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (authError) throw authError;

            // Update Profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', session.user.id);

            if (profileError) throw profileError;

            showToast('Perfil atualizado com sucesso!', 'success');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            showToast('Erro ao atualizar perfil', 'error');
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast('As senhas não coincidem', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        setLoadingPassword(true);
        try {
            // Check if user has an active session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast('Sessão expirada. Por favor, faça login novamente.', 'error');
                return;
            }

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            showToast('Senha atualizada com sucesso!', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error updating password:', error);
            showToast('Erro ao atualizar senha', 'error');
        } finally {
            setLoadingPassword(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-soft-lg transition-all">
                <div className="flex items-start gap-3 sm:gap-4 mb-6">
                    <div className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm shrink-0">
                        <User className="text-white" size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Meu Perfil</h2>
                        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Gerencie suas informações pessoais</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <Input value={user?.email || ''} disabled className="bg-gray-50 text-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                        <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Seu nome completo"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={loadingProfile} className="w-full sm:w-auto">
                            <Save size={18} />
                            {loadingProfile ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="hover:shadow-soft-lg transition-all">
                <div className="flex items-start gap-3 sm:gap-4 mb-6">
                    <div className="p-2.5 sm:p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-sm shrink-0">
                        <Lock className="text-white" size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Segurança</h2>
                        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Atualize sua senha de acesso</p>
                    </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Digite a senha novamente"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit" variant="secondary" disabled={loadingPassword} className="w-full sm:w-auto">
                            <Lock size={18} />
                            {loadingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
