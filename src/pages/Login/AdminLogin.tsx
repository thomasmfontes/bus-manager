import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Bus, ArrowLeft } from 'lucide-react';

export const AdminLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !senha) {
            showToast('Por favor, preencha todos os campos', 'error');
            return;
        }



        setLoading(true);
        const success = await login(email, senha);
        setLoading(false);

        if (success) {
            showToast('Login realizado com sucesso!', 'success');
            navigate('/dashboard');
        } else {
            showToast('Credenciais inválidas', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-soft-xl p-8 w-full max-w-md border border-gray-100 fade-in duration-500">
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                        <Bus className="text-white" size={32} strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Acesso Admin</h1>
                    <p className="text-gray-600">Login exclusivo para administradores</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        type="email"
                        label="E-mail do Administrador"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                    />

                    <Input
                        type="password"
                        label="Senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : 'Entrar como Admin'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 bg-blue-50 rounded-lg px-4 py-2.5 border border-blue-200">
                        <strong>Acesso restrito:</strong> Apenas administradores do sistema
                    </p>
                </div>
            </div>
        </div>
    );
};
