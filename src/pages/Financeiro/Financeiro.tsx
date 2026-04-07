import React, { useState, useEffect, useMemo } from 'react';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { useTripStore } from '@/stores/useTripStore';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';
import { Search, Filter, CircleDollarSign, ChevronDown, MapPin, Calendar, CheckCircle2, Clock, Users, DollarSign } from 'lucide-react';
import { GoHistory } from 'react-icons/go';
import { CiGlobe } from 'react-icons/ci';
import { WithdrawalModal } from '@/components/financeiro/WithdrawalModal';

export const Financeiro: React.FC = () => {
    const { passengers, enrollments, fetchPassageiros, updatePassageiro, loading: loadingPassengers } = usePassengerStore();
    const { trips, fetchViagens, selectedTripId, setSelectedTripId } = useTripStore();
    const { showToast } = useToast();

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState<'future' | 'past' | 'all'>('future');
    const now = new Date();
    const [withdrawalModal, setWithdrawalModal] = useState<{ isOpen: boolean; tripName: string; amount: number }>({
        isOpen: false,
        tripName: '',
        amount: 0
    });

    useEffect(() => {
        fetchPassageiros();
        fetchViagens();
    }, [fetchPassageiros, fetchViagens]);

    // 1. Process all enrollments to create financial entries
    const financialEntries = useMemo(() => {

        return enrollments
            .map(enroll => {
                const passenger = passengers.find(p => p.id === enroll.passageiro_id);
                const trip = trips.find(t => t.id === enroll.viagem_id);

                if (!passenger || !trip || passenger.nome_completo === 'BLOQUEADO') return null;

                const isDesistente = enroll.assento === 'DESISTENTE';
                
                // Unified case-insensitive payment check
                const pStatus = (enroll.pagamento || '').toString().toLowerCase();
                const isPaid = pStatus === 'pago' || pStatus === 'paid' || pStatus === 'realizado';

                // Exclusion logic: hide withdrawn participants who haven't paid
                if (isDesistente && !isPaid) {
                    return null;
                }

                // Filtering by time
                const matchesTime = timeFilter === 'all' || (() => {
                    const tripDate = new Date(trip.data_ida);
                    const cutoffDate = new Date(tripDate.getTime() + 24 * 60 * 60 * 1000);
                    const isInGracePeriod = cutoffDate >= now;
                    return timeFilter === 'future' ? isInGracePeriod : !isInGracePeriod;
                })();
                if (!matchesTime) return null;

                // Filtering by selected trip
                const matchesTrip = (!selectedTripId || selectedTripId === 'all') || enroll.viagem_id === selectedTripId;
                if (!matchesTrip) return null;

                // Filtering by status
                const matchesStatus = statusFilter === 'all' ||
                    (statusFilter === 'paid' && isPaid) ||
                    (statusFilter === 'pending' && (!isPaid));
                if (!matchesStatus) return null;

                // Filtering by search (name or seat)
                const matchesSearch = passenger.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (String(enroll.assento) || '').toLowerCase().includes(searchTerm.toLowerCase());
                if (!matchesSearch) return null;

                return {
                    passenger,
                    enrollment: enroll,
                    trip
                };
            })
            .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    }, [enrollments, passengers, trips, timeFilter, selectedTripId, statusFilter, searchTerm]);

    const groupedPassengers = useMemo(() => {
        return trips
            .map(trip => {
                const entriesInTrip = financialEntries.filter(e => e.enrollment.viagem_id === trip.id);
                const totalArrecadado = entriesInTrip.reduce((sum, e) => sum + (e.enrollment.valor_pago || 0), 0);
                const totalMeta = (trip as any).meta_financeira || (entriesInTrip.length * (trip.preco || 0));
                return {
                    trip,
                    entries: entriesInTrip,
                    totalArrecadado,
                    totalMeta
                };
            })
            .filter(group => group.entries.length > 0)
            .sort((a, b) => new Date(a.trip.data_ida).getTime() - new Date(b.trip.data_ida).getTime());
    }, [trips, financialEntries]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const passenger = passengers.find(p => p.id === id);
            if (!passenger) return;

            const trip = trips.find(t => t.id === passenger.enrollment?.viagem_id);
            const tripPreco = trip?.preco || 0;

            const pStatus = newStatus.toLowerCase();
            const isPaid = pStatus === 'pago' || pStatus === 'paid' || pStatus === 'realizado';
            const statusToSave = isPaid ? 'Pago' : 'Pendente';
            const valor_pago = isPaid ? tripPreco : 0;

            await updatePassageiro(id, {}, passenger.enrollment?.id, {
                pagamento: statusToSave as any,
                valor_pago
            });
            showToast('Pagamento atualizado!', 'success');
        } catch (error) {
            showToast('Erro ao atualizar pagamento', 'error');
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
            {/* Header & Main Controls */}
            <div className="flex flex-col gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CircleDollarSign className="text-white" size={20} />
                        </div>
                        Financeiro
                    </h1>
                    <p className="text-gray-500 text-sm ml-[52px]">Gestão de pagamentos e metas financeiras</p>
                </div>

                {/* Combined Filter Container (Identical to Dashboard) */}
                <div className="flex flex-col gap-4 bg-white/50 p-2 sm:p-3 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm">
                    {/* Time Filter Tabs */}
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
                                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                                    timeFilter === tab.id
                                        ? "bg-white text-emerald-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <tab.icon size={18} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Trip Selection Area */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                            <Filter size={18} />
                        </div>
                        <select
                            value={selectedTripId || 'all'}
                            onChange={(e) => setSelectedTripId(e.target.value === 'all' ? null : e.target.value)}
                            className="w-full h-11 pl-11 pr-10 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 focus:ring-4 focus:ring-emerald-50/50 focus:border-emerald-500 transition-all outline-none font-bold text-gray-700 appearance-none cursor-pointer text-sm"
                        >
                            <option value="all">Filtro de Viagem...</option>

                            {trips
                                .filter(t => {
                                    if (timeFilter === 'all') return true;
                                    const tripDate = new Date(t.data_ida);
                                    const cutoffDate = new Date(tripDate.getTime() + 24 * 60 * 60 * 1000);
                                    const isFuture = cutoffDate >= now;
                                    return timeFilter === 'future' ? isFuture : !isFuture;
                                })
                                .sort((a, b) => new Date(a.data_ida).getTime() - new Date(b.data_ida).getTime())
                                .map(trip => (
                                    <option key={trip.id} value={trip.id}>
                                        {trip.nome} — {formatPrettyDate(trip.data_ida)}
                                    </option>
                                ))
                            }
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="flex flex-col gap-4 bg-white/50 p-2 sm:p-3 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm w-full">
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por passageiro ou assento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-gray-50 dark:bg-gray-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w-fit">
                            {[
                                { id: 'all', label: 'Todos', icon: Users },
                                { id: 'paid', label: 'Pagos', icon: CheckCircle2 },
                                { id: 'pending', label: 'Pendentes', icon: Clock }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={cn(
                                        "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                                        statusFilter === tab.id
                                            ? "bg-white text-emerald-600 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <tab.icon size={16} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loadingPassengers ? (
                    <Spinner size="lg" text="Carregando dados..." fullScreen />
                ) : financialEntries.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Nenhum passageiro encontrado.</div>
                ) : (
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        {/* Desktop Table View */}
                        <table className="w-full text-left hidden sm:table border-collapse">
                            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-6 py-4">Passageiro</th>
                                    <th className="px-6 py-4 text-center">Assento</th>
                                    <th className="px-6 py-4 text-center">Valor</th>
                                    <th className="px-6 py-4 text-right pr-12">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {groupedPassengers.map((group) => (
                                    <React.Fragment key={group.trip.id}>
                                        {/* Trip Section Header */}
                                        <tr className="bg-emerald-50/50">
                                            <td colSpan={4} className="px-6 py-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={14} className="text-emerald-600" />
                                                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                                                            {group.trip.nome} — {formatPrettyDate(group.trip.data_ida)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        {(() => {
                                                            const tripDate = new Date(group.trip.data_ida);
                                                            const isFuture = new Date(tripDate.getTime() + 24 * 60 * 60 * 1000) >= now;
                                                            return isFuture && group.totalArrecadado >= group.totalMeta && group.totalMeta > 0;
                                                        })() && (
                                                            <button
                                                                onClick={() => setWithdrawalModal({ isOpen: true, tripName: group.trip.nome, amount: group.totalArrecadado })}
                                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 active:scale-95 translate-y-[-4px]"
                                                            >
                                                                <DollarSign size={14} />
                                                                Solicitar Saque
                                                            </button>
                                                        )}
                                                        <div className="flex flex-col items-end gap-1.5 min-w-[320px]">
                                                            <div className="flex items-center gap-3 bg-white/80 px-4 py-1.5 rounded-xl border border-emerald-100 shadow-sm transition-all hover:border-emerald-200">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Arrecadado</span>
                                                                    <span className="text-sm font-mono font-black text-emerald-600 leading-none">
                                                                        R$ {group.totalArrecadado.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                                <div className="w-[1px] h-3 bg-emerald-100" />
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Meta</span>
                                                                    <span className="text-sm font-mono font-black text-gray-600 leading-none">
                                                                        R$ {group.totalMeta.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                                {group.totalMeta > 0 && (
                                                                    <>
                                                                        <div className="w-[1px] h-3 bg-emerald-100" />
                                                                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg leading-none border border-emerald-100/50">
                                                                            {Math.floor((group.totalArrecadado / group.totalMeta) * 100)}%
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden p-[1px] border border-gray-50 flex-shrink-0">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                                                    style={{ width: `${Math.min(100, (group.totalArrecadado / (group.totalMeta || 1)) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {group.entries.map((entry) => {
                                            const p = entry.passenger;
                                            const e = entry.enrollment;
                                            const currentStatus = e?.pagamento || 'Pendente';
                                            const pStatus = currentStatus.toString().toLowerCase();
                                            const isPaid = pStatus === 'pago' || pStatus === 'paid' || pStatus === 'realizado';

                                            return (
                                                <tr key={`${p.id}-${e.id}`} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="font-semibold text-gray-900">{p.nome_completo}</div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center font-mono text-gray-600 font-bold">{e?.assento || '-'}</td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className={cn(
                                                            "font-mono font-bold",
                                                            isPaid ? "text-emerald-600" : "text-gray-400"
                                                        )}>
                                                            R$ {e?.valor_pago?.toFixed(2) || '0,00'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right pr-8">
                                                        <button
                                                            onClick={() => {
                                                                const newStatus = isPaid ? 'Pendente' : 'Pago';
                                                                handleUpdateStatus(p.id, newStatus);
                                                            }}
                                                            className={cn(
                                                                "px-4 py-1.5 rounded-full text-xs font-bold border-none outline-none ring-1 transition-all min-w-[100px] hover:scale-105 active:scale-95",
                                                                isPaid ? "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 ring-emerald-200 hover:from-emerald-200 hover:to-emerald-100 shadow-sm" :
                                                                    "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 ring-amber-200 hover:from-amber-200 hover:to-amber-100 shadow-sm"
                                                            )}
                                                        >
                                                            {isPaid ? 'PAGO' : 'PENDENTE'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-4 pb-6 px-3 bg-gray-50/50">
                            {groupedPassengers.map((group) => (
                                <div key={group.trip.id} className="space-y-3 pt-4">
                                    {/* Mobile Group Header Card */}
                                    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                                        <div className="bg-emerald-50/50 px-4 py-3 border-b border-emerald-50">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                                                    <MapPin size={14} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-black text-emerald-900 uppercase tracking-tight">
                                                        {group.trip.nome}
                                                    </h3>
                                                    <p className="text-[10px] font-bold text-emerald-600/60 uppercase">
                                                        {formatPrettyDate(group.trip.data_ida)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x divide-emerald-50">
                                            <div className="p-3 text-center">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Arrecadado</p>
                                                <p className="text-sm font-mono font-black text-emerald-600">R$ {group.totalArrecadado.toFixed(2)}</p>
                                            </div>
                                            <div className="p-3 text-center">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Meta</p>
                                                <p className="text-sm font-mono font-black text-gray-600">R$ {group.totalMeta.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        {(() => {
                                            const tripDate = new Date(group.trip.data_ida);
                                            const isFuture = new Date(tripDate.getTime() + 24 * 60 * 60 * 1000) >= now;
                                            return isFuture && group.totalArrecadado >= group.totalMeta && group.totalMeta > 0;
                                        })() && (
                                            <div className="px-4 pb-4">
                                                <button
                                                    onClick={() => setWithdrawalModal({ isOpen: true, tripName: group.trip.nome, amount: group.totalArrecadado })}
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 active:scale-95"
                                                >
                                                    <DollarSign size={16} />
                                                    Solicitar Saque
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile Passenger List */}
                                    <div className="space-y-2">
                                        {group.entries.map((entry) => {
                                            const p = entry.passenger;
                                            const e = entry.enrollment;
                                            const currentStatus = e?.pagamento || 'Pendente';
                                            const pStatus = currentStatus.toString().toLowerCase();
                                            const isPaid = pStatus === 'pago' || pStatus === 'paid' || pStatus === 'realizado';

                                            return (
                                                <div
                                                    key={`${p.id}-${e.id}`}
                                                    className={cn(
                                                        "relative overflow-hidden bg-white rounded-2xl border transition-all p-4 space-y-3",
                                                        isPaid ? "border-emerald-100 shadow-sm" : "border-gray-100 shadow-sm"
                                                    )}
                                                >
                                                    {/* Left Status Bar */}
                                                    <div className={cn(
                                                        "absolute left-0 top-0 bottom-0 w-1",
                                                        isPaid ? "bg-emerald-500" : "bg-amber-400"
                                                    )} />

                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <div className="font-black text-gray-900 leading-tight text-sm uppercase tracking-tight">
                                                                {p.nome_completo}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Assento:</span>
                                                                <span className="text-[10px] font-black text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                                                    #{e?.assento || 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
                                                        <div className={cn(
                                                            "font-mono font-black text-xs px-3 py-2 rounded-xl border flex-shrink-0",
                                                            isPaid ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-gray-400 bg-gray-50 border-gray-100"
                                                        )}>
                                                            R$ {e?.valor_pago?.toFixed(2) || '0,00'}
                                                        </div>

                                                        <button
                                                            onClick={() => {
                                                                const newStatus = isPaid ? 'Pendente' : 'Pago';
                                                                handleUpdateStatus(p.id, newStatus);
                                                            }}
                                                            className={cn(
                                                                "px-6 py-2 rounded-xl text-[10px] font-black border-none outline-none ring-1 transition-all uppercase tracking-widest flex-1 max-w-[140px] text-center ml-auto",
                                                                isPaid ? "bg-emerald-100 text-emerald-700 ring-emerald-200 active:bg-emerald-200" :
                                                                    "bg-amber-100 text-amber-700 ring-amber-200 active:bg-amber-200"
                                                            )}
                                                        >
                                                            {isPaid ? 'PAGO' : 'PENDENTE'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* Withdrawal Modal */}
                <WithdrawalModal
                    isOpen={withdrawalModal.isOpen}
                    onClose={() => setWithdrawalModal(prev => ({ ...prev, isOpen: false }))}
                    tripName={withdrawalModal.tripName}
                    amount={withdrawalModal.amount}
                />
            </div>
        </div>
    );
};
