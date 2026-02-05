import React, { useState, useEffect } from 'react';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { PrivacyPolicyModal, TermsOfUseModal } from './LegalModals';

interface MissingDetailsModalProps {
    isOpen: boolean;
    passengerId: string;
    onSuccess: () => void;
}

export const MissingDetailsModal: React.FC<MissingDetailsModalProps> = ({ isOpen, passengerId, onSuccess }) => {
    const { updatePassageiro } = usePassengerStore();
    const { showToast } = useToast();
    const [birthDate, setBirthDate] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    // Initial load: populate data if available
    useEffect(() => {
        if (isOpen && passengerId) {
            const passenger = usePassengerStore.getState().passengers.find(p => p.id === passengerId);
            if (passenger?.data_nascimento) {
                const [year, month, day] = passenger.data_nascimento.split('-');
                setBirthDate(`${day}/${month}/${year}`);
            }
        }
    }, [isOpen, passengerId]);

    const handleMaskDate = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 8);
        let mask = '';
        if (digits.length <= 2) mask = digits;
        else if (digits.length <= 4) mask = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        else mask = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        setBirthDate(mask);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (birthDate.length < 10) {
            showToast('Por favor, insira uma data válida (DD/MM/AAAA)', 'error');
            return;
        }

        if (!acceptedTerms) {
            showToast('Você precisa aceitar os termos de uso para continuar', 'error');
            return;
        }

        const [day, month, year] = birthDate.split('/');
        const isoDate = `${year}-${month}-${day}`;

        // Basic validation
        const dateObj = new Date(isoDate);
        if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 1900 || dateObj.getFullYear() > new Date().getFullYear()) {
            showToast('Data de nascimento inválida', 'error');
            return;
        }

        setLoading(true);
        try {
            await updatePassageiro(passengerId, {
                data_nascimento: isoDate,
                lgpd_consent_at: new Date().toISOString()
            });
            showToast('Dados atualizados com sucesso!', 'success');
            onSuccess();
        } catch (error) {
            showToast('Erro ao atualizar dados. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { }}
            title="Conclusão de Cadastro"
            showCloseButton={false}
        >
            <div className="space-y-6 -mt-2">
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-transparent p-5 rounded-2xl border border-blue-100/50 dark:border-blue-500/10">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100 dark:border-gray-700">
                            <AlertCircle className="text-blue-500 dark:text-blue-400" size={24} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">Atualização obrigatória</h4>
                            <p className="text-xs text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                                Precisamos da sua <strong>data de nascimento</strong> e do seu <strong>consentimento</strong> para completar seu perfil e garantir seu seguro viagem.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2.5">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                            Data de Nascimento
                        </label>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="DD/MM/AAAA"
                                value={birthDate}
                                onChange={(e) => handleMaskDate(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium text-lg placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                required
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 checked:bg-blue-600 checked:border-blue-600 transition-all focus:ring-2 focus:ring-blue-500/20"
                                />
                                <svg
                                    className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
                                Estou de acordo com a{' '}
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}
                                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                >
                                    Política de Privacidade
                                </button>
                                {' '}e os{' '}
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                >
                                    Termos de Uso
                                </button>
                                .
                            </span>
                        </label>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-blue-500 group overflow-hidden relative"
                        isLoading={loading}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            Salvar e Continuar
                            <AlertCircle size={20} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Button>
                </form>
            </div>

            <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
            <TermsOfUseModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
        </Modal>
    );
};
