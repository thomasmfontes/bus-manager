import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { Trip, Passenger, TripEnrollment } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatPrettyDate } from '@/utils/formatters';
import {
    MapPin,
    Calendar,
    Clock,
    Users,
    Bus,
    CreditCard,
    ChevronRight,
    CheckCircle2,
    Compass,
    AlertCircle,
    Ticket,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import seatIcon from '@/assets/seat-custom.png';
import { QRTicketModal } from '@/components/passengers/QRTicketModal';

export const MyItineraries: React.FC = () => {
    const { user } = useAuthStore();
    const { trips, fetchViagens } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { fetchPassageiros } = usePassengerStore();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [userEnrollments, setUserEnrollments] = useState<TripEnrollment[]>([]);
    const [dependents, setDependents] = useState<Record<string, { passenger: Passenger; enrollment: TripEnrollment }[]>>({});
    const [qrModal, setQrModal] = useState<{ trip: Trip; enrollment: TripEnrollment; passengerName?: string } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                // Ensure base data is loaded
                await Promise.all([
                    fetchViagens(),
                    fetchOnibus(),
                    fetchPassageiros()
                ]);

                // 1. Fetch all enrollments related to the user (as passenger OR payer)
                const { data: enrolls, error: enrollError } = await supabase
                    .from('viagem_passageiros')
                    .select('*')
                    .or(`passageiro_id.eq.${user.id},pago_por.eq.${user.id}`)
                    .order('created_at', { ascending: false });

                if (enrollError) throw enrollError;

                setUserEnrollments(enrolls || []);

                // 2. Fetch dependents info
                const payerEnrollments = (enrolls || []).filter(e => e.pago_por === user.id && e.passageiro_id !== user.id);
                if (payerEnrollments.length > 0) {
                    const depIds = Array.from(new Set(payerEnrollments.map(e => e.passageiro_id)));
                    const { data: depData, error: depError } = await supabase
                        .from('passageiros')
                        .select('*')
                        .in('id', depIds);

                    if (depError) throw depError;

                    // Group dependents by trip
                    const groupedDeps: Record<string, { passenger: Passenger; enrollment: TripEnrollment }[]> = {};
                    payerEnrollments.forEach(e => {
                        const passenger = depData?.find(p => p.id === e.passageiro_id);
                        if (passenger) {
                            if (!groupedDeps[e.viagem_id]) groupedDeps[e.viagem_id] = [];
                            groupedDeps[e.viagem_id].push({ passenger, enrollment: e });
                        }
                    });
                    setDependents(groupedDeps);
                }

            } catch (err) {
                console.error('Error loading my itineraries:', err);
                showToast('Erro ao carregar seus roteiros', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user?.id]);

    // Group enrollments by trip to show one card per trip
    const tripsWithStatus = useMemo(() => {
        const tripMap = new Map<string, {
            trip: Trip;
            myEnrollment?: TripEnrollment;
            dependents: { passenger: Passenger; enrollment: TripEnrollment }[];
            status: string;
        }>();

        userEnrollments.forEach(e => {
            const trip = trips.find(t => t.id === e.viagem_id);
            if (!trip) return;

            if (!tripMap.has(trip.id)) {
                tripMap.set(trip.id, {
                    trip,
                    dependents: dependents[trip.id] || [],
                    status: 'Pendente' // Default
                });
            }

            const data = tripMap.get(trip.id)!;
            if (e.passageiro_id === user?.id) {
                data.myEnrollment = e;
            }

            // Set status based on any enrollment related to this trip (prefer user's own if exists)
            if (e.passageiro_id === user?.id || !data.status || data.status === 'Pendente') {
                if (e.status === 'PENDING') {
                    data.status = 'Aguardando Aprovação';
                } else if (e.status === 'REJECTED') {
                    data.status = 'Recusado';
                } else {
                    data.status = e.pagamento || 'Pendente';
                }
            }
        });

        // Convert to array and sort by date
        return Array.from(tripMap.values()).sort((a, b) =>
            new Date(a.trip.data_ida).getTime() - new Date(b.trip.data_ida).getTime()
        );
    }, [userEnrollments, trips, dependents, user?.id]);

    const getBusName = (busId?: string) => {
        if (!busId) return 'Não definido';
        return buses.find(b => b.id === busId)?.nome || 'Não encontrado';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Spinner size="xl" text="Buscando seus roteiros..." />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in duration-500">
            {/* Header section */}
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Compass className="text-white" size={20} />
                    </div>
                    Passagens
                </h1>
                <p className="text-gray-500 text-sm ml-[52px] font-medium">Acompanhe suas viagens e detalhes de reserva.</p>
            </div>

            {tripsWithStatus.length === 0 ? (
                <Card className="p-12 text-center bg-white/50 border-gray-100 backdrop-blur-sm">
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-gray-50/50">
                            <MapPin size={32} className="text-gray-300" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">Nenhum roteiro encontrado</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">Você ainda não demonstrou interesse ou confirmou participação em nenhuma viagem.</p>
                        </div>
                        <Button
                            onClick={() => navigate('/viagens')}
                            className="w-full sm:w-auto px-8 rounded-xl shadow-lg shadow-blue-500/20"
                        >
                            Explorar Viagens
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {tripsWithStatus.map(({ trip, myEnrollment, dependents: tripDeps, status }) => {
                        const isWithdrawn = myEnrollment?.assento === 'DESISTENTE';
                        const isPaid = ['Pago', 'Realizado'].includes(status) && !isWithdrawn;
                        const isPending = status === 'Pendente' && !isWithdrawn;

                        const hasActivePending = userEnrollments.some(e =>
                            e.viagem_id === trip.id &&
                            e.pagamento === 'Pendente' &&
                            e.assento !== 'DESISTENTE' &&
                            e.status === 'APPROVED'
                        );

                        // If there's at least one active passenger pending payment, show the "Pagar" button.
                        // Otherwise, show the "Mapa" button.
                        const showPay = hasActivePending;

                        const tripDate = new Date(trip.data_ida);
                        const isPast = new Date(tripDate.getTime() + 24 * 60 * 60 * 1000) < new Date();

                        return (
                            <Card
                                key={trip.id}
                                className={cn(
                                    "bg-white border-gray-100 transition-all duration-500 overflow-hidden flex flex-col",
                                    !isPast && "group hover:shadow-2xl hover:shadow-blue-500/10",
                                    isPast && "opacity-60 grayscale-[0.4] cursor-not-allowed select-none pointer-events-none"
                                )}
                            >
                                {/* Card Header with Status Badge */}
                                <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <h3 className="text-base font-black text-gray-900 leading-tight truncate group-hover:text-blue-600 transition-colors">
                                            {trip.nome}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-gray-400 font-bold min-w-0">
                                            <MapPin size={11} className="shrink-0" />
                                            <span className="text-[10px] uppercase tracking-widest truncate">{trip.destino}</span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm whitespace-nowrap",
                                        isWithdrawn ? "bg-gray-100 text-gray-500 border border-gray-200" :
                                            isPaid ? "bg-green-50 text-green-600 border border-green-100" :
                                                status === 'Aguardando Aprovação' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                                    status === 'Recusado' ? "bg-red-50 text-red-600 border border-red-100" :
                                                isPending ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                    "bg-gray-50 text-gray-500 border border-gray-100"
                                    )}>
                                        {isWithdrawn || status === 'Recusado' ? <AlertCircle size={12} /> : isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {isWithdrawn ? "Desistente" : status}
                                    </div>
                                </div>

                                {/* Main Info Grid */}
                                <div className="p-6 grid grid-cols-2 gap-4 bg-gray-50/30">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Data e Hora</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar size={14} className="text-blue-500" />
                                            <p className="text-xs font-bold text-gray-700">{formatPrettyDate(trip.data_ida)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-blue-500" />
                                            <p className="text-xs font-bold text-gray-700">{new Date(trip.data_ida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    {myEnrollment ? (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Meu Assento</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Bus size={14} className="text-purple-500" />
                                                <p className="text-xs font-bold text-gray-700 truncate">{getBusName(myEnrollment.onibus_id)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={seatIcon}
                                                    alt="Seat"
                                                    className="w-3.5 h-3.5 object-contain"
                                                    style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(94%) saturate(3621%) hue-rotate(253deg) brightness(96%) contrast(101%)' }}
                                                />
                                                <p className="text-xs font-bold text-gray-700">Assento: {myEnrollment?.assento || 'N/A'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 flex flex-col justify-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <Users size={16} />
                                                </div>
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter leading-none">Responsável<br />Financeiro</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Dependents / Paid For Section */}
                                {
                                    tripDeps.length > 0 && (
                                        <div className="px-6 py-4 border-t border-gray-50">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Users size={14} className="text-indigo-500" />
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Passageiros Pagos</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {tripDeps.map(({ passenger, enrollment }) => {
                                                    const depWithdrawn = enrollment.assento === 'DESISTENTE';
                                                    const canViewTicket = !depWithdrawn && isPaid;

                                                    return (
                                                        <button 
                                                            key={passenger.id} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (canViewTicket && !isPast) setQrModal({ trip, enrollment, passengerName: passenger.nome_completo });
                                                            }}
                                                            disabled={!canViewTicket || isPast}
                                                            className={cn(
                                                                "px-3 py-1.5 border rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-all outline-none",
                                                                (depWithdrawn || isPast) ? "bg-white border-gray-100 text-gray-400 opacity-70 cursor-not-allowed" :
                                                                canViewTicket ? "bg-white border-indigo-100 text-indigo-700 hover:bg-indigo-50 hover:shadow-md active:scale-95 cursor-pointer" :
                                                                "bg-white border-gray-100 text-gray-700 cursor-default"
                                                            )}
                                                            title={canViewTicket && !isPast ? "Passagem" : ""}
                                                        >
                                                            {canViewTicket ? (
                                                                <Ticket size={12} className="text-indigo-500 shrink-0" />
                                                            ) : (
                                                                <div className={cn(
                                                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                                                    depWithdrawn ? "bg-gray-300" : "bg-indigo-500"
                                                                )} />
                                                            )}
                                                            <span className={depWithdrawn ? "line-through" : ""}>
                                                                {passenger.nome_completo.split(' ')[0]}
                                                            </span>
                                                            {depWithdrawn && <span className="text-[10px] font-normal">(Desistente)</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )
                                }

                                {/* Bottom Action Section */}
                                <div className="mt-auto px-6 py-4 flex flex-col gap-3 border-t border-gray-50">
                                    {/* Price row */}
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">Valor Total Pago</p>
                                            <p className="text-xl font-black text-gray-900">
                                                {formatCurrency(trip.preco * (tripDeps.length + (myEnrollment ? 1 : 0)))}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Button row */}
                                    {status !== 'Aguardando Aprovação' && status !== 'Recusado' && (
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            {/* QR Ticket button — only for own enrollment, not withdrawn, and MUST BE PAID */}
                                            {myEnrollment && !isWithdrawn && isPaid && (
                                                <Button
                                                    variant="secondary"
                                                    disabled={isPast}
                                                    onClick={() => setQrModal({ 
                                                        trip, 
                                                        enrollment: myEnrollment, 
                                                        passengerName: user?.full_name || '' 
                                                    })}
                                                    className={cn(
                                                        "w-full sm:flex-1 h-11 rounded-xl text-sm font-bold transition-all",
                                                        !isPast && "hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100",
                                                        isPast && "bg-gray-50 border-gray-100 text-gray-400"
                                                    )}
                                                >
                                                    <Ticket size={16} className="mr-2 shrink-0" />
                                                    Passagem
                                                </Button>
                                            )}

                                            {!showPay ? (
                                                <Button
                                                    variant="secondary"
                                                    disabled={isPast}
                                                    onClick={() => navigate(`/viagens/${trip.id}`)}
                                                    className={cn(
                                                        "w-full sm:flex-1 h-11 rounded-xl text-sm font-bold transition-all",
                                                        !isPast && "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100",
                                                        isPast && "bg-gray-50 border-gray-100 text-gray-400"
                                                    )}
                                                >
                                                    Ver Mapa
                                                    <ChevronRight size={16} className="ml-1.5 shrink-0" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="primary"
                                                    disabled={isPast}
                                                    onClick={() => {
                                                    const pendingPids = userEnrollments
                                                            .filter(e =>
                                                                e.viagem_id === trip.id &&
                                                                e.pagamento === 'Pendente' &&
                                                                e.assento !== 'DESISTENTE' &&
                                                                e.status === 'APPROVED'
                                                            )
                                                            .map(e => e.passageiro_id)
                                                            .join(',');
                                                        navigate(`/pagamento?v=${trip.id}&pids=${pendingPids}`);
                                                    }}
                                                    className={cn(
                                                        "w-full sm:flex-1 h-11 rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 border-none transition-all",
                                                        !isPast && "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                                                        isPast && "bg-gray-200 text-gray-500 shadow-none"
                                                    )}
                                                >
                                                    <CreditCard size={16} className="mr-2 shrink-0" />
                                                    Pagar
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )
            }

            {/* QR Ticket Modal */}
            {qrModal && (
                <QRTicketModal
                    isOpen={true}
                    onClose={() => setQrModal(null)}
                    trip={qrModal.trip}
                    enrollment={qrModal.enrollment}
                    passengerName={qrModal.passengerName}
                />
            )}
        </div>
    );
};
