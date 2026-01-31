import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Trip, Passenger } from '@/types';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/formatters';
import {
    Search,
    Users,
    CheckCircle2,
    AlertCircle,
    MapPin,
    Calendar,
    ArrowLeft,
    CreditCard as CreditCardIcon,
    ChevronRight as ChevronRightIcon,
    Filter,
    ChevronDown,
    Clock,
    X,
} from 'lucide-react';
import { MdPix } from 'react-icons/md';
import { AiOutlineUnorderedList } from 'react-icons/ai';
import { PixPaymentPanel } from '@/components/excursao/PixPaymentPanel';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { useBusStore } from '@/stores/useBusStore';
import { useTripStore } from '@/stores/useTripStore';
import { Statement } from './Financeiro/Statement';

export const TripPaymentCenter = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const { user } = useAuthStore();
    const initialTripId = searchParams.get('v');

    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Passenger[]>([]);
    const { passengers, fetchPassageiros } = usePassengerStore();
    const { buses, fetchOnibus } = useBusStore();
    const { trips: storeTrips, fetchViagens } = useTripStore();
    const [selectedPassengers, setSelectedPassengers] = useState<Passenger[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'selection' | 'pix' | 'success'>('selection');
    const [selectedTripFilterId, setSelectedTripFilterId] = useState<string>('all');
    const [customPayerName, setCustomPayerName] = useState('');
    const [tripPayments, setTripPayments] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'payment' | 'history'>('payment');

    // Pre-fill payer name and search from URL/User
    useEffect(() => {
        const searchFromUrl = searchParams.get('search');
        if (searchFromUrl) {
            setSearchQuery(searchFromUrl);
        } else if (user?.full_name && !searchQuery) {
            // Only use user.full_name as fallback if nothing else is searching
            setCustomPayerName(user.full_name);
        }
    }, [user, searchParams]);

    // Real-time search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) handleSearch();
            else setSearchResults([]);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Step Management: If we have no trip selected, we start at 'trip-selection'
    const [step, setStep] = useState<'trip-selection' | 'payment-flow'>(initialTripId ? 'payment-flow' : 'trip-selection');

    // Fetch Trips (if needed) or the specific Trip
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Fetch buses if not loaded
                if (buses.length === 0) await fetchOnibus();
                // Fetch passengers if not loaded
                if (passengers.length === 0) await fetchPassageiros();
                // Fetch trips if not loaded (or always to be safe with mapping)
                await fetchViagens();

            } catch (err) {
                console.error('Error loading data:', err);
                showToast('Erro ao carregar roteiros', 'error');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Memoize and format trips for display
    const trips = useMemo(() => {
        const now = new Date();
        const baseTrips = storeTrips.filter(t => new Date(t.data_ida) >= now);

        if (initialTripId) {
            const selectedTrip = baseTrips.find(t => t.id === initialTripId);
            if (selectedTrip) {
                setTrip(selectedTrip);
                setStep('payment-flow');
            }
        }

        return baseTrips;
    }, [storeTrips, initialTripId]);

    const getVacancies = (tripToCalc: Trip) => {
        const busIds = tripToCalc.onibus_ids || (tripToCalc.onibus_id ? [tripToCalc.onibus_id] : []);
        const totalCapacity = busIds.reduce((acc, id) => {
            const bus = buses.find(b => b.id === id);
            return acc + (bus?.capacidade || 0);
        }, 0);

        const occupied = passengers.filter(p =>
            p.viagem_id === tripToCalc.id &&
            p.assento &&
            p.onibus_id &&
            busIds.includes(p.onibus_id)
        ).length;

        return Math.max(0, totalCapacity - occupied);
    };

    const selectTrip = (t: Trip) => {
        setTrip(t);
        setStep('payment-flow');
    };

    // Clear selected passengers when trip changes
    useEffect(() => {
        setSelectedPassengers([]);
        setSearchQuery('');
        setSearchResults([]);
        setPaymentStatus('selection');

        // Fetch payments for this trip
        const fetchTripPayments = async () => {
            if (!trip?.id) return;

            try {
                const { data, error } = await supabase
                    .from('pagamentos')
                    .select('passageiros_ids')
                    .eq('viagem_id', trip.id)
                    .in('status', ['paid', 'Pago', 'Realizado']);

                if (error) throw error;

                const paidPassengerIds = new Set<string>();
                data?.forEach(payment => {
                    payment.passageiros_ids?.forEach((id: string) => paidPassengerIds.add(id));
                });

                setTripPayments(paidPassengerIds);
            } catch (err) {
                console.error('Error fetching trip payments:', err);
            }
        };

        fetchTripPayments();
    }, [trip?.id]);

    // Load passengers on mount/step change to enable client-side filtering
    useEffect(() => {
        if (step === 'payment-flow' && passengers.length === 0) {
            fetchPassageiros();
        }
    }, [step, fetchPassageiros, passengers.length]);

    // Instant Client-Side Search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = passengers.filter(p =>
            p.nome_completo.toLowerCase().includes(query) ||
            (p.cpf_rg && p.cpf_rg.toLowerCase().includes(query))
        );

        // Deduplicate Logic (Client-Side)
        // Group by identity (Name + Doc) to avoid showing duplicates
        const identityMap = new Map<string, Passenger>();

        filtered.forEach(p => {
            const identityKey = `${p.nome_completo.toLowerCase().trim()}-${(p.cpf_rg || '').trim()}`;
            const existing = identityMap.get(identityKey);

            // 1. If it's for the CURRENT trip, it ALWAYS wins
            if (trip && p.viagem_id === trip.id) {
                identityMap.set(identityKey, p);
            }
            // 2. If nothing exists yet, accept it (prefer Master record logic if needed, but simple valid record is fine for search)
            else if (!existing) {
                identityMap.set(identityKey, p);
            }
        });

        setSearchResults(Array.from(identityMap.values()));

    }, [searchQuery, passengers, trip]);

    // Legacy handleSearch removal (no longer needed)
    const handleSearch = async () => { };

    const [pixData, setPixData] = useState<{
        brCode: string;
        qrCodeImage: string;
        expiresAt: string;
        databaseId: string;
    } | null>(null);

    const togglePassengerSelection = (p: Passenger) => {
        // Only block if they are already paid FOR THIS trip
        if (p.viagem_id === trip?.id && (p.pagamento === 'Pago' || p.pagamento === 'Realizado')) {
            showToast('Este passageiro já está pago neste roteiro', 'info');
            return;
        }

        setSelectedPassengers(prev => {
            const isSelected = prev.find(item => item.id === p.id);
            if (isSelected) {
                return prev.filter(item => item.id !== p.id);
            }
            return [...prev, p];
        });
    };

    const totalAmount = useMemo(() => {
        if (!trip) return 0;
        return selectedPassengers.length * trip.preco;
    }, [selectedPassengers, trip]);

    const handleGeneratePayment = async () => {
        if (selectedPassengers.length === 0 || !trip) return;

        setIsProcessing(true);
        try {
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passengerIds: selectedPassengers.map(p => p.id),
                    tripId: trip.id,
                    payerName: customPayerName || user?.full_name || 'Anônimo',
                    payerEmail: user?.email,
                    payerId: user?.id
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao gerar PIX');

            setPixData(data.payment);
            setPaymentStatus('pix');
        } catch (err: any) {
            console.error('Error generating PIX:', err);
            showToast(err.message || 'Erro ao gerar PIX', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Polling for payment status
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (paymentStatus === 'pix' && pixData?.databaseId) {
            interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/payment/status?id=${pixData.databaseId}`);
                    const data = await response.json();

                    const normalizedStatus = data.status?.toLowerCase();
                    if (normalizedStatus === 'paid') {
                        setPaymentStatus('success');
                        showToast('Pagamento confirmado com sucesso!', 'success');
                    } else if (normalizedStatus === 'expired' || normalizedStatus === 'cancelled') {
                        showToast('O tempo Limite do Pix expirou.', 'warning');
                        setPaymentStatus('selection');
                        setPixData(null);
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 5000); // Poll every 5 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [paymentStatus, pixData?.databaseId, fetchPassageiros]);


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Carregando centro de pagamentos...</p>
            </div>
        );
    }

    if (step === 'payment-flow' && !trip) {
        return (
            <div className="max-w-md mx-auto py-20 text-center">
                <Card className="p-8 shadow-xl">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Viagem não encontrada.</h2>
                    <p className="text-gray-600 mb-6 text-sm">O link que você seguiu pode estar quebrado ou a viagem foi encerrada.</p>
                    <Button onClick={() => setStep('trip-selection')} className="w-full">
                        Escolher outra viagem
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in duration-500">
            {/* 1. Header with App Identity */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <CreditCardIcon className="text-white" size={20} />
                            </div>
                            Central de Pagamentos
                        </h1>
                        <p className="text-gray-500 text-sm ml-[52px]">Gerencie seus pagamentos e acompanhe seu histórico.</p>
                    </div>

                </div>
            </div>

            <div className="relative -mx-4 sm:mx-0">
                <div className="flex gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto scrollbar-thin px-4 sm:px-0 snap-x snap-mandatory">
                    <button
                        onClick={() => setActiveTab('payment')}
                        className={cn(
                            "px-6 sm:px-8 py-3 transition-all flex items-center justify-center border-b-2 snap-start",
                            activeTab === 'payment'
                                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                                : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        )}
                        title="Pagamento PIX"
                    >
                        <MdPix size={24} className="shrink-0" />
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "px-6 sm:px-8 py-3 transition-all flex items-center justify-center border-b-2 snap-start",
                            activeTab === 'history'
                                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                                : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        )}
                        title="Meu Extrato"
                    >
                        <AiOutlineUnorderedList size={24} className="shrink-0" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div key={activeTab} className="fade-in duration-300">
                {activeTab === 'payment' ? (
                    <>
                        {/* 2. Unified Toolbar - Glass Container for Controls */}
                        <div className="flex flex-col gap-4 bg-white/50 p-2 sm:p-3 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm">
                            {step === 'trip-selection' ? (
                                <div key="selection-header" className="flex flex-col gap-4 w-full">
                                    {/* Desktop/Mobile Search Controls */}
                                    <div className="flex items-center gap-4 w-full">
                                        {/* Trip Selection Dropdown (Desktop) */}
                                        <div className="relative group flex-1 hidden sm:block">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                                <Filter size={18} />
                                            </div>
                                            <select
                                                value={selectedTripFilterId}
                                                onChange={(e) => setSelectedTripFilterId(e.target.value)}
                                                className="w-full h-11 pl-11 pr-10 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 transition-all outline-none font-bold text-gray-700 appearance-none cursor-pointer text-sm"
                                            >
                                                <option value="all">Busca Rápida...</option>
                                                {trips.map(t => (
                                                    <option key={t.id} value={t.id}>{t.nome}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <ChevronDown size={18} />
                                            </div>
                                        </div>

                                        {/* Mobile Search Dropdown */}
                                        <div className="sm:hidden relative group w-full">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                                <Filter size={18} />
                                            </div>
                                            <select
                                                value={selectedTripFilterId}
                                                onChange={(e) => setSelectedTripFilterId(e.target.value)}
                                                className="w-full h-11 pl-12 pr-10 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 transition-all outline-none font-bold text-gray-700 appearance-none cursor-pointer text-sm"
                                            >
                                                <option value="all">Busca por Roteiro...</option>
                                                {trips.map(t => (
                                                    <option key={t.id} value={t.id}>{t.nome}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <ChevronDown size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div key="flow-header" className="flex items-center gap-4 w-full">
                                    <button
                                        onClick={() => setStep('trip-selection')}
                                        className="flex items-center gap-2 h-11 px-5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-all bg-white rounded-xl border border-blue-100 shadow-sm active:scale-95"
                                    >
                                        <ArrowLeft size={16} />
                                        Mudar Excursão
                                    </button>
                                    <div className="ml-auto text-right pr-3">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Valor Unitário</p>
                                        <p className="text-xl font-black text-gray-900 leading-none">{formatCurrency(trip?.preco || 0)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Main Content Container - FLATTENED */}
                        <div key={step} className="w-full pt-4 fade-in duration-700">
                            {step === 'trip-selection' ? (
                                <div className="overflow-hidden">
                                    {trips.filter(t => selectedTripFilterId === 'all' || t.id === selectedTripFilterId).length === 0 ? (
                                        <div className="p-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                                    <Users size={32} className="text-gray-300" />
                                                </div>
                                                <p className="text-lg font-medium">Nenhuma viagem aberta no momento.</p>
                                                <p className="text-sm">Novos roteiros aparecerão aqui em breve.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={selectedTripFilterId} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 fade-in duration-700">
                                            {trips
                                                .filter(t => selectedTripFilterId === 'all' || t.id === selectedTripFilterId)
                                                .map(t => (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => {
                                                            const vacs = getVacancies(t);
                                                            if (vacs > 0) selectTrip(t);
                                                            else showToast('Lotação Esgotada para este roteiro', 'warning');
                                                        }}
                                                        className={cn(
                                                            "group relative bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200/50 hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col",
                                                            getVacancies(t) <= 0 && "opacity-75 grayscale-[0.5] cursor-not-allowed hover:translate-y-0"
                                                        )}
                                                    >
                                                        {/* Decorator Gradient Header */}
                                                        <div className="h-20 bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 p-6 flex flex-col justify-center relative overflow-hidden">
                                                            {/* Abstract Shapes */}
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/15 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
                                                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-400/20 rounded-full blur-2xl -ml-12 -mb-12" />

                                                            <div className="relative flex justify-between items-center">
                                                                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl border border-white/30 shadow-sm">
                                                                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none">
                                                                        {t.data_ida ? new Date(t.data_ida).toLocaleDateString('pt-BR', { month: 'long' }) : 'Próxima'}
                                                                    </p>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300">
                                                                    <ChevronRightIcon className="text-white group-hover:text-blue-600 transition-colors" size={16} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-8 flex-1 flex flex-col gap-6">
                                                            <div className="space-y-2">
                                                                <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors tracking-tight">
                                                                    {t.nome}
                                                                </h3>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2 text-gray-400 font-bold">
                                                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                                            <MapPin size={12} className="text-gray-400" />
                                                                        </div>
                                                                        <span className="text-xs uppercase tracking-[0.1em] truncate font-black">{t.destino}</span>
                                                                    </div>

                                                                    <div className={cn(
                                                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                                        getVacancies(t) > 5 ? "bg-blue-50 text-blue-600" :
                                                                            getVacancies(t) > 0 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                                                    )}>
                                                                        <Users size={12} />
                                                                        {getVacancies(t)} Vagas
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Info Grid */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="bg-gray-50/80 p-4 rounded-3xl border border-gray-100/50 group-hover:bg-blue-50/50 group-hover:border-blue-100/50 transition-colors duration-500">
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <Calendar size={14} className="text-blue-500" />
                                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</span>
                                                                    </div>
                                                                    <p className="text-sm font-black text-gray-700">{new Date(t.data_ida).toLocaleDateString('pt-BR')}</p>
                                                                </div>
                                                                <div className="bg-gray-50/80 p-4 rounded-3xl border border-gray-100/50 group-hover:bg-blue-50/50 group-hover:border-blue-100/50 transition-colors duration-500">
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <Clock size={14} className="text-blue-500" />
                                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora</span>
                                                                    </div>
                                                                    <p className="text-sm font-black text-gray-700">07:00</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100/60">
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.15em] leading-none mb-1">Valor Unitário</p>
                                                                    <p className="text-2xl font-black text-gray-900 leading-none tracking-tight">
                                                                        {formatCurrency(t.preco || 0)}
                                                                    </p>
                                                                </div>

                                                                <div
                                                                    className={cn(
                                                                        "h-12 px-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center justify-center transition-all duration-300",
                                                                        getVacancies(t) > 0
                                                                            ? "bg-gray-900 text-white group-hover:bg-blue-600 group-hover:shadow-xl group-hover:shadow-blue-500/40"
                                                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    {getVacancies(t) > 0 ? "Selecionar" : "Esgotado"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {paymentStatus === 'selection' ? (
                                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                                            <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-md">
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                                        <Search size={20} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar por nome ou documento..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-4 text-sm font-bold border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-sm bg-white placeholder:text-gray-300"
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                                {searchResults.map(p => {
                                                    const isSelected = selectedPassengers.find(item => item.id === p.id);
                                                    const isPaid = tripPayments.has(p.id);

                                                    return (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => !isPaid && togglePassengerSelection(p)}
                                                            className={cn(
                                                                "flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer group",
                                                                isSelected ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white hover:bg-gray-50 border border-transparent hover:border-gray-100',
                                                                isPaid && 'opacity-40 cursor-not-allowed grayscale'
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center font-black transition-transform group-hover:scale-105",
                                                                    isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                                                                )}>
                                                                    {p.nome_completo.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className={cn("font-black text-sm", isSelected ? 'text-white' : 'text-gray-900')}>
                                                                        {p.nome_completo}
                                                                    </p>
                                                                    <p className={cn("text-[10px] uppercase font-black tracking-widest", isSelected ? 'text-blue-100' : 'text-gray-400')}>
                                                                        {isPaid ? 'Pagamento Confirmado' : p.cpf_rg || 'Sem Documento'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isPaid && <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 size={18} className="text-green-600" /></div>}
                                                                {!isPaid && isSelected && <CheckCircle2 size={24} className="text-white" />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {searchQuery && searchResults.length === 0 && !loading && (
                                                    <div className="py-12 text-center fade-in">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <Users size={32} className="text-gray-200" />
                                                        </div>
                                                        <p className="text-gray-500 font-black text-sm uppercase tracking-widest">Nenhum passageiro encontrado.</p>
                                                        <p className="text-xs text-gray-400 px-10 mt-2 font-bold leading-relaxed">Verifique se o nome está correto ou tente buscar pelo documento cadastrado.</p>
                                                    </div>
                                                )}
                                                {!searchQuery && searchResults.length === 0 && (
                                                    <div className="py-4 text-center text-gray-400">
                                                        <p className="text-xs font-medium">Use o campo acima para buscar os passageiros.</p>
                                                    </div>
                                                )}
                                            </div>


                                            <div
                                                className={cn(
                                                    "transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden",
                                                    selectedPassengers.length > 0
                                                        ? "max-h-[2000px] opacity-100 mt-8 mb-4 pointer-events-auto"
                                                        : "max-h-0 opacity-0 mt-0 mb-0 pointer-events-none"
                                                )}
                                            >
                                                <div className="rounded-[2.5rem] border border-blue-100 shadow-2xl shadow-blue-500/10 bg-white">
                                                    <div className="p-6 sm:p-10 border-b border-blue-50 bg-gradient-to-br from-blue-50/40 to-indigo-50/40 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/30 rounded-full blur-3xl -mr-20 -mt-20" />
                                                        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                            <div>
                                                                <p className="text-blue-600 text-[10px] sm:text-[11px] font-black uppercase tracking-[.3em] mb-2 sm:mb-3">Resumo do Pedido</p>
                                                                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                                                    {selectedPassengers.length} {selectedPassengers.length === 1 ? 'Passageiro' : 'Passageiros'}
                                                                </h3>
                                                            </div>
                                                            <div className="sm:text-right border-t sm:border-t-0 border-blue-100 pt-4 sm:pt-0">
                                                                <p className="text-gray-400 text-[10px] sm:text-[11px] font-black uppercase tracking-[.3em] mb-1 sm:mb-2">Total do Investimento</p>
                                                                <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter">
                                                                    {formatCurrency(totalAmount)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col divide-y divide-gray-50 max-h-[400px] overflow-y-auto custom-scrollbar bg-white">
                                                        {selectedPassengers.map(p => (
                                                            <div key={p.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 sm:py-6 sm:px-10 hover:bg-blue-50/40 transition-all duration-500 group gap-4 sm:gap-0">
                                                                <div className="flex items-center gap-4 sm:gap-5 group-hover:translate-x-1 transition-transform">
                                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 flex items-center justify-center font-black text-base sm:text-lg shrink-0 shadow-sm border border-blue-100/50">
                                                                        {p.nome_completo.charAt(0)}
                                                                    </div>
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="text-base sm:text-lg font-black text-gray-800 tracking-tight">{p.nome_completo}</span>
                                                                        <span className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{p.cpf_rg || 'Sem Doc'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-gray-50 pt-4 sm:pt-0">
                                                                    <span className="text-lg sm:text-xl font-black text-blue-600 tracking-tighter">{formatCurrency(trip?.preco || 0)}</span>
                                                                    <button
                                                                        onClick={() => togglePassengerSelection(p)}
                                                                        className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                                                                    >
                                                                        <X size={20} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="p-8 bg-gray-50/50 border-t border-gray-100/50">
                                                        <Button
                                                            onClick={handleGeneratePayment}
                                                            isLoading={isProcessing}
                                                            className="w-full h-16 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 bg-gray-900 hover:bg-blue-600 hover:-translate-y-1 active:scale-[0.98] transition-all rounded-2xl"
                                                        >
                                                            GERAR PIX DE PAGAMENTO
                                                        </Button>
                                                        <p className="text-center mt-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">
                                                            * Após clicar, um QR Code será gerado para pagamento.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : paymentStatus === 'success' ? (
                                        <div className="fade-in duration-500 py-12 text-center bg-white rounded-[2.5rem] border border-gray-100 shadow-xl">
                                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <CheckCircle2 size={48} className="text-green-600 animate-bounce" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h2>
                                            <p className="text-gray-500 mb-8">O pagamento de {formatCurrency(totalAmount)} foi processado com sucesso.</p>
                                            <div className="max-w-xs mx-auto p-4 bg-green-50 rounded-xl border border-green-100 mb-8">
                                                <p className="text-sm text-green-800 font-medium">Os passageiros agora podem selecionar seus assentos no mapa.</p>
                                            </div>
                                            <div className="flex flex-col gap-3 max-w-xs mx-auto">
                                                <Button
                                                    onClick={() => navigate('/viagens')}
                                                    className="w-full h-12 text-base font-bold shadow-lg shadow-blue-200"
                                                >
                                                    VER MAPA DE ASSENTOS
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setPaymentStatus('selection');
                                                        setSelectedPassengers([]);
                                                        setSearchQuery('');
                                                        setSearchResults([]);
                                                        setPixData(null);
                                                        fetchPassageiros();
                                                    }}
                                                    className="w-full h-10 font-bold text-gray-500"
                                                >
                                                    Novo Pagamento neste Roteiro
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="fade-in duration-300 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden p-8">
                                            <PixPaymentPanel
                                                pixCode={pixData?.brCode || ""}
                                                pixAmount={formatCurrency(totalAmount)}
                                                qrDataUrl={pixData?.qrCodeImage || ""}
                                                onCopy={() => {
                                                    navigator.clipboard.writeText(pixData?.brCode || "");
                                                    showToast('Código PIX copiado com sucesso!', 'success');
                                                }}
                                            />

                                            <div className="flex items-center justify-center gap-2 mt-8 text-blue-600 font-bold animate-pulse">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                                <span className="text-xs uppercase tracking-widest">Aguardando confirmação...</span>
                                            </div>

                                            <div className="mt-8 p-6 bg-blue-50/30 rounded-[2rem] border border-blue-100/50">
                                                <label className="block text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3 ml-2">
                                                    Identificação do Pagador
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        value={customPayerName}
                                                        onChange={(e) => setCustomPayerName(e.target.value)}
                                                        placeholder="Quem está pagando?"
                                                        className="bg-white border-blue-100 focus:ring-blue-500 rounded-2xl h-12 text-sm pl-4 shadow-sm"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-blue-400 mt-3 ml-2 font-medium">
                                                    * O nome que aparecerá no extrato do sistema.
                                                </p>
                                            </div>

                                            <div className="mt-8 pt-8 border-t border-gray-100">
                                                <Button
                                                    variant="secondary"
                                                    className="w-full h-12 font-bold text-gray-400 hover:text-gray-600 transition-colors rounded-2xl border-dashed border-2 hover:border-gray-300"
                                                    onClick={() => setPaymentStatus('selection')}
                                                    disabled={isProcessing}
                                                >
                                                    CANCELAR E VOLTAR
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="space-y-6">
                        <Statement userId={user?.id} hideHeader noAnimation />
                    </div>
                )}
            </div>
        </div >
    );
};
