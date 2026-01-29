import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Trash2, UserPlus, Shield, Loader2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/Modal';

interface AdminProfile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
}

export const AdminList: React.FC = () => {
    const [admins, setAdmins] = useState<AdminProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [adminToConfirmDelete, setAdminToConfirmDelete] = useState<{ id: string, email: string } | null>(null);
    const { showToast } = useToast();

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'admin')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAdmins(data || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
            showToast('Erro ao carregar administradores', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsCreating(true);

            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast('Você precisa estar autenticado', 'error');
                return;
            }

            // Call secure API endpoint
            const response = await fetch('/api/admin/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    email: newAdminEmail,
                    password: newAdminPassword,
                    name: newAdminName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar administrador');
            }

            showToast('Administrador criado com sucesso!', 'success');
            setNewAdminEmail('');
            setNewAdminPassword('');
            setNewAdminName('');
            fetchAdmins();
        } catch (error: any) {
            console.error('Error creating admin:', error);
            showToast(`Erro ao criar administrador: ${error.message}`, 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteAdmin = async () => {
        if (!adminToConfirmDelete) return;

        const { id } = adminToConfirmDelete;
        setAdminToConfirmDelete(null);

        setDeletingId(id);
        try {
            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast('Você precisa estar autenticado', 'error');
                return;
            }

            // Call secure API endpoint
            const response = await fetch(`/api/admin/delete?userId=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao remover administrador');
            }

            showToast('Administrador removido com sucesso!', 'success');
            fetchAdmins();
        } catch (error: any) {
            console.error('Error deleting admin:', error);
            showToast('Erro ao remover administrador', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-soft-lg transition-all">
                <div className="flex items-start gap-3 sm:gap-4 mb-6">
                    <div className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm shrink-0">
                        <Shield className="text-white" size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Gerenciar Administradores</h2>
                        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Adicione ou remova acesso administrativo ao sistema</p>
                    </div>
                </div>

                <form onSubmit={handleCreateAdmin} className="space-y-4 mb-6 p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-100">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <UserPlus size={20} className="text-blue-600" />
                        Novo Administrador
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <Input
                            placeholder="Nome Completo"
                            value={newAdminName}
                            onChange={(e) => setNewAdminName(e.target.value)}
                            required
                        />
                        <Input
                            type="email"
                            placeholder="Email"
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Senha (mín. 6 caracteres)"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit" isLoading={isCreating} className="w-full sm:w-auto">
                            <UserPlus size={18} className="mr-2" />
                            {isCreating ? 'Criando...' : 'Adicionar Administrador'}
                        </Button>
                    </div>
                </form>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Administradores Ativos</h3>
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Carregando...</p>
                        </div>
                    ) : admins.length === 0 ? (
                        <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-gray-100">
                            <Shield className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-gray-500">Nenhum administrador encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {admins.map((admin) => (
                                <div key={admin.id} className="flex items-center justify-between p-3 sm:p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all group">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0 shadow-sm">
                                            {admin.full_name?.charAt(0) || admin.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-900 truncate">{admin.full_name || 'Sem nome'}</p>
                                            <p className="text-xs sm:text-sm text-gray-500 truncate">{admin.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAdminToConfirmDelete({ id: admin.id, email: admin.email })}
                                        disabled={deletingId === admin.id}
                                        className="p-2 sm:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-100"
                                        title="Remover acesso"
                                    >
                                        {deletingId === admin.id ? (
                                            <Loader2 size={18} className="animate-spin text-red-600" />
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            <ConfirmModal
                isOpen={!!adminToConfirmDelete}
                onClose={() => setAdminToConfirmDelete(null)}
                onConfirm={handleDeleteAdmin}
                title="Remover Administrador"
                message={`Tem certeza que deseja remover o acesso administrativo de "${adminToConfirmDelete?.email}"? Esta ação revogará o acesso imediato ao sistema.`}
            />
        </div>
    );
};
