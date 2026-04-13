import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { User, AlertCircle, Search, ChevronRight } from 'lucide-react';
import { Passenger } from '@/types';
import { cn } from '@/utils/cn';

interface SubstitutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    enrollmentId: string;
    tripId: string;
    passengerName: string;
    onSuccess?: () => void;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
    isOpen,
    onClose,
    enrollmentId,
    tripId,
    passengerName,
    onSuccess
}) => {
    const { user } = useAuthStore();
    const { passengers, fetchPassageiros } = usePassengerStore();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tripPayments, setTripPayments] = useState<Set<string>>(new Set());

    const [formData, setFormData] = useState({
        nome_completo: '',
        cpf_rg: '',
        telefone: '',
    });

    useEffect(() => {
        if (isOpen && passengers.length === 0) {
            fetchPassageiros();
        }
    }, [isOpen, passengers.length, fetchPassageiros]);

    useEffect(() => {
        async function fetchTripPayments() {
            if (!isOpen || !tripId) return;

            try {
                const { data, error } = await supabase
                    .from('pagamentos')
                    .select('passageiros_ids')
                    .eq('viagem_id', tripId)
                    .in('status', ['paid', 'Pago', 'Realizado']);

                if (error) throw error;

                const paidIds = new Set<string>();
                (data as any[])?.forEach(p => {
                    p.passageiros_ids?.forEach((id: string) => paidIds.add(id));
                });
                setTripPayments(paidIds);
            } catch (err) {
                console.error('Error fetching trip payments:', err);
            }
        }
        fetchTripPayments();
    }, [isOpen, tripId]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase().trim();
        return passengers.filter(p => {
            const isSystemIdentity = p.nome_completo === 'BLOQUEADO' || p.cpf_rg === 'BLOCKED';
            if (isSystemIdentity) return false;
            return p.nome_completo.toLowerCase().includes(query) ||
                (p.cpf_rg && p.cpf_rg.toLowerCase().includes(query));
        }).slice(0, 5); // Limit to top 5 for cleaner UI
    }, [searchQuery, passengers]);

    const handleSelectPassenger = (p: Passenger) => {
        setFormData({
            nome_completo: p.nome_completo,
            cpf_rg: p.cpf_rg || '',
            telefone: p.telefone || '',
        });
        setShowConfirm(true);
    };


    const handleSubstitute = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/enrollments/substitute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enrollmentId,
                    newPassengerData: formData,
                    requesterId: user?.id
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao realizar transferência');
            }

            showToast('Vaga transferida com sucesso!', 'success');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error substituting passenger:', error);
            showToast(error.message || 'Erro ao transferir vaga', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose();
                setShowConfirm(false);
                setSearchQuery('');
            }}
            title="Transferir Vaga"
            size="sm"
        >
            {!showConfirm ? (
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                        <div className="mt-1 p-1 bg-blue-100 rounded-lg text-blue-600">
                            <AlertCircle size={18} />
                        </div>
                        <p className="text-xs text-blue-800 leading-relaxed font-medium">
                            Transferindo a vaga de <strong>{passengerName}</strong>.
                            O pagamento será mantido e o assento liberado.
                        </p>
                    </div>

                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por nome ou documento..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-bold text-sm"
                            />
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {searchResults.map(p => {
                                const isPaid = tripPayments.has(p.id);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => !isPaid && handleSelectPassenger(p)}
                                        disabled={isPaid}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl transition-all group",
                                            isPaid ? "opacity-50 grayscale cursor-not-allowed" : "hover:border-blue-200 hover:bg-blue-50/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                isPaid ? "bg-gray-100 text-gray-400" : "bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                                            )}>
                                                <User size={16} />
                                            </div>
                                            <div className="text-left">
                                                <p className={cn(
                                                    "text-sm font-black line-clamp-1",
                                                    isPaid ? "text-gray-400" : "text-gray-800"
                                                )}>
                                                    {p.nome_completo}
                                                </p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    {isPaid ? "Já Pago" : (p.cpf_rg || 'Sem Documento')}
                                                </p>
                                            </div>
                                        </div>
                                        {!isPaid && <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />}
                                    </button>
                                );
                            })}

                            {searchQuery.length > 2 && searchResults.length === 0 && (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ninguém encontrado</p>
                                    <p className="text-[10px] text-gray-400 mt-1">A pessoa precisa estar cadastrada no sistema.</p>
                                </div>
                            )}

                            {!searchQuery && (
                                <div className="p-8 text-center text-gray-400 italic">
                                    <p className="text-xs">Digite o nome da pessoa para buscar no sistema.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-4">
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-amber-900">Confirmar Transferência?</h3>
                            <p className="text-sm text-amber-700 leading-relaxed">
                                Esta ação é irreversível. O acesso de <strong>{passengerName}</strong> será encerrado e a vaga vinculada a:
                            </p>
                        </div>

                        <div className="bg-white/60 p-4 rounded-xl space-y-1 border border-amber-100">
                            <p className="text-sm font-black text-gray-900">{formData.nome_completo}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{formData.cpf_rg}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleSubstitute}
                            isLoading={loading}
                            className="w-full h-12 bg-amber-600 hover:bg-amber-700 border-none shadow-lg shadow-amber-200"
                        >
                            Confirmar e Transferir
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setShowConfirm(false)}
                            disabled={loading}
                            className="w-full"
                        >
                            Voltar e Corrigir
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

