import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2, Users, AlertCircle, CreditCard, Bus, Calendar, Filter, ChevronDown } from 'lucide-react';
import { GoHistory } from 'react-icons/go';
import { CiGlobe } from 'react-icons/ci';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ProtectedAction } from '@/components/ProtectedAction';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/useAuthStore';
import { Trip, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';

export const TripList: React.FC = () => {
    const { trips, fetchViagens, deleteViagem, loading, selectedTripId, setSelectedTripId } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { fetchPassageiros } = usePassengerStore();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<'future' | 'past' | 'all'>('future');
    const [paymentModalTrip, setPaymentModalTrip] = useState<Trip | null>(null);

    useEffect(() => {
        fetchViagens();
        fetchOnibus();
        fetchPassageiros();
    }, [fetchViagens, fetchOnibus, fetchPassageiros]);

    const handleTripClick = async (trip: Trip) => {
        // Admins always have access
        if (user?.role === UserRole.ADMIN) {
            navigate(`/viagens/${trip.id}`);
            return;
        }

        // For non-admins (passengers), check payment
        try {
            // Check if there's a confirmed payment for this passenger in this trip
            const { data: results, error } = await supabase
                .from('viagem_passageiros')
                .select('id, pagamento')
                .eq('viagem_id', trip.id)
                .or(`passageiro_id.eq.${user?.id},pago_por.eq.${user?.id}`)
                .in('pagamento', ['Pago', 'Realizado']);

            if (error) throw error;

            if (results && results.length > 0) {
                // Payment confirmed, go to map
                navigate(`/viagens/${trip.id}`);
            } else {
                // No payment confirmed, show blocking modal
                setPaymentModalTrip(trip);
            }
        } catch (err) {
            console.error('Error checking payment:', err);
            showToast('Erro ao verificar status de pagamento', 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteViagem(deleteId);
            showToast('Viagem excluída com sucesso!', 'success');
            setDeleteId(null);
        } catch (error) {
            showToast('Erro ao excluir viagem', 'error');
        }
    };

    const getBusNames = (busIds?: string[]): string[] => {
        if (!busIds || busIds.length === 0) return [];
        return busIds.map(id => {
            const bus = buses.find((b) => b.id === id);
            return bus ? bus.nome : 'Ônibus não encontrado';
        });
    };

    const getOccupiedSeats = (tripId: string) => {
        const { enrollments, passengers } = usePassengerStore.getState();
        const blockedIdentityId = passengers.find(p => p.nome_completo === 'BLOQUEADO')?.id;

        // Count confirmed payments OR assigned seats as occupied "quotas"
        // EXCLUDING internal blocks from the occupancy count
        return enrollments.filter((e) => {
            if (e.viagem_id !== tripId) return false;
            // Exclude blocks
            if (blockedIdentityId && e.passageiro_id === blockedIdentityId) return false;

            return (e.pagamento === 'Pago' || e.pagamento === 'Realizado') || e.assento;
        }).length;
    };

    const getTotalSeats = (busIds?: string[]) => {
        if (!busIds || busIds.length === 0) return 0;
        return busIds.reduce((total, busId) => {
            const bus = buses.find((b) => b.id === busId);
            return total + (bus ? bus.capacidade : 0);
        }, 0);
    };

    const now = new Date();
    const isSoldOut = paymentModalTrip ? (getTotalSeats(paymentModalTrip.onibus_ids) - getOccupiedSeats(paymentModalTrip.id)) <= 0 : false;
    const isPastTrip = paymentModalTrip ? new Date(paymentModalTrip.data_ida) < now : false;
    const availableSeats = paymentModalTrip ? (getTotalSeats(paymentModalTrip.onibus_ids) - getOccupiedSeats(paymentModalTrip.id)) : 0;
    const sortedTrips = [...trips].sort((a, b) => {
        const dateA = new Date(a.data_ida).getTime();
        const dateB = new Date(b.data_ida).getTime();

        // Use timeFilter only if admin. Otherwise always future.
        const effectiveFilter = user?.role === UserRole.ADMIN ? timeFilter : 'future';

        if (effectiveFilter === 'future') return dateA - dateB;
        return dateB - dateA; // past or all
    });

    const tripsByTime = sortedTrips.filter(t => {
        const effectiveFilter = user?.role === UserRole.ADMIN ? timeFilter : 'future';
        if (effectiveFilter === 'all') return true;
        const isFuture = new Date(t.data_ida) >= now;
        return effectiveFilter === 'future' ? isFuture : !isFuture;
    });

    const tripsInView = selectedTripId && selectedTripId !== 'all'
        ? tripsByTime.filter(t => t.id === selectedTripId)
        : tripsByTime;

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Data inválida';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Data inválida';
            }
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return 'Data inválida';
        }
    };

    const formatPrettyDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate();
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };


    return (
        <div className="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in duration-500">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <MapPin className="text-white" size={20} />
                            </div>
                            Viagens
                        </h1>
                        <p className="text-gray-500 text-sm ml-[52px]">Gestão de rotas, destinos e ocupação.</p>
                    </div>

                    <ProtectedAction requiredPermission="create">
                        <Link
                            to="/viagens/nova"
                            className="w-full sm:w-auto rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                        >
                            <Button
                                tabIndex={-1}
                                className="w-full sm:w-auto h-11 px-6 rounded-xl shadow-blue-100 shadow-lg whitespace-nowrap"
                            >
                                <Plus size={20} className="mr-2" />
                                <span>Nova Viagem</span>
                            </Button>
                        </Link>
                    </ProtectedAction>
                </div>

                {/* Unified Toolbar Container (Matched to Dashboard) */}
                <div className="flex flex-col gap-4 bg-white/50 p-2 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm">
                    {/* Filter Tabs Block - Only for Admins */}
                    {user?.role === UserRole.ADMIN && (
                        <div className="flex p-1 bg-gray-100/80 rounded-xl w-full sm:w-fit">
                            {[
                                { id: 'future', label: 'Próximas', icon: Calendar },
                                { id: 'past', label: 'Passadas', icon: GoHistory },
                                { id: 'all', label: 'Todas', icon: CiGlobe }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setTimeFilter(tab.id as any);
                                        setSelectedTripId(null);
                                    }}
                                    className={cn(
                                        "flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                                        timeFilter === tab.id
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <tab.icon size={18} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Integrated Trip Selector */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                            <Filter size={18} />
                        </div>
                        <select
                            value={selectedTripId || 'all'}
                            onChange={(e) => setSelectedTripId(e.target.value === 'all' ? null : e.target.value)}
                            className="w-full pl-11 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 transition-all outline-none font-medium text-gray-700 appearance-none cursor-pointer text-sm"
                        >
                            <option value="all">Filtro de Viagem...</option>
                            {tripsByTime.map(trip => (
                                <option key={trip.id} value={trip.id}>
                                    {trip.nome} — {formatPrettyDate(trip.data_ida)}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </div>
            </div>

            <Card>
                {loading ? (
                    <p className="text-gray-500">Carregando...</p>
                ) : trips.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Nenhuma viagem cadastrada</p>
                        <Link to="/viagens/nova">
                            <Button>Cadastrar Primeira Viagem</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="text-left py-3 px-6">Identificação</th>
                                        <th className="text-left py-3 px-6">Destino</th>
                                        <th className="text-left py-3 px-6">Data e Horário</th>
                                        <th className="text-left py-3 px-6">Frota Escalada</th>
                                        <th className="text-left py-3 px-6">Ocupação</th>
                                        {user?.role === UserRole.ADMIN && (
                                            <th className="text-right py-3 px-6">Ações</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tripsInView.map((trip) => {
                                        const occupied = getOccupiedSeats(trip.id);
                                        const total = getTotalSeats(trip.onibus_ids);
                                        const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

                                        return (
                                            <tr
                                                key={trip.id}
                                                onClick={() => handleTripClick(trip)}
                                                className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                                            >
                                                <td className="py-5 px-6 rounded-l-2xl">
                                                    <span className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{trip.nome}</span>
                                                </td>
                                                <td className="py-5 px-6 font-bold text-gray-600">{trip.destino}</td>
                                                <td className="py-5 px-6">
                                                    <div className="flex flex-col">
                                                        <div className="flex flex-col mb-2">
                                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Partida</span>
                                                            <span className="text-sm font-black text-gray-800">{formatDate(trip.data_ida).split(',')[0]} às {formatDate(trip.data_ida).split(',')[1]}</span>
                                                        </div>
                                                        {trip.data_volta && (
                                                            <div className="flex flex-col border-t border-gray-50 pt-1">
                                                                <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Retorno</span>
                                                                <span className="text-sm font-black text-gray-800">{formatDate(trip.data_volta).split(',')[0]} às {formatDate(trip.data_volta).split(',')[1]}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    {trip.onibus_ids && trip.onibus_ids.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {getBusNames(trip.onibus_ids).map((name, idx) => (
                                                                <span key={idx} className="inline-flex items-center px-2.5 py-1 text-[10px] font-black bg-blue-50 text-blue-700 rounded-lg border border-blue-100/50 uppercase tracking-tighter">
                                                                    <Bus size={10} className="mr-1" />
                                                                    {name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pendente</span>
                                                    )}
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="flex flex-col gap-1.5 w-24">
                                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                            <span className={cn(occupancyRate > 90 ? "text-orange-600" : "text-blue-600")}>{occupied}</span>
                                                            <span className="text-gray-300">/ {total}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-full transition-all duration-1000",
                                                                    occupancyRate > 90 ? "bg-orange-500" : "bg-blue-600"
                                                                )}
                                                                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                {user?.role === UserRole.ADMIN && (
                                                    <td className="py-5 px-6 text-right rounded-r-2xl" onClick={(e) => e.stopPropagation()}>
                                                        <ProtectedAction requiredPermission="delete">
                                                            <button
                                                                onClick={() => setDeleteId(trip.id)}
                                                                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </ProtectedAction>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden space-y-4">
                            {tripsInView.map((trip) => {
                                const occupied = getOccupiedSeats(trip.id);
                                const total = getTotalSeats(trip.onibus_ids);
                                const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

                                return (
                                    <div
                                        key={trip.id}
                                        onClick={() => handleTripClick(trip)}
                                        className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group"
                                    >
                                        {user?.role === UserRole.ADMIN && (
                                            <div className="absolute top-0 right-0 p-4">
                                                <ProtectedAction requiredPermission="delete">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteId(trip.id);
                                                        }}
                                                        className="p-3 text-gray-300 hover:text-red-500 bg-gray-50 rounded-2xl transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </ProtectedAction>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-black text-xl text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                                    {trip.nome}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    <span className="text-sm font-bold text-gray-500">{trip.destino}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-y border-gray-50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Partida</span>
                                                    <span className="text-sm font-black text-gray-800">{formatDate(trip.data_ida)}</span>
                                                </div>
                                                {trip.data_volta && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Retorno</span>
                                                        <span className="text-sm font-black text-gray-800">{formatDate(trip.data_volta)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Frota Escalada</p>
                                                    {trip.onibus_ids && trip.onibus_ids.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {getBusNames(trip.onibus_ids).map((name, idx) => (
                                                                <span key={idx} className="inline-flex items-center px-3 py-1.5 text-[10px] font-black bg-blue-50 text-blue-700 rounded-xl border border-blue-100/50 uppercase">
                                                                    <Bus size={12} className="mr-1.5" />
                                                                    {name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs font-bold text-gray-400 italic">Nenhum ônibus escalado</p>
                                                    )}
                                                </div>

                                                <div className="pt-2">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ocupação</p>
                                                        <div className="text-right">
                                                            <span className="text-sm font-black text-blue-600">{occupied}</span>
                                                            <span className="text-xs font-bold text-gray-300 ml-1">/ {total} vagas</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={cn(
                                                                "h-full transition-all duration-1000 shadow-sm",
                                                                occupancyRate > 90 ? "bg-orange-500" : "bg-blue-600"
                                                            )}
                                                            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </Card>

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita."
            />

            {/* Modal de Pagamento Obrigatório - UI Premium */}
            <Modal
                isOpen={paymentModalTrip !== null}
                onClose={() => setPaymentModalTrip(null)}
                title={isSoldOut ? "Reservas Encerradas" : "Acesso Restrito"}
                size="sm"
                footer={
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                            variant="secondary"
                            onClick={() => setPaymentModalTrip(null)}
                            className="flex-1 order-2 sm:order-1"
                        >
                            Voltar
                        </Button>
                        {!isSoldOut && paymentModalTrip && (
                            <Button
                                variant="primary"
                                disabled={isPastTrip}
                                onClick={() => {
                                    const tripId = paymentModalTrip.id;
                                    setPaymentModalTrip(null);
                                    navigate(`/pagamento?v=${tripId}&search=${encodeURIComponent(user?.full_name || '')}`);
                                }}
                                className={cn(
                                    "flex-1 order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-blue-200 shadow-lg",
                                    isPastTrip && "opacity-50 grayscale cursor-not-allowed"
                                )}
                            >
                                <CreditCard size={18} className="mr-2" />
                                {isPastTrip ? 'Viagem Encerrada' : 'Ir para Pagamento'}
                            </Button>
                        )}
                    </div>
                }
            >
                <div className="relative -mt-2 space-y-6">
                    {paymentModalTrip && !isSoldOut ? (
                        <>
                            {/* Header Ilustrativo */}
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 scale-150 animate-pulse" />
                                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-200">
                                        <CreditCard size={40} className="text-white" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-blue-50">
                                        <AlertCircle size={24} className="text-amber-500" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-gray-900">Pagamento Necessário</h3>
                                    <p className="text-gray-500 max-w-[280px]">
                                        Para garantir sua vaga e escolher um assento, precisamos confirmar seu pagamento.
                                    </p>
                                </div>
                            </div>

                            {/* Vagas Disponíveis Card */}
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
                                        {availableSeats}
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
                                        <p className="text-sm font-semibold text-gray-800 truncate">{paymentModalTrip.nome}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                        <MapPin size={16} className="text-green-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Destino</p>
                                        <p className="text-sm font-semibold text-gray-800 truncate">{paymentModalTrip.destino}</p>
                                    </div>
                                </div>
                            </div>

                        </>
                    ) : (
                        paymentModalTrip && (
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
                        )
                    )}
                </div>
            </Modal>
        </div>
    );
};
