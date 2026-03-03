import React, { useState, useMemo } from 'react';
import { Passenger, TripEnrollment, Trip } from '@/types';
import { Search, CheckCircle2, Clock, User, Users, Trash2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

interface TripParticipantsListProps {
    trip: Trip;
    passengers: Passenger[];
    enrollments: TripEnrollment[];
    onDeleteEnrollment?: (passengerId: string, enrollmentId: string) => Promise<void>;
}

export const TripParticipantsList: React.FC<TripParticipantsListProps> = ({
    trip,
    passengers,
    enrollments,
    onDeleteEnrollment
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pago' | 'Pendente'>('all');

    // Filter enrollments for this trip
    const tripEnrollments = useMemo(() => {
        return enrollments.filter(e => e.viagem_id === trip.id);
    }, [enrollments, trip.id]);

    // Map passengers to their enrollments for this trip
    const participants = useMemo(() => {
        return tripEnrollments.map(enroll => {
            const passenger = passengers.find(p => p.id === enroll.passageiro_id);
            return {
                ...passenger,
                enrollment: enroll
            };
        }).filter(p => {
            const isSystemIdentity = p.nome_completo === 'BLOQUEADO' || p.cpf_rg === 'BLOCKED';
            const isDesistente = p.enrollment?.assento === 'DESISTENTE';
            return p.id && !isSystemIdentity && !isDesistente;
        });
    }, [tripEnrollments, passengers]);

    // Filter by search and status
    const filteredParticipants = useMemo(() => {
        return participants.filter(p => {
            const matchesSearch =
                p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.cpf_rg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.telefone?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || p.enrollment.pagamento === statusFilter;

            return matchesSearch && matchesStatus;
        }).sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || ''));
    }, [participants, searchTerm, statusFilter]);


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

                    <div className="flex p-1 bg-gray-100/80 rounded-xl w-full md:w-fit">
                        {[
                            { id: 'all', label: 'Todos', icon: Users },
                            { id: 'Pago', label: 'Pagos', icon: CheckCircle2 },
                            { id: 'Pendente', label: 'Pendentes', icon: Clock }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id as any)}
                                className={cn(
                                    "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                                    statusFilter === tab.id
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <tab.icon size={16} />
                                <span className="hidden md:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-3">
                {filteredParticipants.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <User className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-gray-500">Nenhum participante encontrado.</p>
                    </div>
                ) : (
                    filteredParticipants.map((p) => (
                        <Card key={p.enrollment.id} className="p-4 hover:border-blue-200 transition-all group">
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
                                        {p.enrollment.assento && (
                                            <div className="mt-1">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-700 uppercase">
                                                    {p.enrollment.assento}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
                                                if (window.confirm(`Tem certeza que deseja remover ${p.nome_completo} desta viagem?`)) {
                                                    onDeleteEnrollment(p.id!, p.enrollment.id);
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
                    ))
                )}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between px-2 pt-2 text-sm">
                <p className="text-gray-500 font-medium">
                    Total: <span className="text-gray-900 font-bold">{filteredParticipants.length}</span> passageiro(s)
                </p>
                <div className="flex gap-4">
                    <span className="text-green-600 font-bold flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        {participants.filter(p => p.enrollment.pagamento === 'Pago').length} Pagos
                    </span>
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        {participants.filter(p => p.enrollment.pagamento === 'Pendente').length} Pendentes
                    </span>
                </div>
            </div>
        </div>
    );
};
