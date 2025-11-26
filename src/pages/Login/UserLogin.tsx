import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Input } from '@/components/ui/Input';
import { DocumentInput } from '@/components/ui/DocumentInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Bus, ArrowLeft } from 'lucide-react';

export const UserLogin: React.FC = () => {
    const [documento, setDocumento] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!documento || !senha) {
            showToast('Por favor, preencha todos os campos', 'error');
            return;
        }

        setLoading(true);
        const success = await login('', senha, documento);
        setLoading(false);

        if (success) {
            showToast('Login realizado com sucesso!', 'success');
            navigate('/dashboard');
        } else {
            showToast('Credenciais inválidas', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-soft-xl p-8 w-full max-w-md border border-gray-100 animate-scale-in">
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                        <Bus className="text-white" size={32} strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Acesso de Usuário</h1>
                    <p className="text-gray-600">Login com CPF ou RG</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <DocumentInput
                        label="CPF ou RG"
                        value={documento}
                        onChange={(e) => setDocumento(e.target.value)}
                        placeholder="000.000.000-00"
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
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <p className="text-sm text-gray-500 bg-green-50 rounded-lg px-4 py-2.5 border border-green-200">
                        <strong>Passageiro:</strong> Use seu CPF/RG cadastrado
                    </p>
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
                        <strong>Visualizador:</strong> Qualquer CPF/RG não cadastrado
                    </p>
                </div>
            </div>
        </div>
    );
};
