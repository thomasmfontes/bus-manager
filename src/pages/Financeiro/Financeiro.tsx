import React, { useState, useEffect } from 'react';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { useTripStore } from '@/stores/useTripStore';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import { Search, Filter, CircleDollarSign, ChevronDown, MapPin, Calendar, ArrowRight, LayoutDashboard } from 'lucide-react';

export const Financeiro: React.FC = () => {
    const { passengers, fetchPassageiros, updatePassageiro, loading: loadingPassengers } = usePassengerStore();
    const { trips, fetchViagens } = useTripStore();
    const { showToast } = useToast();

    const [selectedTripId, setSelectedTripId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState<'future' | 'past' | 'all'>('future');

    useEffect(() => {
        fetchPassageiros();
        fetchViagens();
    }, [fetchPassageiros, fetchViagens]);

    // Only show passengers that are assigned to a trip
    const tripPassengers = passengers.filter(p => p.viagem_id !== null && p.assento !== null);
    const now = new Date();

    const filteredPassengers = tripPassengers.filter(p => {
        const passengerTrip = trips.find(t => t.id === p.viagem_id);
        const matchesTime = timeFilter === 'all' || (passengerTrip && (
            timeFilter === 'future' ? new Date(passengerTrip.data_ida) >= now : new Date(passengerTrip.data_ida) < now
        ));

        const matchesTrip = selectedTripId === 'all' || p.viagem_id === selectedTripId;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'paid' && (p.pagamento === 'paid' || p.pagamento === 'Realizado' || p.pagamento === 'Pago')) ||
            (statusFilter === 'pending' && (p.pagamento === 'pending' || p.pagamento === 'Pendente' || !p.pagamento));
        const matchesSearch = p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.assento || '').toLowerCase().includes(searchTerm.toLowerCase());

        return matchesTime && matchesTrip && matchesStatus && matchesSearch;
    });

    const groupedPassengers = trips
        .map(trip => {
            const passengersInTrip = filteredPassengers.filter(p => p.viagem_id === trip.id);
            const totalArrecadado = passengersInTrip.reduce((sum, p) => sum + (p.valor_pago || 0), 0);
            const totalMeta = (trip as any).meta_financeira || (passengersInTrip.length * (trip.preco || 0));
            return {
                trip,
                passengers: passengersInTrip,
                totalArrecadado,
                totalMeta
            };
        })
        .filter(group => group.passengers.length > 0);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const passenger = passengers.find(p => p.id === id);
            if (!passenger) return;

            const trip = trips.find(t => t.id === passenger.viagem_id);
            const tripPreco = trip?.preco || 0;

            const isPaid = newStatus === 'paid' || newStatus === 'Realizado' || newStatus === 'Pago';
            const statusToSave = isPaid ? 'Pago' : 'Pendente';
            const valor_pago = isPaid ? tripPreco : 0;

            await updatePassageiro(id, {
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
        <div className="space-y-6 w-full animate-in fade-in duration-500">
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
                <div className="flex flex-col gap-4 bg-white/50 p-2 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm">
                    {/* Time Filter Tabs */}
                    <div className="flex p-1 bg-gray-100/80 rounded-xl w-full sm:w-fit">
                        {[
                            { id: 'future', label: 'Próximas', icon: Calendar },
                            { id: 'past', label: 'Passadas', icon: ArrowRight },
                            { id: 'all', label: 'Todas', icon: LayoutDashboard }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setTimeFilter(tab.id as any);
                                    setSelectedTripId('all');
                                }}
                                className={cn(
                                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                                    timeFilter === tab.id
                                        ? "bg-white text-emerald-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Trip Selection Area */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                            <Filter size={18} />
                        </div>
                        <select
                            value={selectedTripId}
                            onChange={(e) => setSelectedTripId(e.target.value)}
                            className="w-full pl-11 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 focus:ring-4 focus:ring-emerald-50/50 focus:border-emerald-500 transition-all outline-none font-medium text-gray-700 appearance-none cursor-pointer text-sm"
                        >
                            <option value="all">Filtro de Viagem...</option>

                            {trips
                                .filter(t => {
                                    if (timeFilter === 'all') return true;
                                    const isFuture = new Date(t.data_ida) >= now;
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
            <div className="flex flex-col gap-4 bg-white/50 p-2 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm w-full">
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por passageiro ou assento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Status Filter */}
                        <div className="relative group min-w-[170px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:border-gray-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-medium text-gray-700 dark:text-gray-300 appearance-none cursor-pointer text-sm"
                            >
                                <option value="all">TODOS OS STATUS</option>
                                <option value="paid">PAGOS</option>
                                <option value="pending">PENDENTES</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                {loadingPassengers ? (
                    <div className="p-12 text-center text-gray-500">Carregando dados...</div>
                ) : filteredPassengers.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Nenhum passageiro encontrado com assento atribuído.</div>
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
                                        {group.passengers.map((p: any) => (
                                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-semibold text-gray-900">{p.nome_completo}</div>
                                                </td>
                                                <td className="px-6 py-5 text-center font-mono text-gray-600 font-bold">{p.assento || '-'}</td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={cn(
                                                        "font-mono font-bold",
                                                        (p.pagamento === 'paid' || p.pagamento === 'Realizado' || p.pagamento === 'Pago') ? "text-emerald-600" : "text-gray-400"
                                                    )}>
                                                        R$ {p.valor_pago?.toFixed(2) || '0,00'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right pr-8">
                                                    <button
                                                        onClick={() => {
                                                            const currentStatus = p.pagamento || 'Pendente';
                                                            const isCurrentlyPaid = currentStatus === 'paid' || currentStatus === 'Realizado' || currentStatus === 'Pago';
                                                            const newStatus = isCurrentlyPaid ? 'Pendente' : 'Pago';
                                                            handleUpdateStatus(p.id, newStatus);
                                                        }}
                                                        className={cn(
                                                            "px-4 py-1.5 rounded-full text-xs font-bold border-none outline-none ring-1 transition-all min-w-[100px] hover:scale-105 active:scale-95",
                                                            (p.pagamento === 'paid' || p.pagamento === 'Realizado' || p.pagamento === 'Pago') ? "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 ring-emerald-200 hover:from-emerald-200 hover:to-emerald-100 shadow-sm" :
                                                                "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 ring-amber-200 hover:from-amber-200 hover:to-amber-100 shadow-sm"
                                                        )}
                                                    >
                                                        {(p.pagamento === 'paid' || p.pagamento === 'Realizado' || p.pagamento === 'Pago') ? 'PAGO' : 'PENDENTE'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
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
                                    </div>

                                    {/* Mobile Passenger List */}
                                    <div className="space-y-2">
                                        {group.passengers.map((p: any) => (
                                            <div
                                                key={p.id}
                                                className={cn(
                                                    "relative overflow-hidden bg-white rounded-2xl border transition-all p-4 space-y-3",
                                                    (p.pagamento === 'paid' || p.pagamento === 'Realizado' || p.pagamento === 'Pago')
                                                        ? "border-emerald-100 shadow-sm"
                                                        : "border-gray-100 shadow-sm"
                                                )}
                                            >
                                                {/* Left Status Bar */}
                                                <div className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-1",
                                                    (p.pagamento === 'paid' || p.pagamento === 'Realizado' || p.pagamento === 'Pago') ? "bg-emerald-500" : "bg-amber-400"
                                                )} />

                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <div className="font-black text-gray-900 leading-tight text-sm uppercase tracking-tight">
                                                            {p.nome_completo}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Assento:</span>
                                                            <span className="text-[10px] font-black text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                                                #{p.assento || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
                                                    <div className={cn(
                                                        "font-mono font-black text-xs px-3 py-2 rounded-xl border flex-shrink-0",
                                                        (p.pagamento === 'paid' || p.pagamento === 'Realizado')
                                                            ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                                                            : "text-gray-400 bg-gray-50 border-gray-100"
                                                    )}>
                                                        R$ {p.valor_pago?.toFixed(2) || '0,00'}
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            const currentStatus = p.pagamento || 'Pendente';
                                                            const isCurrentlyPaid = currentStatus === 'paid' || currentStatus === 'Realizado' || currentStatus === 'Pago';
                                                            const newStatus = isCurrentlyPaid ? 'Pendente' : 'Pago';
                                                            handleUpdateStatus(p.id, newStatus);
                                                        }}
                                                        className={cn(
                                                            "px-6 py-2 rounded-xl text-[10px] font-black border-none outline-none ring-1 transition-all uppercase tracking-widest flex-1 max-w-[140px] text-center ml-auto",
                                                            (p.pagamento === 'paid' || p.pagamento === 'Realizado' || p.pagamento === 'Pago')
                                                                ? "bg-emerald-100 text-emerald-700 ring-emerald-200 active:bg-emerald-200"
                                                                : "bg-amber-100 text-amber-700 ring-amber-200 active:bg-amber-200"
                                                        )}
                                                    >
                                                        {(p.pagamento === 'paid' || p.pagamento === 'Realizado' || p.pagamento === 'Pago') ? 'PAGO' : 'PENDENTE'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
