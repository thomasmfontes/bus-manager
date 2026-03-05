import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SuccessAnimation from '../components/SuccessAnimation';
import { PassengerForm } from '../utils/validators';
import { FormLayout } from '../components/excursao/FormLayout';
import { supabase } from '../lib/supabase';
import { CreditCard } from 'lucide-react';

export default function Success() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('v');
    const [passengers, setPassengers] = useState<PassengerForm[]>([]);
    const [expandedIndices, setExpandedIndices] = useState<number[]>([0]); // First one expanded by default
    const [pids, setPids] = useState<string>('');

    useEffect(() => {
        // Recupera dados do localStorage
        try {
            const data = localStorage.getItem('lastSubmission');
            if (data) {
                const parsed = JSON.parse(data);
                const passengerList = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
                setPassengers(passengerList);

                // Fetch pids for these passengers if tripId exists
                if (tripId && passengerList.length > 0) {
                    const docs = passengerList.map(p => p.cpf || p.rg).filter(Boolean);
                    if (docs.length > 0) {
                        const fetchPids = async () => {
                            const { data: identityData } = await supabase
                                .from('passageiros')
                                .select('id')
                                .in('cpf_rg', docs);

                            if (identityData) {
                                setPids(identityData.map(i => i.id).join(','));
                            }
                        };
                        fetchPids();
                    }
                }
            }
        } catch (e) {
            console.error('Erro ao recuperar dados:', e);
        }
    }, [tripId]);

    const toggleExpanded = (index: number) => {
        setExpandedIndices(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

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

            {passengers.length > 0 && (
                <div className="space-y-3 mb-8">
                    {passengers.map((passenger, index) => {
                        const isExpanded = expandedIndices.includes(index);

                        return (
                            <div
                                key={index}
                                className={`bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer`}
                                onClick={() => toggleExpanded(index)}
                            >
                                {/* Header / Collapsed View Components */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 text-left">
                                                {passenger.fullName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${isExpanded ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                            Cadastrado
                                        </span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18" height="18"
                                            viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round"
                                            className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Expanded Content with smooth animation */}
                                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="px-6 pb-6 pt-2 space-y-3">
                                            {(passenger.cpf || passenger.rg) && (
                                                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700/50 pb-2 last:border-0 last:pb-0">
                                                    <span className="text-muted text-sm font-medium">Documento</span>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{passenger.cpf || passenger.rg}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700/50 pb-2 last:border-0 last:pb-0">
                                                <span className="text-muted text-sm font-medium">Telefone</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{passenger.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-sm mb-6">
                <h3 className="font-bold mb-4 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <span className="text-xl">🚀</span> Próximos Passos
                </h3>
                <div className="space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white/60 dark:bg-blue-900/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50 transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">1</span>
                        <div className="flex-1 space-y-3">
                            <span className="font-medium text-base block">Pague agora para garantir sua vaga e escolher o assento</span>
                            <button
                                onClick={() => navigate(`/pagamento?v=${tripId}&pids=${pids}`)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
                            >
                                <CreditCard size={20} />
                                <span>Pagar Agora</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-full flex items-center justify-center text-sm font-bold mt-1">2</span>
                        <div className="flex-1">
                            <span className="text-slate-600 dark:text-slate-300 text-sm">Ou visualize a lista de excursões para acompanhar depois</span>
                            <button
                                onClick={() => navigate('/viagens')}
                                className="mt-2 text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline flex items-center gap-1"
                            >
                                Ir para Excursões 🗺️
                            </button>
                        </div>
                    </div>
                </div>
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
