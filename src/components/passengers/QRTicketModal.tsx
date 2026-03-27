import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import { Trip, TripEnrollment, AttendanceRecord } from '@/types';
import { useBusStore } from '@/stores/useBusStore';
import {
    X,
    MapPin,
    Calendar,
    Bus,
    CheckCircle2,
    Clock,
    ArrowRight,
    ArrowLeft,
    Ticket,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrettyDate } from '@/utils/formatters';
import seatIcon from '@/assets/seat-custom.png';
import { Spinner } from '@/components/ui/Spinner';

interface QRTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: Trip;
    enrollment: TripEnrollment;
}

export const QRTicketModal: React.FC<QRTicketModalProps> = ({
    isOpen,
    onClose,
    trip,
    enrollment,
}) => {
    const { buses } = useBusStore();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const busName = buses.find(b => b.id === enrollment.onibus_id)?.nome;

    useEffect(() => {
        if (!isOpen || !enrollment.id) return;

        const fetchAttendance = async () => {
            setLoadingAttendance(true);
            try {
                const { data, error } = await supabase
                    .from('viagem_presencas')
                    .select('*')
                    .eq('enrollment_id', enrollment.id);

                if (!error && data) setAttendance(data);
            } catch (e) {
                console.error('Error fetching attendance:', e);
            } finally {
                setLoadingAttendance(false);
            }
        };

        fetchAttendance();
    }, [isOpen, enrollment.id]);

    if (!isOpen && !isClosing) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    };

    // Single QR payload — just the enrollment ID
    const qrPayload = enrollment.id;

    const isConfirmed = (trecho: 'ida' | 'volta') =>
        attendance.some(a => a.trecho === trecho);

    const confirmedAt = (trecho: 'ida' | 'volta') => {
        const rec = attendance.find(a => a.trecho === trecho);
        if (!rec) return null;
        return new Date(rec.confirmado_em).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        });
    };

    const idaConfirmed   = isConfirmed('ida');
    const voltaConfirmed = isConfirmed('volta');
    const allConfirmed   = idaConfirmed && voltaConfirmed;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={handleClose}
        >
            {/* Backdrop */}
            <div className={cn(
                'fixed inset-0 bg-black/60 backdrop-blur-sm',
                isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'
            )} />

            <div
                className={cn(
                    'relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden',
                    'sm:animate-in',
                    isClosing ? 'sheet-slide-down sm:fade-out' : 'sheet-slide-up sm:animate-scale-in'
                )}
                onClick={e => e.stopPropagation()}
            >
                {/* Header strip */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 pt-6 pb-8 text-white relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex items-center gap-2 mb-3">
                        <Ticket size={18} className="opacity-80" />
                        <span className="text-xs font-black uppercase tracking-widest opacity-80">Passagem Digital</span>
                    </div>

                    <h2 className="text-xl font-black leading-tight">{trip.nome}</h2>

                    <div className="flex items-center gap-2 mt-1 opacity-80">
                        <MapPin size={12} />
                        <span className="text-xs font-bold">{trip.destino}</span>
                    </div>

                    {/* Perforated edge */}
                    <div className="absolute -bottom-3 left-0 right-0 flex">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="flex-1 h-6 bg-white rounded-full mx-0.5" />
                        ))}
                    </div>
                </div>

                <div className="px-6 pt-6 pb-4">
                    {/* Seat / bus / date info */}
                    <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
                        {enrollment.assento && (
                            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assento</p>
                                <div className="flex items-center gap-1.5">
                                    <img
                                        src={seatIcon}
                                        alt="Seat"
                                        className="w-3.5 h-3.5"
                                        style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(94%) saturate(3621%) hue-rotate(253deg) brightness(96%) contrast(101%)' }}
                                    />
                                    <span className="font-black text-gray-800">{enrollment.assento}</span>
                                </div>
                            </div>
                        )}
                        {busName && (
                            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ônibus</p>
                                <div className="flex items-center gap-1.5">
                                    <Bus size={13} className="text-blue-500" />
                                    <span className="font-black text-gray-800 truncate">{busName}</span>
                                </div>
                            </div>
                        )}
                        {trip.data_ida && (
                            <div className="bg-gray-50 rounded-xl p-3 space-y-1 col-span-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                    <Calendar size={10} />
                                    Data de Partida
                                </p>
                                <p className="font-black text-gray-800">
                                    {formatPrettyDate(trip.data_ida)}{' '}
                                    <span className="text-blue-500">
                                        {new Date(trip.data_ida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* QR Code area */}
                    <div className="flex flex-col items-center gap-3">
                        {loadingAttendance ? (
                            <div className="w-full flex items-center justify-center" style={{ minHeight: '206px' }}>
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <div className="p-3 bg-white rounded-2xl shadow-lg border border-gray-100 animate-scale-in">
                                <QRCodeSVG
                                    value={qrPayload}
                                    size={180}
                                    level="M"
                                    includeMargin={false}
                                    bgColor="#ffffff"
                                    fgColor="#1e1b4b"
                                />
                            </div>
                        )}

                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                            Apresente na porta do ônibus
                        </p>

                        {/* Attendance status — always visible after load */}
                        {!loadingAttendance && (idaConfirmed || voltaConfirmed) && (
                            <div className="w-full flex flex-col gap-1.5 mt-1">
                                {idaConfirmed && (
                                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                                        <ArrowRight size={12} className="text-green-600 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-green-700 uppercase tracking-wider">Ida confirmada</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold shrink-0">
                                            <Clock size={9} />
                                            {confirmedAt('ida')}
                                        </div>
                                        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                                    </div>
                                )}
                                {voltaConfirmed && (
                                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                                        <ArrowLeft size={12} className="text-green-600 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-green-700 uppercase tracking-wider">Volta confirmada</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold shrink-0">
                                            <Clock size={9} />
                                            {confirmedAt('volta')}
                                        </div>
                                        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                                    </div>
                                )}
                                {allConfirmed && (
                                    <p className="text-[10px] text-center text-green-600 font-black uppercase tracking-widest mt-0.5">
                                        ✓ Todos os trechos confirmados
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
