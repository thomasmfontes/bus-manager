import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBusStore } from '@/stores/useBusStore';
import { Passenger, TripEnrollment } from '@/types';
import {
    X,
    Camera,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Bus as BusIcon,
    RefreshCw,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import seatIcon from '@/assets/seat-custom.png';

interface AttendanceScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    tripNome: string;
    hasVolta: boolean;
    onUpdate?: () => Promise<void>;
}

type Trecho = 'ida' | 'volta';
type ScanState = 'idle' | 'scanning' | 'success' | 'duplicate' | 'error';

interface ScanResult {
    passenger: Passenger;
    enrollment: TripEnrollment;
    trecho: Trecho;
    alreadyConfirmed: boolean;
}

const SCANNER_ELEMENT_ID = 'attendance-qr-scanner';

export const AttendanceScannerModal: React.FC<AttendanceScannerModalProps> = ({
    isOpen,
    onClose,
    tripId,
    tripNome,
    hasVolta,
    onUpdate,
}) => {
    const { user } = useAuthStore();
    const { buses } = useBusStore();
    const [trecho, setTrecho] = useState<Trecho>('ida');
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);

    // Scanner lifecycle refs
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isTransitioningRef = useRef(false);
    const isScanningRef = useRef(false);
    const isStartingRef = useRef(false);
    const didHandleScanRef = useRef(false);

    const stopScanner = useCallback(async () => {
        if (isTransitioningRef.current) return;
        if (scannerRef.current && isScanningRef.current) {
            isTransitioningRef.current = true;
            try {
                await scannerRef.current.stop();
                isScanningRef.current = false;
                setIsCameraReady(false);
            } catch (err) {
                console.warn('Scanner stop warning:', err);
                isScanningRef.current = false;
            } finally {
                isTransitioningRef.current = false;
            }
        }
    }, []);

    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const handleQRScanRef = useRef<(text: string) => Promise<void>>(async () => {});

    const startScanner = useCallback(async () => {
        if (isTransitioningRef.current || isStartingRef.current || isScanningRef.current) return;
        
        const el = document.getElementById(SCANNER_ELEMENT_ID);
        if (!el) return;

        setIsCameraReady(false);
        isStartingRef.current = true;
        isTransitioningRef.current = true;
        didHandleScanRef.current = false;

        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(SCANNER_ELEMENT_ID, {
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    verbose: false,
                    experimentalFeatures: { useBarCodeDetectorIfSupported: true }
                });
            }

            await scannerRef.current.start(
                { facingMode: 'environment' },
                { 
                    fps: 20, 
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const size = Math.floor(minEdge * 0.7);
                        return { width: size, height: size };
                    },
                    aspectRatio: 1
                },
                async (decodedText) => {
                    if (didHandleScanRef.current) return;
                    didHandleScanRef.current = true;
                    try { 
                        await scannerRef.current?.stop(); 
                        isScanningRef.current = false; 
                    } catch (_) {}
                    await handleQRScanRef.current(decodedText);
                },
                () => {}
            );

             isScanningRef.current = true;
            setIsCameraReady(true);
        } catch (err) {
            console.error('Scanner start error:', err);
            if (String(err).includes('Cannot clear while scan is ongoing')) {
                scannerRef.current = null;
            }
            setScanState('error');
        } finally {
            isStartingRef.current = false;
            isTransitioningRef.current = false;
        }
    }, []);

    const handleQRScan = useCallback(async (decodedText: string) => {
        setScanState('scanning');
        try {
            const enrollmentId = decodedText.trim();
            if (!isUuid(enrollmentId) || !isUuid(tripId)) {
                setScanState('error');
                return;
            }

            const { data: enrollData, error: enrollError } = await supabase
                .from('viagem_passageiros')
                .select('*')
                .eq('id', enrollmentId)
                .eq('viagem_id', tripId)
                .single();

            if (enrollError || !enrollData) { setScanState('error'); return; }

            const { data: passData, error: passError } = await supabase
                .from('passageiros')
                .select('*')
                .eq('id', enrollData.passageiro_id)
                .single();

            if (passError || !passData) { setScanState('error'); return; }

            const { data: existing } = await supabase
                .from('viagem_presencas')
                .select('id')
                .eq('enrollment_id', enrollmentId)
                .eq('trecho', trecho)
                .maybeSingle();

            setScanResult({
                passenger: passData as Passenger,
                enrollment: enrollData as TripEnrollment,
                trecho,
                alreadyConfirmed: Boolean(existing),
            });
            setScanState(existing ? 'duplicate' : 'success');

            if (navigator.vibrate) {
                navigator.vibrate(existing ? [100, 50, 100] : [200]);
            }
        } catch (err) {
            console.error('QR process error:', err);
            setScanState('error');
        }
    }, [tripId, trecho]);

    useEffect(() => { handleQRScanRef.current = handleQRScan; }, [handleQRScan]);

    useEffect(() => {
        if (!isOpen) {
            stopScanner();
            setScanState('idle');
            setScanResult(null);
            return;
        }
        const timer = setTimeout(() => startScanner(), 250);
        return () => clearTimeout(timer);
    }, [isOpen, startScanner, stopScanner]);

    useEffect(() => () => { stopScanner(); }, [stopScanner]);

    const handleReset = useCallback(async () => {
        setIsCameraReady(false);
        setScanState('idle');
        setScanResult(null);
        if (isScanningRef.current) {
            await stopScanner();
        }
        setTimeout(() => startScanner(), 250);
    }, [startScanner, stopScanner]);

    const handleConfirm = async () => {
        if (!scanResult || scanResult.alreadyConfirmed) return;
        setConfirming(true);
        try {
            const { error } = await supabase
                .from('viagem_presencas')
                .insert({
                    enrollment_id: scanResult.enrollment.id,
                    viagem_id: tripId,
                    passageiro_id: scanResult.passenger.id,
                    trecho: scanResult.trecho,
                    confirmado_por: user?.id ?? null,
                });
            if (error) throw error;
            setScanResult(prev => prev ? { ...prev, alreadyConfirmed: true } : prev);
            if (onUpdate) await onUpdate();
        } catch (err) {
            console.error('Confirm error:', err);
        } finally {
            setConfirming(false);
        }
    };

    const handleCloseModal = useCallback(async () => {
        setIsClosing(true);
        await stopScanner();
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setScanState('idle');
            setScanResult(null);
        }, 200);
    }, [onClose, stopScanner]);

    if (!isOpen && !isClosing) return null;

    const trechoLabel = trecho === 'ida' ? 'Ida' : 'Volta';
    const TrechoIcon = trecho === 'ida' ? ArrowRight : ArrowLeft;
    const showCamera = scanState === 'idle' || scanState === 'scanning';

    const modalContent = (
        <div
            className={cn(
                "fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md",
                isClosing ? "animate-out fade-out duration-200" : "animate-in fade-in duration-200"
            )}
            onClick={handleCloseModal}
        >
            <div
                className={cn(
                    "relative w-full sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col",
                    isClosing ? "animate-out zoom-out-95 duration-200" : "animate-in zoom-in-95 duration-200"
                )}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                            <Camera size={18} className="text-blue-600" />
                            Scanner de Presença
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{tripNome}</p>
                    </div>
                    <button
                        onClick={handleCloseModal}
                        className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5 overflow-y-auto">
                    {/* Trecho selector */}
                    {hasVolta && (
                        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                            {(['ida', 'volta'] as Trecho[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        setTrecho(t);
                                        if (scanState !== 'idle') handleReset();
                                    }}
                                    className={cn(
                                        'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                                        trecho === t
                                            ? (t === 'ida' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-purple-600 text-white shadow-lg shadow-purple-200')
                                            : 'text-gray-400 hover:text-gray-600'
                                    )}
                                >
                                    {t === 'ida' ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Camera/Results Section */}
                    <div className="relative">
                        {/* Viewfinder Overlay */}
                        {showCamera && (
                            <div className={cn(
                                "relative w-full aspect-square rounded-[32px] overflow-hidden bg-gray-50 ring-8 transition-all duration-500",
                                trecho === 'ida' ? "ring-blue-500/20" : "ring-purple-500/20"
                            )}>
                                {/* Initializing placeholder / Scanning load state */}
                                {(!isCameraReady || scanState === 'scanning') && !isClosing && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-[20]">
                                        <RefreshCw size={50} className={cn("animate-spin", trecho === 'ida' ? "text-blue-500" : "text-purple-500")} />
                                    </div>
                                )}
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                                        #${SCANNER_ELEMENT_ID} video {
                                            width: 100% !important;
                                            height: 100% !important;
                                            object-fit: cover !important;
                                            border-radius: 0 !important;
                                        }
                                        #${SCANNER_ELEMENT_ID} #qr-shaded-region {
                                            display: none !important;
                                        }
                                        #${SCANNER_ELEMENT_ID} canvas {
                                            display: none !important;
                                        }
                                    `
                                }} />
                                <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />
                            </div>
                        )}

                        {/* Error state */}
                        {scanState === 'error' && (
                            <div className="flex flex-col items-center gap-4 py-8 animate-in zoom-in duration-200">
                                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                    <AlertCircle size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-gray-900">QR inválido</p>
                                    <p className="text-xs text-gray-500 mt-1 font-medium">O código não pertence a esta viagem.</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 active:scale-95 transition-all"
                                >
                                    <RefreshCw size={14} />
                                    Tentar Novamente
                                </button>
                            </div>
                        )}

                        {/* Success / Duplicate state */}
                        {(scanState === 'success' || scanState === 'duplicate') && scanResult && (
                            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-6 duration-500 ease-out">
                                <div className="relative bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-100/30 p-6 flex flex-col gap-6 overflow-hidden">
                                    {/* Status Accent Line */}
                                    <div className={cn(
                                        'absolute top-0 left-0 right-0 h-1',
                                        scanResult.alreadyConfirmed ? 'bg-amber-400' : 'bg-green-500'
                                    )} />

                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            'w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm border border-white/20',
                                            scanResult.alreadyConfirmed ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                        )}>
                                            {scanResult.passenger.nome_completo[0]}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-black text-gray-900 text-lg leading-tight truncate">
                                                {scanResult.passenger.nome_completo}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100/50 text-blue-700">
                                                    <TrechoIcon size={8} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">{trechoLabel}</span>
                                                </div>
                                                {scanResult.alreadyConfirmed && (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-md border border-amber-100/50 text-amber-700">
                                                        <AlertCircle size={8} />
                                                        <span className="text-[8px] font-black uppercase tracking-widest">Já Confirmado</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.1em] block mb-1.5">Ônibus</span>
                                            <div className="flex items-center gap-2 text-gray-800">
                                                <BusIcon size={12} className="text-blue-600" />
                                                <span className="font-black text-[11px] truncate">
                                                    {buses.find(b => b.id === scanResult.enrollment.onibus_id)?.nome || '—'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.1em] block mb-1.5">Assento</span>
                                            <div className="flex items-center gap-2 text-gray-800">
                                                <img src={seatIcon} alt="S" className="w-[11px] h-[11px] opacity-70" />
                                                <span className="font-black text-[11px]">
                                                    {scanResult.enrollment.assento || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        {scanResult.alreadyConfirmed ? (
                                            <button
                                                onClick={handleReset}
                                                className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                            >
                                                <RefreshCw size={13} />
                                                Escanear Próximo
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleConfirm}
                                                disabled={confirming}
                                                className={cn(
                                                    'w-full py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg',
                                                    confirming
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-green-600 hover:bg-green-700 shadow-green-100'
                                                )}
                                            >
                                                {confirming ? (
                                                    <RefreshCw size={13} className="animate-spin" />
                                                ) : (
                                                    <CheckCircle2 size={15} />
                                                )}
                                                {confirming ? 'Confirmando…' : 'Confirmar'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};