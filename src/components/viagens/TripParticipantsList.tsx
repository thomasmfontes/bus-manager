import React, { useState, useMemo, useEffect } from 'react';
import { Passenger, TripEnrollment, Trip } from '@/types';
import { Search, CheckCircle2, Clock, User, Users, Trash2, Bus } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBusStore } from '@/stores/useBusStore';
import { UserRole } from '@/types';
import { ManualAttendanceModal } from './ManualAttendanceModal';

interface TripParticipantsListProps {
    trip: Trip;
    passengers: Passenger[];
    enrollments: TripEnrollment[];
    onDeleteEnrollment?: (passengerId: string, enrollmentId: string, passengerName?: string) => Promise<void> | void;
}

// Map of enrollmentId → set of confirmed trechos
type AttendanceMap = Record<string, Set<string>>;

export const TripParticipantsList: React.FC<TripParticipantsListProps> = ({
    trip,
    passengers,
    enrollments,
    onDeleteEnrollment
}) => {
    const { user } = useAuthStore();
    const { buses } = useBusStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pago' | 'Pendente'>('all');
    const [busFilter, setBusFilter] = useState<string | 'all'>('all');
    const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
    const [loading, setLoading] = useState(true);
    const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);

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
        return enrollments.filter(e => (e.viagem_id || '').toString().trim().toLowerCase() === targetTripId);
    }, [enrollments, trip.id]);

    // Map passengers to their enrollments for this trip
    const participants = useMemo(() => {
        return tripEnrollments.map(enroll => {
            const passenger = passengers.find(p => p.id === enroll.passageiro_id);
            return {
                ...passenger,
                id: passenger?.id || enroll.passageiro_id, // Ensure we have a valid ID for filtering
                enrollment: enroll
            };
        }).filter(p => {
            const isSystemIdentity = p.nome_completo === 'BLOQUEADO' || p.cpf_rg === 'BLOCKED';
            const isDesistente = p.enrollment?.assento === 'DESISTENTE';
            return p.id && !isSystemIdentity && !isDesistente;
        });
    }, [tripEnrollments, passengers]);

    // Unique buses present in this trip's enrollments
    const busOptions = useMemo(() => {
        const uniqueIds = Array.from(new Set(participants.map(p => p.enrollment.onibus_id).filter(Boolean)));
        return uniqueIds.map(id => ({
            id,
            nome: buses.find(b => b.id === id)?.nome || 'Ônibus s/ nome'
        })).sort((a, b) => a.nome.localeCompare(b.nome));
    }, [participants, buses]);

    // Filter by bus (used for both the list and the bus-specific totals) (Case-insensitive)
    const busFilteredParticipants = useMemo(() => {
        if (busFilter === 'all') return participants;
        const targetBusId = (busFilter || '').toString().trim().toLowerCase();
        return participants.filter(p => {
            const eBusId = (p.enrollment.onibus_id || '').toString().trim().toLowerCase();
            return eBusId === targetBusId;
        });
    }, [participants, busFilter]);

    // Final filter: search, status, and bus
    const filteredParticipants = useMemo(() => {
        return busFilteredParticipants.filter(p => {
            const matchesSearch =
                p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.cpf_rg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.telefone?.toLowerCase().includes(searchTerm.toLowerCase());

            // Case-insensitive status matching (includes 'Realizado' as 'Pago')
            const pStatus = (p.enrollment.pagamento || '').toString().toLowerCase();
            const fStatus = statusFilter.toLowerCase();
            
            const matchesStatus = statusFilter === 'all' || 
                pStatus === fStatus ||
                (statusFilter === 'Pago' && pStatus === 'realizado');

            return matchesSearch && matchesStatus;
        }).sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || ''));
    }, [busFilteredParticipants, searchTerm, statusFilter]);


    return (
        <div className="space-y-4">
            {/* Filters - Unified Toolbar (Matched to System Standard) */}
            <div className="flex flex-col gap-4 bg-white/50 p-2 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <div className="relative group flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nome, documento ou telefone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 text-sm"
                        />
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                        {/* Bus Selector */}
                        {busOptions.length > 0 && (
                            <div className="relative flex-1 md:flex-none min-w-[140px]">
                                <select
                                    value={busFilter}
                                    onChange={(e) => setBusFilter(e.target.value)}
                                    className="w-full h-10 pl-9 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 appearance-none transition-all cursor-pointer"
                                >
                                    <option value="all">Todos</option>
                                    {busOptions.map(bus => (
                                        <option key={bus.id} value={bus.id}>{bus.nome}</option>
                                    ))}
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                                    <Bus size={14} />
                                </div>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-t-4 border-t-gray-400 border-x-4 border-x-transparent" />
                            </div>
                        )}

                        <div className="flex p-1 bg-gray-100/80 rounded-xl flex-1 md:flex-none">
                            {[
                                { id: 'all', label: 'Todos', icon: Users },
                                { id: 'Pago', label: 'Pagos', icon: CheckCircle2 },
                                { id: 'Pendente', label: 'Pendentes', icon: Clock }
                            ].map((tab) => (
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
                                    <tab.icon size={13} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
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
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <User className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-gray-500">Nenhum participante encontrado.</p>
                    </div>
                ) : (
                    filteredParticipants.map((p) => {
                        const presenceBadge = getPresenceBadge(p.enrollment.id);

                        return (
                            <div key={p.enrollment.id} className="relative">
                                <Card className={cn(
                                    "p-4 transition-all group",
                                    presenceBadge ? "hover:border-green-200 border-green-100" : "hover:border-blue-200",
                                    user?.role === UserRole.ADMIN && "cursor-pointer active:scale-[0.99]"
                                )}
                                onClick={() => {
                                    if (user?.role === UserRole.ADMIN) {
                                        setSelectedParticipant(p);
                                    }
                                }}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={cn(
                                            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                            p.enrollment.pagamento === 'Pago'
                                                ? "bg-green-100 text-green-600"
                                                : "bg-amber-100 text-amber-600"
                                        )}>
                                            {p.enrollment.pagamento === 'Pago' ? <CheckCircle2 className="size-5 sm:size-6" /> : <Clock className="size-5 sm:size-6" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-black text-gray-900 text-sm sm:text-base leading-tight break-words">
                                                {p.nome_completo}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
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
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 sm:gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                        {p.telefone && (
                                            <a
                                                href={`https://wa.me/55${p.telefone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm"
                                                title="Chamar no WhatsApp"
                                            >
                                                <FaWhatsapp size={20} className="sm:size-6" />
                                            </a>
                                        )}

                                        {onDeleteEnrollment && p.id && (
                                            <button
                                                onClick={() => {
                                                    if (onDeleteEnrollment) {
                                                        onDeleteEnrollment(p.id!, p.enrollment.id, p.nome_completo);
                                                    }
                                                }}
                                                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm border border-red-100"
                                                title="Remover Participante"
                                            >
                                                <Trash2 size={20} className="sm:size-5" />
                                            </button>
                                        )}
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
                    <span className="text-green-600 font-bold flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        {busFilteredParticipants.filter(p => p.enrollment.pagamento === 'Pago').length} Pagos
                    </span>
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        {busFilteredParticipants.filter(p => p.enrollment.pagamento === 'Pendente').length} Pendentes
                    </span>
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
        </div>
    );
};
