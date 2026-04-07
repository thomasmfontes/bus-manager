import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import { CreditCard, Clock, ArrowDownLeft, ArrowUpRight, ChevronRight, AlertCircle, Filter, ChevronDown, CheckCircle2, Users, ArrowRightLeft } from 'lucide-react';
import { AiOutlineUnorderedList } from 'react-icons/ai';
import { formatCurrency } from '@/utils/formatters';
import { useTripStore } from '@/stores/useTripStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types';
import { SubstitutionModal } from '@/components/viagens/SubstitutionModal';
import { Spinner } from '@/components/ui/Spinner';

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

    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
    const [substituteEnrollment, setSubstituteEnrollment] = useState<{ id: string, name: string } | null>(null);
    const [enrollmentsMap, setEnrollmentsMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchRelatedEnrollments = async () => {
            if (!selectedPayment?.viagem_id || !selectedPayment?.passageiros_ids) return;

            try {
                const { data, error } = await supabase
                    .from('viagem_passageiros')
                    .select('id, passageiro_id')
                    .eq('viagem_id', selectedPayment.viagem_id)
                    .in('passageiro_id', selectedPayment.passageiros_ids);

                if (error) throw error;

                const map: Record<string, string> = {};
                data?.forEach(e => {
                    map[e.passageiro_id] = e.id;
                });
                setEnrollmentsMap(map);
            } catch (err) {
                console.error('Error fetching enrollments for payment:', err);
            }
        };

        if (selectedPayment) {
            fetchRelatedEnrollments();
        } else {
            setEnrollmentsMap({});
        }
    }, [selectedPayment]);

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

            // If userId is provided, ensure it's a valid UUID to prevent Postgres errors
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');
            if (userId && isUUID) {
                // We show payments where:
                // 1. The user is the payer (payer_id)
                // 2. The user is one of the passengers (passageiros_ids contains userId)
                
                // Construct the OR filter for Supabase
                const orFilter = `payer_id.eq.${userId},passageiros_ids.cs.{"${userId}"}`;
                query = query.or(orFilter);
            } else if (userId && !isUUID) {
                console.warn('⚠️ Invalid UUID passed as userId to Statement:', userId);
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
        return [...trips].sort((a, b) => new Date(a.data_ida).getTime() - new Date(b.data_ida).getTime());
    }, [trips]);


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
        <div className={cn(
            "space-y-6 w-full mx-auto",
            !hideHeader && "max-w-7xl px-4 sm:px-6 lg:px-8 py-8",
            !noAnimation && "fade-in duration-500"
        )}>
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

                <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
                    <div className="flex p-1 bg-gray-100/80 rounded-xl w-full sm:w-fit">
                        {[
                            { id: 'all', label: 'Todos', icon: Users },
                            { id: 'paid', label: 'Pagos', icon: CheckCircle2 },
                            { id: 'pending', label: 'Pendentes', icon: Clock },
                            { id: 'failed_expired', label: 'Expirados', icon: AlertCircle }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterStatus(tab.id)}
                                className={cn(
                                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                                    filterStatus === tab.id
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <tab.icon size={16} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Integrated Trip Selector */}
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
                </div>
            </div>

            {/* Main Content Container */}
            <div className={cn(
                "bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm w-full",
                hideHeader && "border-none shadow-none bg-transparent"
            )}>
                {loading ? (
                    <div className="py-12"><Spinner size="lg" text="Carregando extrato..." /></div>
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
                                                <div key={id} className="flex items-center justify-between group/pax py-1">
                                                    <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                        {name}
                                                    </div>
                                                    {enrollmentsMap[id] && isPaid && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSubstituteEnrollment({ id: enrollmentsMap[id], name });
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm"
                                                            title="Transferir vaga para outra pessoa"
                                                        >
                                                            <ArrowRightLeft size={12} />
                                                            <span className="hidden sm:inline">Transferir</span>
                                                        </button>
                                                    )}
                                                </div>
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

                            <div className="border-t border-gray-50 pt-4">
                                <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">ID da Transação</h4>
                                <p className="text-[10px] font-mono text-gray-400 break-all">{selectedPayment.id}</p>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {substituteEnrollment && (
                <SubstitutionModal
                    isOpen={!!substituteEnrollment}
                    onClose={() => setSubstituteEnrollment(null)}
                    enrollmentId={substituteEnrollment.id}
                    tripId={selectedPayment.viagem_id}
                    passengerName={substituteEnrollment.name}
                    onSuccess={() => {
                        fetchPayments();
                        fetchPassageiros();
                        setSelectedPayment(null);
                    }}
                />
            )}
        </div>
    );
};
