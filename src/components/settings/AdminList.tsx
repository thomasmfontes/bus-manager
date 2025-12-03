import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Trash2, UserPlus, Shield } from 'lucide-react';

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

    const handleDeleteAdmin = async (id: string, email: string) => {
        if (!confirm(`Tem certeza que deseja remover o administrador ${email}?`)) return;

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
        }
    };

    return (
        <div className="space-y-8">
            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Gerenciar Administradores</h2>
                        <p className="text-gray-500 text-sm">Adicione ou remova acesso administrativo ao sistema</p>
                    </div>
                </div>

                <form onSubmit={handleCreateAdmin} className="space-y-4 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <UserPlus size={18} />
                        Novo Administrador
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            placeholder="Senha"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? 'Criando...' : 'Adicionar Administrador'}
                        </Button>
                    </div>
                </form>

                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Administradores Ativos</h3>
                    {loading ? (
                        <p className="text-gray-500 text-center py-4">Carregando...</p>
                    ) : admins.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Nenhum administrador encontrado.</p>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {admins.map((admin) => (
                                <div key={admin.id} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                            {admin.full_name?.charAt(0) || admin.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{admin.full_name || 'Sem nome'}</p>
                                            <p className="text-sm text-gray-500">{admin.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remover acesso"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
