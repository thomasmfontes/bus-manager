import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { DocumentInput } from '@/components/ui/DocumentInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Bus, ArrowLeft, ExternalLink } from 'lucide-react';

export const UserLogin: React.FC = () => {
    const [documento, setDocumento] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!documento) {
            showToast('Por favor, informe seu CPF ou RG', 'error');
            return;
        }

        setLoading(true);
        const success = await login('', '', documento);
        setLoading(false);

        if (success) {
            showToast('Login realizado com sucesso!', 'success');
            navigate('/dashboard');
        } else {
            showToast('Cadastro não encontrado. Redirecionando para o formulário...', 'error');
            setTimeout(() => {
                navigate('/excursao');
            }, 2000);
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Acesso de Passageiro</h1>
                    <p className="text-gray-600">Informe seu CPF ou RG para acessar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <DocumentInput
                        label="CPF ou RG"
                        value={documento}
                        onChange={(e) => setDocumento(e.target.value)}
                        required
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Verificando...' : 'Acessar'}
                    </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <p className="text-sm text-gray-500 bg-green-50 rounded-lg px-4 py-2.5 border border-green-200">
                        <strong>Passageiro:</strong> Use seu CPF ou RG cadastrado
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-gray-600 mb-3">Ainda não tem cadastro?</p>
                    <a
                        href="https://excursao-agua-rasa.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline"
                    >
                        Preencher formulário de passageiro
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>
        </div>
    );
};
