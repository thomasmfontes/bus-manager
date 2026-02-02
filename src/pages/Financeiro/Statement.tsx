import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import { CreditCard, Clock, ArrowDownLeft, ArrowUpRight, ChevronRight, AlertCircle, Calendar, Filter, ChevronDown } from 'lucide-react';
import { AiOutlineUnorderedList } from 'react-icons/ai';
import { GoHistory } from 'react-icons/go';
import { CiGlobe } from 'react-icons/ci';
import { formatCurrency } from '@/utils/formatters';
import { useTripStore } from '@/stores/useTripStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types';

interface StatementProps {
    userId?: string;
    hideHeader?: boolean;
    noAnimation?: boolean;
}

export const Statement = ({ userId, hideHeader = false, noAnimation = false }: StatementProps) => {
    const { showToast } = useToast();
    const { trips, fetchViagens, selectedTripId, setSelectedTripId } = useTripStore();
    const { passengers, fetchPassageiros } = usePassengerStore();
    const { user } = useAuthStore();
    const isAdmin = user?.role === UserRole.ADMIN;
    const [timeFilter, setTimeFilter] = useState<'future' | 'past' | 'all'>('all');

    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

    useEffect(() => {
        const init = async () => {
            if (trips.length === 0) await fetchViagens();
            if (passengers.length === 0) await fetchPassageiros();
            fetchPayments();
        };
        init();
    }, [filterStatus, userId, selectedTripId]);

    const fetchPayments = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('pagamentos')
                .select('*')
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                if (filterStatus === 'failed_expired') {
                    query = query.in('status', ['failed', 'expired']);
                } else {
                    query = query.eq('status', filterStatus);
                }
            }

            // Filter by trip if selected
            if (selectedTripId) {
                query = query.eq('viagem_id', selectedTripId);
            }

            // If userId is provided, filter for that user (as included passenger)
            if (userId) {
                // 1. First find the CPF/RG for this userId
                const { data: userData } = await supabase
                    .from('passageiros')
                    .select('cpf_rg')
                    .eq('id', userId)
                    .single();

                if (userData?.cpf_rg) {
                    // 2. Find all IDs associated with this identity:
                    // - Their own records (shared CPF/RG)
                    // - Records they PAID for (pago_por)
                    const { data: related } = await supabase
                        .from('passageiros')
                        .select('id')
                        .or(`cpf_rg.eq."${userData.cpf_rg}",pago_por.eq.${userId}`);

                    const allUserIds = related?.map(r => r.id) || [userId];

                    // 3. Find any payments that include ANY of these IDs in the passageiros_ids array
                    query = query.overlaps('passageiros_ids', allUserIds);
                } else {
                    // Fallback: If CPF not found, at least try to find things paid by this userId
                    const { data: related } = await supabase
                        .from('passageiros')
                        .select('id')
                        .eq('pago_por', userId);

                    const paidIds = related?.map(r => r.id) || [];
                    const allUserIds = [...new Set([userId, ...paidIds])];

                    query = query.overlaps('passageiros_ids', allUserIds);
                }
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            // Manual Join in Memory (using getState to get the most recent data after fetch)
            const currentTrips = useTripStore.getState().trips;
            const combinedData = (data || []).map(p => ({
                ...p,
                viagem: currentTrips.find(t => t.id === p.viagem_id)
            }));

            setPayments(combinedData);
        } catch (err: any) {
            console.error('🚨 Error fetching payments:', err);
            showToast('Erro ao carregar pagamentos', 'error');
        } finally {
            setLoading(false);
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

    const tripsInView = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return trips
            .filter(trip => {
                const tripDate = new Date(trip.data_ida);
                tripDate.setHours(0, 0, 0, 0);

                if (timeFilter === 'future') return tripDate >= now;
                if (timeFilter === 'past') return tripDate < now;
                return true;
            })
            .sort((a, b) => new Date(a.data_ida).getTime() - new Date(b.data_ida).getTime());
    }, [trips, timeFilter]);


    // Helper to group payments by date
    const groupedPayments = useMemo(() => {
        return (payments || []).reduce((groups: { [key: string]: any[] }, payment) => {
            const date = new Date(payment.created_at).toISOString().split('T')[0];
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(payment);
            return groups;
        }, {});
    }, [payments]);

    // Helper to format date in Itaú style (long date)
    const formatLongDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00'); // Add time to avoid timezone issues
        return new Intl.DateTimeFormat('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    return (
        <div className={cn("space-y-6 w-full max-w-7xl mx-auto", !noAnimation && "fade-in duration-500")}>
            {/* Header */}
            {!hideHeader && (
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg shadow-gray-900/20">
                            <AiOutlineUnorderedList className="text-white" size={20} />
                        </div>
                        Extrato
                    </h1>
                    <p className="text-gray-500 text-sm ml-[52px]">Acompanhamento detalhado de entradas e saídas.</p>
                </div>
            )}

            {/* Filters Container */}
            <div className="flex flex-col gap-4 bg-white/50 p-2 sm:p-3 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm group">
                {/* Time Filter Tabs - Only for Admins */}
                {isAdmin && !userId && (
                    <div className="flex p-1 bg-gray-100/80 rounded-xl w-full sm:w-fit">
                        {[
                            { id: 'future', label: 'Próximas', icon: Calendar },
                            { id: 'past', label: 'Passadas', icon: GoHistory },
                            { id: 'all', label: 'Todas', icon: CiGlobe }
                        ].map((filterItem) => (
                            <button
                                key={filterItem.id}
                                onClick={() => {
                                    setTimeFilter(filterItem.id as any);
                                    setSelectedTripId(null);
                                }}
                                className={cn(
                                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                                    timeFilter === filterItem.id
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <filterItem.icon size={18} />
                                <span className="hidden sm:inline">{filterItem.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
                    {/* Status Filter */}
                    <div className="relative w-full lg:w-48 shrink-0">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-gray-100 focus:border-gray-900 outline-none transition-all appearance-none text-gray-700 shadow-sm"
                        >
                            <option value="all">Filtro de Status...</option>
                            <option value="paid">Pagos</option>
                            <option value="pending">Pendentes</option>
                            <option value="failed_expired">Falhas / Expirados</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <ChevronDown size={16} />
                        </div>
                    </div>

                    {/* Integrated Trip Selector */}
                    {isAdmin && !userId && (
                        <div className="relative group w-full flex-1">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors pointer-events-none">
                                <Filter size={18} />
                            </div>
                            <select
                                value={selectedTripId || 'all'}
                                onChange={(e) => setSelectedTripId(e.target.value === 'all' ? null : e.target.value)}
                                className="w-full pl-11 pr-10 h-11 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 focus:ring-4 focus:ring-gray-100 focus:border-gray-900 transition-all outline-none font-medium text-gray-700 appearance-none cursor-pointer text-sm"
                            >
                                <option value="all">Filtro de Viagem...</option>
                                {tripsInView.map(trip => (
                                    <option key={trip.id} value={trip.id}>
                                        {trip.nome} — {formatPrettyDate(trip.data_ida)}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Container */}
            <div className={cn(
                "bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm w-full",
                hideHeader && "border-none shadow-none bg-transparent"
            )}>
                {loading ? (
                    <div className="p-8 space-y-8">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="space-y-4 animate-pulse">
                                <div className="h-4 bg-gray-100 rounded w-48" />
                                <div className="space-y-6">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-gray-100 rounded w-32" />
                                            <div className="h-4 bg-gray-100 rounded w-64" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : Object.keys(groupedPayments).length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center">
                                <CreditCard size={32} />
                            </div>
                            <p className="text-gray-500 font-medium">Nenhum lançamento encontrado.</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {Object.entries(groupedPayments)
                            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                            .map(([date, dayPayments]) => (
                                <div key={date} className="p-4 sm:p-8 space-y-6">
                                    <h2 className="text-lg font-black text-gray-900">{formatLongDate(date)}</h2>

                                    <div className="space-y-8">
                                        {dayPayments.map((p) => {
                                            const isPaid = p.status === 'paid' || p.status === 'Pago' || p.status === 'Realizado';

                                            return (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setSelectedPayment(p)}
                                                    className="w-full text-left flex items-start gap-4 hover:opacity-70 transition-opacity group"
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                                        isPaid ? "bg-green-50 text-green-600" :
                                                            (p.status === 'expired' ? "bg-gray-100 text-gray-400" :
                                                                (p.status === 'failed' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"))
                                                    )}>
                                                        {isPaid ? (isAdmin ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />) :
                                                            (p.status === 'failed' ? <AlertCircle size={20} /> : <Clock size={20} />)}
                                                    </div>

                                                    <div className="flex-1 min-w-0 border-b border-gray-100 pb-6 group-last:border-0 group-last:pb-0">
                                                        <div className="flex flex-row items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                <p className={cn(
                                                                    "text-[10px] sm:text-xs font-black uppercase tracking-widest",
                                                                    isPaid ? "text-green-600" :
                                                                        (p.status === 'expired' ? "text-gray-400" :
                                                                            (p.status === 'failed' ? "text-red-500" : "text-blue-500"))
                                                                )}>
                                                                    {isPaid
                                                                        ? (p.gateway_id === 'Manual' ? "Pagamento manual" : (isAdmin ? "Pix recebido" : "Pix enviado"))
                                                                        : (p.status === 'expired' ? "Pagamento expirado" :
                                                                            (p.status === 'failed' ? "Falha no pagamento" : "Pagamento pendente"))}
                                                                </p>
                                                                <h3 className="text-base font-black text-gray-900 truncate pr-2">
                                                                    {p.payer_name || (p.passageiros_ids?.length > 0
                                                                        ? (passengers.find(pass => pass.id === p.passageiros_ids[0])?.nome_completo || "Passageiro")
                                                                        : "Passageiro")}
                                                                </h3>
                                                                <p className="text-xs sm:text-sm font-bold text-gray-400 truncate opacity-80">
                                                                    {p.viagem?.nome || "Viagem Individual"}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col items-end shrink-0 pt-0.5">
                                                                <span className={cn(
                                                                    "text-base sm:text-lg font-black whitespace-nowrap",
                                                                    isPaid ? "text-green-600" : "text-gray-900"
                                                                )}>
                                                                    {p.status === 'failed' ? '-' : ''} {formatCurrency(p.valor_total)}
                                                                </span>
                                                                <ChevronRight size={18} className="text-gray-300 mt-1" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!selectedPayment}
                onClose={() => setSelectedPayment(null)}
                title="Detalhes"
                size="md"
            >
                {selectedPayment && (() => {
                    const isPaid = selectedPayment.status === 'paid' || selectedPayment.status === 'Pago' || selectedPayment.status === 'Realizado';
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Valor Total</p>
                                    <p className={cn(
                                        "text-2xl font-black",
                                        isPaid ? "text-green-600" : "text-gray-900"
                                    )}>
                                        {formatCurrency(selectedPayment.valor_total)}
                                    </p>
                                </div>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-xs font-black border",
                                    isPaid ? "bg-green-100 text-green-700 border-green-200" :
                                        (selectedPayment.status === 'expired' ? "bg-gray-100 text-gray-500 border-gray-200" :
                                            (selectedPayment.status === 'failed' ? "bg-red-100 text-red-700 border-red-200" : "bg-blue-100 text-blue-700 border-blue-200"))
                                )}>
                                    {isPaid ? 'PAGO' :
                                        (selectedPayment.status === 'expired' ? 'EXPIRADO' :
                                            (selectedPayment.status === 'failed' ? 'FALHOU' : 'PENDENTE'))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Status</h4>
                                <p className={cn(
                                    "text-base font-black uppercase tracking-widest",
                                    isPaid ? "text-green-600" :
                                        (selectedPayment.status === 'expired' ? "text-gray-400" :
                                            (selectedPayment.status === 'failed' ? "text-red-500" : "text-blue-500"))
                                )}>
                                    {isPaid
                                        ? (selectedPayment.gateway_id === 'Manual' ? "PAGAMENTO MANUAL" : (isAdmin ? "PIX RECEBIDO" : "PIX ENVIADO"))
                                        : (selectedPayment.status === 'expired' ? "PAGAMENTO EXPIRADO" :
                                            (selectedPayment.status === 'failed' ? "FALHA NO PAGAMENTO" : "PAGAMENTO PENDENTE"))}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Viagem</h4>
                                <p className="text-base font-black text-gray-900">{selectedPayment.viagem?.nome || 'Viagem não encontrada'}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-tighter mb-1">Responsável pelo Pagamento</h4>
                                <p className="text-base font-black text-gray-900">
                                    {selectedPayment.payer_name || (selectedPayment.passageiros_ids?.length > 0
                                        ? (passengers.find(pass => pass.id === selectedPayment.passageiros_ids[0])?.nome_completo || "Não identificado")
                                        : "Não identificado")}
                                </p>
                                {selectedPayment.payer_email && <p className="text-sm text-gray-500">{selectedPayment.payer_email}</p>}
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-tighter mb-1">Passageiros Incluídos</h4>
                                <div className="space-y-1 mt-1">
                                    {selectedPayment.passageiros_ids?.length > 0 ? (
                                        selectedPayment.passageiros_ids.map((id: string) => {
                                            const name = passengers.find(pass => pass.id === id)?.nome_completo;
                                            return name ? (
                                                <p key={id} className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                    {name}
                                                </p>
                                            ) : null;
                                        })
                                    ) : (
                                        <p className="text-sm font-bold text-gray-500">Nenhum passageiro listado</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Canal</h4>
                                    <p className="text-sm font-bold text-gray-900 break-all">{selectedPayment.gateway_id || 'Manual'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Data/Hora</h4>
                                    <p className="text-sm font-bold text-gray-900">
                                        {new Intl.DateTimeFormat('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }).format(new Date(selectedPayment.created_at))}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-50 pt-4">
                                <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">ID da Transação</h4>
                                <p className="text-[10px] font-mono text-gray-400 break-all">{selectedPayment.id}</p>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
};
