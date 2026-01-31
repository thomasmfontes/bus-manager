import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuccessAnimation from '../components/SuccessAnimation';
import { PassengerForm } from '../utils/validators';
import { FormLayout } from '../components/excursao/FormLayout';

export default function Success() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<PassengerForm | null>(null);

    useEffect(() => {
        // Recupera dados do localStorage
        try {
            const data = localStorage.getItem('lastSubmission');
            if (data) {
                setFormData(JSON.parse(data));
            }
        } catch (e) {
            console.error('Erro ao recuperar dados:', e);
        }
    }, []);



    return (
        <FormLayout className="text-center backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="mb-8 transform scale-110">
                <SuccessAnimation size={100} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Cadastro Confirmado! 🎉
            </h1>

            <p className="text-muted text-lg mb-8 max-w-md mx-auto">
                Sua inscrição para a excursão foi registrada com sucesso.
            </p>

            {formData && (
                <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-6 mb-8 text-left border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        Resumo da Inscrição
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700/50 pb-2 last:border-0 last:pb-0">
                            <span className="text-muted text-sm font-medium">Nome</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{formData.fullName}</span>
                        </div>
                        {formData.cpf && (
                            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700/50 pb-2 last:border-0 last:pb-0">
                                <span className="text-muted text-sm font-medium">CPF</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.cpf}</span>
                            </div>
                        )}
                        {formData.rg && (
                            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700/50 pb-2 last:border-0 last:pb-0">
                                <span className="text-muted text-sm font-medium">RG</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.rg}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700/50 pb-2 last:border-0 last:pb-0">
                            <span className="text-muted text-sm font-medium">Congregação</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{formData.congregation}</span>
                        </div>
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700/50 pb-2 last:border-0 last:pb-0">
                            <span className="text-muted text-sm font-medium">Instrumento</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{formData.instrument}</span>
                        </div>
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700/50 pb-2 last:border-0 last:pb-0">
                            <span className="text-muted text-sm font-medium">Telefone</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.phone}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-sm mb-6">
                <h3 className="font-bold mb-4 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <span className="text-xl">🚀</span> Próximos Passos
                </h3>
                <ul className="text-sm text-blue-950 dark:text-blue-100 space-y-4 text-left">
                    <li className="flex items-start gap-3 bg-white/60 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm mt-1">1</span>
                        <div className="flex-1">
                            <span className="font-medium text-base block mb-3">Acompanhe seu pagamento e escolha seu assento</span>
                            <button
                                onClick={() => navigate('/viagens')}
                                className="btn-base btn-primary w-full sm:w-auto text-sm py-2"
                            >
                                <span className="text-lg">🗺️</span>
                                <span>Excursões</span>
                            </button>
                        </div>
                    </li>
                </ul>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={() => navigate('/excursao')}
                    className="btn-base btn-secondary w-full sm:w-auto text-sm py-2"
                >
                    <span className="text-lg">📝</span>
                    <span>Nova Inscrição</span>
                </button>
            </div>
        </FormLayout>
    );
}
