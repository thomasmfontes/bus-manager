import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import { CreditCard, Clock, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { useTripStore } from '@/stores/useTripStore';
import { usePassengerStore } from '@/stores/usePassengerStore';

export const PaymentList = () => {
    const { showToast } = useToast();
    const { trips, fetchViagens } = useTripStore();
    const { passengers, fetchPassageiros } = usePassengerStore();
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
    }, [filterStatus]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            console.log('📡 Fetching payments with status:', filterStatus);

            let query = supabase
                .from('pagamentos')
                .select('*')
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Error fetching payments:', error);
                throw error;
            }

            console.log('✅ Payments received:', data?.length || 0);

            // Manual Join in Memory (Safer than relationship guessing)
            const combinedData = (data || []).map(p => ({
                ...p,
                viagem: trips.find(t => t.id === p.viagem_id)
            }));

            setPayments(combinedData);
        } catch (err: any) {
            console.error('🚨 Error fetching payments:', err);
            showToast('Erro ao carregar pagamentos', 'error');
        } finally {
            setLoading(false);
        }
    };


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
        <div className="space-y-6 w-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg shadow-gray-900/20">
                        <CreditCard className="text-white" size={20} />
                    </div>
                    Extrato
                </h1>
                <p className="text-gray-500 text-sm ml-[52px]">Acompanhamento detalhado de entradas e saídas.</p>
            </div>

            {/* Filters Container */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 p-2 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="paid">Pagos</option>
                        <option value="pending">Pendentes</option>
                        <option value="failed">Falhas</option>
                    </select>
                    <Button variant="secondary" onClick={fetchPayments} size="sm">
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm w-full">
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
                                                        isPaid ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
                                                    )}>
                                                        {isPaid ? <ArrowDownLeft size={20} /> : <Clock size={20} />}
                                                    </div>

                                                    <div className="flex-1 min-w-0 border-b border-gray-100 pb-6 group-last:border-0 group-last:pb-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="space-y-1">
                                                                <p className="text-sm text-gray-500 font-medium">
                                                                    {!isPaid ? "Pagamento pendente" : (p.gateway_id === 'Manual' ? "Pagamento manual" : "Pix recebido")}
                                                                </p>
                                                                <h3 className="text-base font-black text-gray-900 truncate">
                                                                    {p.payer_name || (p.passageiros_ids?.length > 0
                                                                        ? (passengers.find(pass => pass.id === p.passageiros_ids[0])?.nome_completo || "Passageiro")
                                                                        : "Passageiro")}
                                                                </h3>
                                                                <p className="text-sm font-bold text-gray-400">
                                                                    {p.viagem?.nome || "Viagem Individual"}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className={cn(
                                                                    "text-lg font-black",
                                                                    isPaid ? "text-green-600" : "text-gray-900"
                                                                )}>
                                                                    {p.status === 'failed' ? '-' : ''} {formatCurrency(p.valor_total)}
                                                                </span>
                                                                <ChevronRight size={18} className="text-gray-300" />
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
                title="Detalhes do Lançamento"
                size="md"
            >
                {selectedPayment && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Valor Total</p>
                                <p className={cn(
                                    "text-2xl font-black",
                                    (selectedPayment.status === 'paid' || selectedPayment.status === 'Pago' || selectedPayment.status === 'Realizado') ? "text-green-600" : "text-gray-900"
                                )}>
                                    {formatCurrency(selectedPayment.valor_total)}
                                </p>
                            </div>
                            <div className={cn(
                                "px-3 py-1 rounded-full text-xs font-black border",
                                (selectedPayment.status === 'paid' || selectedPayment.status === 'Pago' || selectedPayment.status === 'Realizado') ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"
                            )}>
                                {selectedPayment.status === 'paid' || selectedPayment.status === 'Pago' || selectedPayment.status === 'Realizado' ? 'PAGO' : 'PENDENTE'}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-tighter mb-1">Viagem</h4>
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

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-tighter mb-1">Canal</h4>
                                    <p className="text-sm font-bold text-gray-900">{selectedPayment.gateway_id || 'Manual'}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-tighter mb-1">Data/Hora</h4>
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

                    </div>
                )}
            </Modal>
        </div >
    );
};
