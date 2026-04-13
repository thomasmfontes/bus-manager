import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { useBusStore } from '@/stores/useBusStore';
import { Users, AlertCircle, MapPin, User, ChevronRight, CheckCircle2, Check, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Trip } from '@/types';

interface TripEnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: Trip | null;
}

export const TripEnrollmentModal: React.FC<TripEnrollmentModalProps> = ({ isOpen, onClose, trip }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuthStore();
    const { passengers, fetchPassageiros } = usePassengerStore();
    const { buses } = useBusStore();

    const [interestStep, setInterestStep] = useState<'info' | 'selection' | 'passengers'>('info');
    const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);
    const [passengerSearch, setPassengerSearch] = useState('');
    const [currentTripEnrollments, setCurrentTripEnrollments] = useState<Set<string>>(new Set());
    const [selectedInterestPassengers, setSelectedInterestPassengers] = useState<any[]>([]);

    // Reset state when modal opens/closes or trip changes
    useEffect(() => {
        if (isOpen && trip) {
            setInterestStep('info');
            setSelectedInterestPassengers([]);
            setPassengerSearch('');

            const fetchEnrollments = async () => {
                const { data } = await supabase
                    .from('viagem_passageiros')
                    .select('passageiro_id')
                    .eq('viagem_id', trip.id);

                if (data) {
                    const enrolledSet = new Set(data.map(e => (e.passageiro_id || '').toString().toLowerCase().trim()));
                    setCurrentTripEnrollments(enrolledSet);
                }

                if (passengers.length === 0) {
                    fetchPassageiros();
                }
            };
            fetchEnrollments();
        }
    }, [isOpen, trip, passengers.length, fetchPassageiros]);

    const getTotalSeats = (onibusIds: string[]) => {
        if (!onibusIds || onibusIds.length === 0) return 0;
        return onibusIds.reduce((total: number, id: string) => {
            const bus = buses.find((b) => b.id === id);
            return total + (bus ? bus.capacidade : 0);
        }, 0);
    };

    const getOccupiedSeats = (tripId: string) => {
        const { enrollments } = usePassengerStore.getState();
        return enrollments.filter(e => e.viagem_id === tripId && e.assento !== 'DESISTENTE' && e.status === 'APPROVED').length;
    };

    const isUserOccupiedInTrip = (tripId: string) => {
        const { enrollments } = usePassengerStore.getState();
        return enrollments.some(e =>
            e.viagem_id === tripId &&
            e.assento !== 'DESISTENTE' &&
            (e.passageiro_id === user?.id || e.pago_por === user?.id)
        );
    };

    const isSoldOut = trip ? (getTotalSeats(trip.onibus_ids || []) - getOccupiedSeats(trip.id)) <= 0 && !isUserOccupiedInTrip(trip.id) : false;
    const availableSeats = trip ? (getTotalSeats(trip.onibus_ids || []) - getOccupiedSeats(trip.id)) : 0;

    const handleInterestSelection = (willTravel: boolean) => {
        if (!trip || !user?.id) return;

        if (willTravel) {
            const me = {
                id: user.id,
                nome_completo: user.full_name || 'Eu',
                cpf_rg: ''
            };
            setSelectedInterestPassengers([me]);
        } else {
            setSelectedInterestPassengers([]);
        }

        setInterestStep('passengers');
    };

    const searchResults = useMemo(() => {
        if (!passengerSearch.trim()) return [];
        const query = passengerSearch.toLowerCase().trim();

        return passengers.filter(p => {
            const isSystemIdentity = p.nome_completo === 'BLOQUEADO' || p.cpf_rg === 'BLOCKED';
            if (isSystemIdentity) return false;

            return p.nome_completo.toLowerCase().includes(query) ||
                (p.cpf_rg && p.cpf_rg.toLowerCase().includes(query));
        }).map(p => {
            const pId = (p.id || '').toString().toLowerCase().trim();
            const isEnrolled = currentTripEnrollments.has(pId);
            return {
                ...p,
                isEnrolled
            };
        }).slice(0, 5);
    }, [passengerSearch, passengers, currentTripEnrollments]);

    const togglePassenger = (passenger: any) => {
        const isRemoving = selectedInterestPassengers.find(p => p.id === passenger.id);

        if (!isRemoving && selectedInterestPassengers.length >= availableSeats) {
            return;
        }

        setSelectedInterestPassengers(prev => {
            const exists = prev.find(p => p.id === passenger.id);
            if (exists) return prev.filter(p => p.id !== passenger.id);
            return [...prev, passenger];
        });
    };

    const confirmInterestAndRedirect = async () => {
        if (!trip || !user?.id || selectedInterestPassengers.length === 0) {
            showToast('Selecione pelo menos um passageiro', 'error');
            return;
        }

        setIsSubmittingInterest(true);
        try {
            const enrollments = selectedInterestPassengers.map(p => ({
                viagem_id: trip.id,
                passageiro_id: p.id,
                pagamento: 'Pendente',
                pago_por: user.id,
                valor_pago: 0,
                status: trip.requires_approval ? 'PENDING' : 'APPROVED'
            }));

            const isSelfSelected = selectedInterestPassengers.some(p => p.id === user.id);
            const pids = selectedInterestPassengers.map(p => p.id).join(',');

            const { error } = await supabase
                .from('viagem_passageiros')
                .insert(enrollments);

            if (error) throw error;

            onClose();

            if (trip.requires_approval) {
                showToast('Solicitação enviada! Aguardando aprovação do organizador.', 'success');
                // Fica na mesma página (Dashboard/Itineraries)
            } else {
                showToast('Interesse registrado com sucesso!', 'success');
                navigate(`/pagamento?v=${trip.id}&pids=${pids}${isSelfSelected ? '&selectSelf=true' : '&skipSelf=true'}`);
            }
        } catch (err) {
            console.error('Error confirming interest:', err);
            showToast('Erro ao registrar interesse', 'error');
        } finally {
            setIsSubmittingInterest(false);
        }
    };

    if (!trip) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isSoldOut ? "Reservas Encerradas" : (
                interestStep === 'info' ? "Deseja participar?" :
                    interestStep === 'selection' ? "Quem vai viajar?" : "Selecionar Passageiros"
            )}
            size={interestStep === 'passengers' ? 'md' : 'sm'}
            footer={
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            if (interestStep === 'selection') {
                                setInterestStep('info');
                            } else if (interestStep === 'passengers') {
                                setInterestStep('selection');
                            } else {
                                onClose();
                            }
                        }}
                        className="flex-1 order-2 sm:order-1"
                    >
                        {interestStep === 'info' ? 'Fechar' : 'Voltar'}
                    </Button>
                    {!isSoldOut && (
                        interestStep === 'info' ? (
                            <Button
                                variant="primary"
                                onClick={() => setInterestStep('selection')}
                                className="flex-1 order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-blue-200 shadow-lg font-black uppercase tracking-widest text-[11px]"
                            >
                                <CheckCircle2 size={18} className="mr-2" />
                                Continuar
                            </Button>
                        ) : interestStep === 'passengers' ? (
                            <Button
                                variant="primary"
                                onClick={confirmInterestAndRedirect}
                                isLoading={isSubmittingInterest}
                                disabled={selectedInterestPassengers.length === 0}
                                className="flex-1 order-1 sm:order-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-none shadow-green-200 shadow-lg font-black uppercase tracking-widest text-[11px]"
                            >
                                <Check size={18} className="mr-2" />
                                Confirmar
                            </Button>
                        ) : null
                    )}
                </div>
            }
        >
            <div className="relative -mt-2 space-y-6">
                {!isSoldOut && interestStep === 'info' ? (
                    <>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 scale-150 animate-pulse" />
                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-200">
                                    <Users size={40} className="text-white" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-blue-50">
                                    <AlertCircle size={24} className="text-amber-500" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {trip.requires_approval ? 'Solicitar Participação' : 'Tenho Interesse!'}
                                </h3>
                                <p className="text-gray-500 max-w-[280px]">
                                    {trip.requires_approval 
                                        ? 'Esta excursão requer a aprovação manual do organizador.' 
                                        : 'Demonstre seu interesse nesta excursão para que possamos entrar em contato e garantir sua vaga.'}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vagas Disponíveis</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-blue-600">
                                    {Math.max(0, availableSeats)}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Origem</p>
                                    <p className="text-sm font-semibold text-gray-800 truncate">{trip.nome}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <MapPin size={16} className="text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Destino</p>
                                    <p className="text-sm font-semibold text-gray-800 truncate">{trip.destino}</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (!isSoldOut && interestStep === 'selection') ? (
                    <div className="space-y-4 py-2">
                        <div className="text-center space-y-2 mb-6">
                            <h3 className="text-xl font-black text-gray-900">Como você deseja participar?</h3>
                            <p className="text-sm text-gray-500 font-medium">Selecione se você viajará ou se está apenas pagando para outros.</p>
                        </div>

                        <button
                            onClick={() => handleInterestSelection(true)}
                            disabled={isSubmittingInterest}
                            className="w-full p-4 rounded-2xl border-2 border-transparent bg-blue-50 hover:bg-blue-100 transition-all text-left flex items-center gap-4 group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <User size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-gray-900 text-sm">Eu vou nesta viagem</p>
                                <p className="text-[11px] text-gray-500 font-bold">Reserva a sua vaga + opcionalmente de outras pessoas.</p>
                            </div>
                            <ChevronRight className="text-blue-400" />
                        </button>

                        <button
                            onClick={() => handleInterestSelection(false)}
                            disabled={isSubmittingInterest}
                            className="w-full p-4 rounded-2xl border-2 border-transparent bg-indigo-50 hover:bg-indigo-100 transition-all text-left flex items-center gap-4 group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                <Users size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-gray-900 text-sm">Apenas para outras pessoas</p>
                                <p className="text-[11px] text-gray-500 font-bold">Reservar para seus filhos/amigos.</p>
                            </div>
                            <ChevronRight className="text-indigo-400" />
                        </button>
                    </div>
                ) : (!isSoldOut && interestStep === 'passengers') ? (
                    <div className="space-y-5 py-2">
                        <div className="text-center space-y-1 mb-4">
                            <h3 className="text-xl font-black text-gray-900">Quais passageiros?</h3>
                            <p className="text-xs text-gray-500 font-bold">Adicione os nomes de quem viajará.</p>
                        </div>

                        {selectedInterestPassengers.find(p => p.id === user?.id) && (
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                        <User size={16} />
                                    </div>
                                    <p className="text-sm font-black text-blue-900">Você está selecionado</p>
                                </div>
                                <button
                                    onClick={() => togglePassenger({ id: user?.id })}
                                    className="text-blue-400 hover:text-blue-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou documento..."
                                    value={passengerSearch}
                                    onChange={(e) => setPassengerSearch(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-bold text-sm"
                                />
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {searchResults.map(p => {
                                    const isSelected = selectedInterestPassengers.find(sp => sp.id === p.id);
                                    const isEnrolled = (p as any).isEnrolled;
                                    const isLimitReached = !isSelected && selectedInterestPassengers.length >= availableSeats;
                                    const isDisabled = isEnrolled || isLimitReached;

                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => !isDisabled && togglePassenger(p)}
                                            disabled={isDisabled}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 rounded-xl transition-all group border-2",
                                                isSelected
                                                    ? "bg-blue-50 border-blue-500 shadow-sm"
                                                    : "bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/50",
                                                isDisabled && !isSelected && "opacity-60 cursor-not-allowed"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                    isDisabled ? "bg-gray-100 text-gray-400" : "bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                                                )}>
                                                    <User size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <p className={cn(
                                                        "text-sm font-black line-clamp-1",
                                                        isDisabled ? "text-gray-400" : "text-gray-800"
                                                    )}>
                                                        {p.nome_completo}
                                                    </p>
                                                    <div className="flex items-center gap-1.5">
                                                        <p className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            isEnrolled ? "text-red-500" : isLimitReached ? "text-amber-500" : "text-gray-400"
                                                        )}>
                                                            {isEnrolled ? "Já na Lista" : isLimitReached ? "Limite Atingido" : (p.cpf_rg || 'Sem Documento')}
                                                        </p>
                                                        {isLimitReached && !isEnrolled && !isSelected && <AlertCircle size={10} className="text-amber-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                            {!isDisabled && <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />}
                                        </button>
                                    );
                                })}

                                {passengerSearch.length > 0 && searchResults.length === 0 && (
                                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ninguém encontrado</p>
                                        <p className="text-[10px] text-gray-400 mt-1">A pessoa precisa estar cadastrada no sistema.</p>
                                    </div>
                                )}

                                {!passengerSearch && (
                                    <div className="p-8 text-center text-gray-400 italic">
                                        <p className="text-xs">Digite o nome da pessoa para buscar no sistema.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedInterestPassengers.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-2">Selecionados ({selectedInterestPassengers.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedInterestPassengers.map(p => (
                                        <div key={p.id} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-2">
                                            {p.nome_completo.split(' ')[0]}
                                            <button onClick={() => togglePassenger(p)} className="text-gray-400 hover:text-red-500">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-4 space-y-6">
                        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <AlertCircle size={40} />
                        </div>
                        <div className="flex gap-3 px-6 py-4 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-center">
                            <p className="text-base font-bold leading-relaxed">
                                Reservas Encerradas: Todas as vagas para esta excursão já foram preenchidas.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
