import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { Passenger, TripEnrollment } from '@/types';
import { X, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/useAuthStore';

interface ManualAttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    passenger: Passenger;
    enrollment: TripEnrollment;
    tripId: string;
    attendances: string[]; // ['ida', 'volta']
    onUpdate: () => Promise<void>;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
    isOpen,
    onClose,
    passenger,
    enrollment,
    tripId,
    attendances,
    onUpdate
}) => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState<string | null>(null);
    const [localAttendances, setLocalAttendances] = useState<string[]>(attendances);
    const [isClosing, setIsClosing] = useState(false);

    // Sync local state when prop changes (e.g. from parent re-fetch)
    useEffect(() => {
        setLocalAttendances(attendances);
    }, [attendances]);

    const toggleAttendance = async (trecho: 'ida' | 'volta') => {
        const isPresent = localAttendances.includes(trecho);
        setLoading(trecho);

        // Optimistic update
        const nextAttendances = isPresent 
            ? localAttendances.filter(a => a !== trecho)
            : [...localAttendances, trecho];
        
        setLocalAttendances(nextAttendances);

        try {
            if (isPresent) {
                // Remove presence
                await supabase
                    .from('viagem_presencas')
                    .delete()
                    .eq('enrollment_id', enrollment.id)
                    .eq('trecho', trecho);
            } else {
                // Add presence
                await supabase
                    .from('viagem_presencas')
                    .insert({
                        viagem_id: tripId,
                        enrollment_id: enrollment.id,
                        passageiro_id: passenger.id,
                        trecho: trecho,
                        confirmado_por: user?.id
                    });
            }
            // Notify parent to refetch, but we already updated local state
            await onUpdate();
        } catch (error) {
            console.error('Error toggling attendance:', error);
            // Rollback on error
            setLocalAttendances(attendances);
        } finally {
            setLoading(null);
        }
    };
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 200);
    }, [onClose]);

    if (!isOpen && !isClosing) return null;

    const modalContent = (
        <div 
            className={cn(
                "fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md",
                isClosing ? "animate-out fade-out duration-200" : "animate-in fade-in duration-200"
            )}
            onClick={handleClose}
        >
            <div 
                className={cn(
                    "relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden",
                    isClosing ? "animate-out zoom-out-95 duration-200" : "animate-in zoom-in-95 duration-200"
                )}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h3 className="font-black text-gray-900 leading-tight">Presença Manual</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">{passenger.nome_completo}</p>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        {/* IDA Toggle */}
                        <button
                            onClick={() => toggleAttendance('ida')}
                            disabled={loading === 'ida'}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-95 group",
                                localAttendances.includes('ida')
                                    ? "bg-blue-50 border-blue-200 text-blue-700"
                                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    localAttendances.includes('ida') ? "bg-blue-200/50" : "bg-gray-100 group-hover:bg-gray-200"
                                )}>
                                    <ArrowRight size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-black uppercase tracking-widest text-[10px] opacity-70">Trecho</p>
                                    <p className="font-black text-base">IDA</p>
                                </div>
                            </div>
                            {loading === 'ida' ? (
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : localAttendances.includes('ida') ? (
                                <CheckCircle2 size={24} className="text-blue-600" />
                            ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200" />
                            )}
                        </button>

                        {/* VOLTA Toggle */}
                        <button
                            onClick={() => toggleAttendance('volta')}
                            disabled={loading === 'volta'}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-95 group",
                                localAttendances.includes('volta')
                                    ? "bg-blue-50 border-blue-200 text-blue-700"
                                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    localAttendances.includes('volta') ? "bg-blue-200/50" : "bg-gray-100 group-hover:bg-gray-200"
                                )}>
                                    <ArrowLeft size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-black uppercase tracking-widest text-[10px] opacity-70">Trecho</p>
                                    <p className="font-black text-base">VOLTA</p>
                                </div>
                            </div>
                            {loading === 'volta' ? (
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : localAttendances.includes('volta') ? (
                                <CheckCircle2 size={24} className="text-blue-600" />
                            ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 pt-4">
                    <button
                        onClick={handleClose}
                        className="w-full py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-700 font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
