import React, { useState, useMemo, useEffect } from 'react';
import { Passenger, TripEnrollment, Trip } from '@/types';
import { Search, CheckCircle2, Clock, Users, Trash2, Bus, AlertCircle } from 'lucide-react';
import { IoHandRightOutline } from "react-icons/io5";
import { FaWhatsapp } from 'react-icons/fa';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBusStore } from '@/stores/useBusStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { UserRole } from '@/types';
import { ManualAttendanceModal } from './ManualAttendanceModal';

interface TripParticipantsListProps {
    trip: Trip;
    passengers: Passenger[];
    enrollments: TripEnrollment[];
    onDeleteEnrollment?: (passengerId: string, enrollmentId: string, passengerName?: string) => Promise<void> | void;
    initialStatusFilter?: 'all' | 'Pago' | 'Pendente' | 'Aprovacao';
    hideTabs?: boolean;
    hideBusFilter?: boolean;
    showApprovalTab?: boolean;
    showWaitingCount?: boolean;
    showSummaryTotals?: boolean;
}

// Map of enrollmentId → set of confirmed trechos
type AttendanceMap = Record<string, Set<string>>;

export const TripParticipantsList: React.FC<TripParticipantsListProps> = ({
    trip,
    passengers,
    enrollments,
    onDeleteEnrollment,
    initialStatusFilter = 'all',
    hideTabs = false,
    hideBusFilter = false,
    showApprovalTab = true,
    showWaitingCount = true,
    showSummaryTotals = true
}) => {
    const { user } = useAuthStore();
    const { buses } = useBusStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pago' | 'Pendente' | 'Aprovacao'>(initialStatusFilter);
    const [busFilter, setBusFilter] = useState<string | 'all'>('all');
    const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
    const [loading, setLoading] = useState(true);
    const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject' | 'review' | null;
        enrollmentId?: string;
        name?: string;
    }>({ isOpen: false, type: null });

    // Sync status filter if it changes from parent
    useEffect(() => {
        setStatusFilter(initialStatusFilter);
    }, [initialStatusFilter]);

    // Fetch all confirmed presences for this trip
    const fetchAttendances = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const { data, error } = await supabase
                .from('viagem_presencas')
                .select('enrollment_id, trecho')
                .eq('viagem_id', trip.id);

            if (error || !data) return;

            const map: AttendanceMap = {};
            data.forEach(({ enrollment_id, trecho }) => {
                if (!map[enrollment_id]) map[enrollment_id] = new Set();
                map[enrollment_id].add(trecho);
            });
            setAttendanceMap(map);
        } catch (err) {
            console.error('Error fetching attendances:', err);
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendances(true);
    }, [trip.id]);

    const hasVolta = true; // all trips have a return leg

    const getPresenceBadge = (enrollmentId: string) => {
        const trechos = attendanceMap[enrollmentId];
        if (!trechos || trechos.size === 0) return null;

        const ida   = trechos.has('ida');
        const volta = trechos.has('volta');

        if (hasVolta && ida && volta) return { label: 'Ida + Volta', color: 'bg-green-100 text-green-700 border-green-200' };
        if (ida)                      return { label: 'Ida',       color: 'bg-blue-100 text-blue-700 border-blue-200' };
        return null; // volta without ida — don't show badge
    };

    // Filter enrollments for this trip (Case-insensitive ID match)
    const tripEnrollments = useMemo(() => {
        const targetTripId = (trip.id || '').toString().trim().toLowerCase();
        return (enrollments || []).filter((e: TripEnrollment) => (e.viagem_id || '').toString().trim().toLowerCase() === targetTripId);
    }, [enrollments, trip.id]);

    // Map passengers to their enrollments for this trip
    const participants = useMemo(() => {
        return tripEnrollments.map((enroll: TripEnrollment) => {
            const passenger = passengers.find((p: Passenger) => p.id === enroll.passageiro_id);
            return {
                ...passenger,
                enrollment: enroll
            };
        }).filter((p: any) => {
            const isSystemIdentity = p.nome_completo === 'BLOQUEADO' || p.cpf_rg === 'BLOCKED';
            const isDesistente = p.enrollment?.assento === 'DESISTENTE';
            return p.id && !isSystemIdentity && !isDesistente;
        });
    }, [tripEnrollments, passengers]);

    // Unique buses present in this trip's enrollments
    const busOptions = useMemo(() => {
        const uniqueIds = Array.from(new Set(participants.map((p: any) => p.enrollment.onibus_id).filter(Boolean)));
        return uniqueIds.map((id: any) => ({
            id: String(id),
            nome: buses.find((b: any) => b.id === id)?.nome || 'Ônibus s/ nome'
        })).sort((a: any, b: any) => a.nome.localeCompare(b.nome));
    }, [participants, buses]);

    // Filter by bus (used for both the list and the bus-specific totals) (Case-insensitive)
    const busFilteredParticipants = useMemo(() => {
        if (busFilter === 'all') return participants;
        const targetBusId = (busFilter || '').toString().trim().toLowerCase();
        return participants.filter((p: any) => {
            const eBusId = (p.enrollment.onibus_id || '').toString().trim().toLowerCase();
            return eBusId === targetBusId;
        });
    }, [participants, busFilter]);

    // Final filter: search, status, and bus
    const filteredParticipants = useMemo(() => {
        return busFilteredParticipants.filter((p: any) => {
            const matchesSearch =
                p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.cpf_rg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.telefone?.toLowerCase().includes(searchTerm.toLowerCase());

            // Case-insensitive status matching (includes 'Realizado' as 'Pago')
            const pStatus = (p.enrollment.pagamento || '').toString().toLowerCase();
            const fStatus = statusFilter.toLowerCase();
            
            // Filter by approval status
            const isApproved = p.enrollment.status === 'APPROVED' || !p.enrollment.status;
            const isPendingApproval = p.enrollment.status === 'PENDING';

            if (statusFilter === 'Aprovacao') {
                return matchesSearch && isPendingApproval;
            }

            // Normal filtering for all/Pago/Pendente
            const matchesStatus = statusFilter === 'all' || 
                pStatus === fStatus ||
                (statusFilter === 'Pago' && pStatus === 'realizado');

            return matchesSearch && isApproved && matchesStatus;
        }).sort((a: any, b: any) => {
            // Sort to put PENDING at the top if viewing 'all'
            const aPending = a.enrollment.status === 'PENDING';
            const bPending = b.enrollment.status === 'PENDING';
            if (aPending && !bPending) return -1;
            if (!aPending && bPending) return 1;
            return (a.nome_completo || '').localeCompare(b.nome_completo || '')
        });
    }, [busFilteredParticipants, searchTerm, statusFilter]);

    const handleApprove = (enrollmentId: string, name: string) => {
        setActionModal({ isOpen: true, type: 'approve', enrollmentId, name });
    };

    const handleReject = (enrollmentId: string, name: string) => {
        setActionModal({ isOpen: true, type: 'reject', enrollmentId, name });
    };

    const handleReview = (enrollmentId: string, name: string) => {
        if (user?.role !== UserRole.ADMIN) return;
        setActionModal({ isOpen: true, type: 'review', enrollmentId, name });
    };

    const confirmActionDirect = async (type: 'approve' | 'reject', enrollmentId: string) => {
        setIsActionLoading(true);
        try {
            const status = type === 'approve' ? 'APPROVED' : 'REJECTED';
            const { error } = await supabase.from('viagem_passageiros').update({ status }).eq('id', enrollmentId);
            if (error) throw error;
            
            usePassengerStore.getState().fetchPassageiros(); 
            setActionModal(prev => ({ ...prev, isOpen: false }));
        } catch (e) {
            console.error(e);
        } finally {
            setIsActionLoading(false);
        }
    };

    const confirmAction = async () => {
        if (!actionModal.enrollmentId || !actionModal.type || actionModal.type === 'review') return;
        await confirmActionDirect(actionModal.type as 'approve' | 'reject', actionModal.enrollmentId);
    };


    return (
        <div className="space-y-4">
            {/* Filters - Unified Toolbar (Matched to System Standard) */}
            <div className="bg-white/50 p-2 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm">
                <div className={cn(
                    "flex flex-col gap-2",
                    (!hideBusFilter || !hideTabs) ? "md:flex-row md:items-center" : ""
                )}>
                    <div className="relative group flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nome, documento ou telefone..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 text-sm shadow-sm"
                        />
                    </div>

                    {(!hideBusFilter || !hideTabs) && (
                        <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                            {/* Bus Selector */}
                            {!hideBusFilter && busOptions.length > 0 && (
                                <div className="relative flex-1 md:flex-none min-w-[140px]">
                                    <select
                                        value={busFilter}
                                        onChange={(e: any) => setBusFilter(e.target.value)}
                                        className="w-full h-10 pl-9 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 appearance-none transition-all cursor-pointer"
                                    >
                                        <option value="all">Todos</option>
                                        {busOptions.map((bus: any) => (
                                            <option key={String(bus.id)} value={String(bus.id)}>{bus.nome}</option>
                                        ))}
                                    </select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                                        <Bus size={14} />
                                    </div>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-t-4 border-t-gray-400 border-x-4 border-x-transparent" />
                                </div>
                            )}

                            {!hideTabs && (
                                <div className="flex p-1 bg-gray-100/80 rounded-xl flex-1 md:flex-none">
                                    {[
                                    { id: 'all', label: 'Todos', icon: Users },
                                    { id: 'Pago', label: 'Pagos', icon: CheckCircle2 },
                                    { id: 'Pendente', label: 'Pendentes', icon: IoHandRightOutline },
                                    ...(trip.requires_approval && showApprovalTab ? [{ id: 'Aprovacao', label: 'Aprovação', icon: IoHandRightOutline }] : [])
                                ].map((tab: any) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setStatusFilter(tab.id as any)}
                                            className={cn(
                                                "flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200",
                                                statusFilter === tab.id
                                                    ? "bg-white text-blue-600 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                            )}
                                        >
                                            <tab.icon size={13} strokeWidth={3} />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <Spinner size="lg" />
                        <p className="mt-4 text-gray-400 font-medium text-sm">Carregando passageiros...</p>
                    </div>
                ) : filteredParticipants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <Users className="text-gray-200 mb-3" size={48} />
                        <p className="text-gray-400 font-medium">Nenhum passageiro encontrado.</p>
                    </div>
                ) : (
                    filteredParticipants.map((p: any) => {
                        const enrollment = p.enrollment;
                        const presenceBadge = getPresenceBadge(enrollment.id);
                        const isPendingApproval = enrollment.status === 'PENDING';

                        return (
                    <div key={p.enrollment.id} className="relative">
                        <Card 
                            className={cn(
                                "p-4 transition-all group",
                                presenceBadge ? "hover:border-green-200 border-green-100" : "hover:border-blue-200 shadow-sm",
                                user?.role === UserRole.ADMIN && "cursor-pointer active:scale-[0.98]"
                            )}
                            onClick={() => {
                                if (user?.role !== UserRole.ADMIN) return;
                                if (isPendingApproval) {
                                    handleReview(enrollment.id, p.nome_completo);
                                } else {
                                    setSelectedParticipant(p);
                                }
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5",
                                    isPendingApproval 
                                        ? "bg-orange-100 text-orange-600"
                                        : p.enrollment.pagamento === 'Pago'
                                            ? "bg-green-100 text-green-600"
                                            : "bg-amber-100 text-amber-600"
                                )}>
                                    {isPendingApproval ? <IoHandRightOutline className="size-5" /> : p.enrollment.pagamento === 'Pago' ? <CheckCircle2 className="size-5" /> : <Clock className="size-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-black text-gray-900 text-sm leading-tight break-words">
                                                {p.nome_completo}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                {isPendingApproval ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-orange-100 text-orange-700 uppercase">
                                                        Aguardando Aprovação
                                                    </span>
                                                ) : (
                                                    <>
                                                        {p.enrollment.assento && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-700 uppercase">
                                                                {p.enrollment.assento}
                                                            </span>
                                                        )}
                                                        {presenceBadge && (
                                                            <span className={cn(
                                                                "inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider",
                                                                presenceBadge.color
                                                            )}>
                                                                {presenceBadge.label}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                            {p.telefone && (
                                                <a
                                                    href={`https://wa.me/55${p.telefone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center w-9 h-9 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm"
                                                    title="Chamar no WhatsApp"
                                                >
                                                    <FaWhatsapp size={18} />
                                                </a>
                                            )}
                                            {onDeleteEnrollment && p.id && !isPendingApproval && (
                                                <button
                                                    onClick={() => onDeleteEnrollment && onDeleteEnrollment(p.id!, p.enrollment.id, p.nome_completo)}
                                                    className="flex items-center justify-center w-9 h-9 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm border border-red-100"
                                                    title="Remover Participante"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                    );
                })
            )}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between px-2 pt-2 text-sm">
                <p className="text-gray-500 font-medium">
                    Total: <span className="text-gray-900 font-bold">{filteredParticipants.length}</span>
                </p>
                <div className="flex gap-4">
                    {showSummaryTotals && (
                        <>
                            <span className="text-green-600 font-bold flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                {busFilteredParticipants.filter((p: any) => p.enrollment.pagamento === 'Pago').length} Pagos
                            </span>
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                {busFilteredParticipants.filter((p: any) => p.enrollment.pagamento === 'Pendente' && p.enrollment.status !== 'PENDING' && p.enrollment.status !== 'REJECTED').length} Pendentes
                            </span>
                        </>
                    )}
                    {trip.requires_approval && showWaitingCount && (
                        <span className="text-orange-600 font-bold flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            {busFilteredParticipants.filter((p: any) => p.enrollment.status === 'PENDING').length} Aguardando
                        </span>
                    )}
                </div>
            </div>

            {/* Manual Attendance Modal */}
            {selectedParticipant && (
                <ManualAttendanceModal
                    isOpen={!!selectedParticipant}
                    onClose={() => setSelectedParticipant(null)}
                    passenger={selectedParticipant}
                    enrollment={selectedParticipant.enrollment}
                    tripId={trip.id}
                    attendances={Array.from(attendanceMap[selectedParticipant.enrollment.id] || [])}
                    onUpdate={fetchAttendances}
                />
            )}

            {/* Approval/Rejection Confirmation Modal */}
            <Modal
                isOpen={actionModal.isOpen}
                onClose={() => !isActionLoading && setActionModal(prev => ({ ...prev, isOpen: false }))}
                title={
                    actionModal.type === 'review' ? "Análise de Solicitação" :
                    actionModal.type === 'approve' ? "Confirmar Aprovação" : 
                    actionModal.type === 'reject' ? "Confirmar Recusa" : ""
                }
                size="sm"
                footer={
                    actionModal.type === 'review' ? (
                        <Button
                            variant="secondary"
                            onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                            disabled={isActionLoading}
                            className="w-full"
                        >
                            Fechar
                        </Button>
                    ) : actionModal.type ? (
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => setActionModal({ isOpen: true, type: 'review', enrollmentId: actionModal.enrollmentId, name: actionModal.name })}
                                disabled={isActionLoading}
                            >
                                Voltar
                            </Button>
                            <Button
                                variant={actionModal.type === 'approve' ? "primary" : "danger"}
                                onClick={confirmAction}
                                isLoading={isActionLoading}
                            >
                                {actionModal.type === 'approve' ? "Sim, Confirmar" : "Sim, Recusar"}
                            </Button>
                        </>
                    ) : null
                }
            >
                <div className="space-y-4">
                    {!actionModal.type ? null : actionModal.type === 'review' ? (
                        <div className="flex flex-col gap-4">
                            <div className="bg-gray-50/50 rounded-2xl p-4 text-center border border-gray-100">
                                <div className="w-12 h-12 bg-blue-100/80 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                                    <Users size={24} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-0.5">{actionModal.name}</h3>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Solicitação pendente</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleApprove(actionModal.enrollmentId!, actionModal.name!)}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-green-50/50 hover:bg-green-100/80 border border-green-100 rounded-2xl transition-all group"
                                >
                                    <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <span className="font-black text-green-700 uppercase tracking-widest text-[10px]">Aprovar</span>
                                </button>

                                <button
                                    onClick={() => handleReject(actionModal.enrollmentId!, actionModal.name!)}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-red-50/50 hover:bg-red-100/80 border border-red-100 rounded-2xl transition-all group"
                                >
                                    <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                        <AlertCircle size={20} />
                                    </div>
                                    <span className="font-black text-red-700 uppercase tracking-widest text-[10px]">Recusar</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={cn(
                            "rounded-xl p-4 flex items-start gap-4",
                            actionModal.type === 'approve' ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
                        )}>
                            {actionModal.type === 'approve' ? (
                                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={24} />
                            ) : (
                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={24} />
                            )}
                            <div>
                                <h4 className={cn(
                                    "font-bold mb-1",
                                    actionModal.type === 'approve' ? "text-green-800" : "text-red-800"
                                )}>
                                    {actionModal.type === 'approve' ? "Aprovar Participação" : "Confirmação de Recusa"}
                                </h4>
                                <p className={cn(
                                    "text-sm leading-relaxed",
                                    actionModal.type === 'approve' ? "text-green-700/80" : "text-red-700/80"
                                )}>
                                    {actionModal.type === 'approve' ? (
                                        <>Tem certeza que deseja aprovar <strong>{actionModal.name}</strong> para esta viagem? Ele passará a ser listado como participante ativo e poderá selecionar assento.</>
                                    ) : (
                                        <>Tem certeza que deseja RECUSAR <strong>{actionModal.name}</strong>? Ele não ocupará vaga e será removido desta lista de espera.</>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};
