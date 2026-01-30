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
} from 'lucide-react';
import { MdPix } from 'react-icons/md';
import { AiOutlineUnorderedList } from 'react-icons/ai';
import { PixPaymentPanel } from '@/components/excursao/PixPaymentPanel';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { PaymentList } from './Financeiro/PaymentList';

export const TripPaymentCenter = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const { user } = useAuthStore();
    const initialTripId = searchParams.get('v');

    const [trips, setTrips] = useState<Trip[]>([]);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Passenger[]>([]);
    const { passengers, fetchPassageiros } = usePassengerStore();
    const [selectedPassengers, setSelectedPassengers] = useState<Passenger[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'selection' | 'pix' | 'success'>('selection');
    const [selectedTripFilterId, setSelectedTripFilterId] = useState<string>('all');
    const [customPayerName, setCustomPayerName] = useState('');
    const [tripPayments, setTripPayments] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'payment' | 'history'>('payment');

    // Pre-fill payer name with logged-in user
    useEffect(() => {
        if (user?.full_name) {
            setCustomPayerName(user.full_name);
        }
    }, [user]);

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
                if (initialTripId) {
                    const { data, error } = await supabase
                        .from('viagens')
                        .select('*')
                        .eq('id', initialTripId)
                        .single();
                    if (error) throw error;
                    setTrip(data);
                    setStep('payment-flow');
                } else {
                    let query = supabase
                        .from('viagens')
                        .select('*');

                    const now = new Date().toISOString();
                    query = query.gte('data_ida', now);

                    const { data, error } = await query.order('data_ida', { ascending: true });

                    if (error) throw error;
                    setTrips(data || []);
                }
            } catch (err) {
                console.error('Error loading data:', err);
                showToast('Erro ao carregar roteiros', 'error');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [initialTripId]);

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
        if (p.pagamento === 'Pago' || p.pagamento === 'Realizado') {
            showToast('Este passageiro já está pago', 'info');
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
                    payerName: customPayerName || user?.full_name || 'Administrador',
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
        <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 animate-in fade-in duration-500">
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
            {activeTab === 'payment' ? (
                <>
                    {/* 2. Unified Toolbar - Glass Container for Controls */}
                    <div className="flex flex-col gap-4 bg-white/50 p-2 sm:p-3 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm">
                        {step === 'trip-selection' ? (
                            <div className="flex flex-col gap-4 w-full">
                                {/* Desktop/Mobile Search Controls */}
                                <div className="flex items-center gap-4 w-full px-1">
                                    {/* Trip Selection Dropdown (Desktop) */}
                                    <div className="relative group flex-1 hidden sm:block">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                            <Filter size={18} />
                                        </div>
                                        <select
                                            value={selectedTripFilterId}
                                            onChange={(e) => setSelectedTripFilterId(e.target.value)}
                                            className="w-full pl-11 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 transition-all outline-none font-bold text-gray-700 appearance-none cursor-pointer text-sm"
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
                                            className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 transition-all outline-none font-bold text-gray-700 appearance-none cursor-pointer text-sm"
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
                            <div className="flex items-center gap-4 w-full p-1">
                                <button
                                    onClick={() => setStep('trip-selection')}
                                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm"
                                >
                                    <ArrowLeft size={16} />
                                    Mudar Roteiro
                                </button>
                                <div className="ml-auto text-right pr-2">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none mb-1">Valor Unitário</p>
                                    <p className="text-lg font-bold text-gray-900 leading-none">{formatCurrency(trip?.preco || 0)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Main Content Container */}
                    <div className="flex flex-col gap-4 bg-white/50 p-2 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm w-full pt-2">
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                                        {trips
                                            .filter(t => selectedTripFilterId === 'all' || t.id === selectedTripFilterId)
                                            .map(t => (
                                                <div
                                                    key={t.id}
                                                    onClick={() => selectTrip(t)}
                                                    className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                                                >
                                                    {/* Decorator Gradient Header */}
                                                    <div className="h-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 p-6 flex flex-col justify-end relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full blur-xl -ml-12 -mb-12" />

                                                        <div className="relative flex justify-between items-center">
                                                            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                                                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                                                                    {t.data_ida ? new Date(t.data_ida).toLocaleDateString('pt-BR', { month: 'long' }) : 'Próxima'}
                                                                </p>
                                                            </div>
                                                            <ChevronRightIcon className="text-white/60 group-hover:text-white transition-colors translate-x-0 group-hover:translate-x-1" size={20} />
                                                        </div>
                                                    </div>

                                                    <div className="p-6 flex-1 flex flex-col gap-5">
                                                        <div className="space-y-1">
                                                            <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                                                {t.nome}
                                                            </h3>
                                                            <div className="flex items-center gap-1.5 text-gray-400 font-bold">
                                                                <MapPin size={14} className="shrink-0" />
                                                                <span className="text-xs uppercase tracking-wider truncate">{t.destino}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-5 text-sm font-bold text-gray-500 py-3 border-y border-gray-50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                                    <Calendar size={16} />
                                                                </div>
                                                                <span>{new Date(t.data_ida).toLocaleDateString('pt-BR')}</span>
                                                            </div>
                                                            <div className="w-px h-4 bg-gray-100" />
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                                    <Clock size={16} />
                                                                </div>
                                                                <span>07:00</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-auto pt-2">
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">Preço Assento</p>
                                                                <p className="text-2xl font-black text-gray-900 leading-none">
                                                                    {formatCurrency(t.preco || 0)}
                                                                </p>
                                                            </div>

                                                            <button className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300">
                                                                Selecionar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge (Optional) */}
                                                    <div className="absolute top-4 left-4 z-10">
                                                        <div className="bg-green-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md shadow-lg shadow-green-500/20">
                                                            Disponível
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
                                    <>
                                        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="Nome ou documento do passageiro..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-1 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {searchResults.map(p => {
                                                const isSelected = selectedPassengers.find(item => item.id === p.id);
                                                const isPaid = tripPayments.has(p.id);

                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => !isPaid && togglePassengerSelection(p)}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer group",
                                                            isSelected ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md' : 'bg-transparent hover:bg-gray-50',
                                                            isPaid && 'opacity-40 cursor-not-allowed grayscale'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-transform group-hover:scale-105",
                                                                isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                                                            )}>
                                                                {p.nome_completo.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className={cn("font-bold text-sm", isSelected ? 'text-white' : 'text-gray-900')}>
                                                                    {p.nome_completo}
                                                                </p>
                                                                <p className={cn("text-[10px] uppercase font-bold", isSelected ? 'text-blue-100' : 'text-gray-400')}>
                                                                    {isPaid ? 'Pagamento Confirmado' : p.cpf_rg || 'Sem Documento'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isPaid && <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 size={16} className="text-green-600" /></div>}
                                                            {!isPaid && isSelected && <CheckCircle2 size={20} className="text-white" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {searchQuery && searchResults.length === 0 && !loading && (
                                                <div className="py-12 text-center">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <Users size={28} className="text-gray-200" />
                                                    </div>
                                                    <p className="text-gray-500 font-bold text-sm">Nenhum passageiro encontrado.</p>
                                                    <p className="text-xs text-gray-400 px-10">Tente buscar pelo nome completo ou documento cadastrado.</p>
                                                </div>
                                            )}
                                            {!searchQuery && searchResults.length === 0 && (
                                                <div className="py-4 text-center text-gray-400">
                                                    <p className="text-xs font-medium">
                                                        Use o campo acima para buscar os passageiros.
                                                    </p>
                                                </div>
                                            )}
                                        </div>


                                        {selectedPassengers.length > 0 && (
                                            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                                <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50/30">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-1">Resumo da Seleção</p>
                                                            <h3 className="text-xl font-bold text-gray-900">{selectedPassengers.length} {selectedPassengers.length === 1 ? 'Passageiro' : 'Passageiros'}</h3>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total a pagar</p>
                                                            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{formatCurrency(totalAmount)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col divide-y divide-gray-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    {selectedPassengers.map(p => (
                                                        <div key={p.id} className="flex justify-between items-center py-4 px-6 hover:bg-gray-50/50 transition-colors">
                                                            <div className="flex items-center gap-3 active:scale-95 transition-transform">
                                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                                    {p.nome_completo.charAt(0)}
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700 truncate max-w-[180px] sm:max-w-xs">{p.nome_completo}</span>
                                                            </div>
                                                            <span className="text-blue-600 font-bold whitespace-nowrap text-sm">{formatCurrency(trip?.preco || 0)}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                                                    <Button
                                                        onClick={handleGeneratePayment}
                                                        isLoading={isProcessing}
                                                        className="w-full h-12 text-base font-bold shadow-md"
                                                    >
                                                        GERAR PIX DE PAGAMENTO
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : paymentStatus === 'success' ? (
                                    <div className="animate-in fade-in zoom-in duration-500 py-12 text-center">
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
                                    <div className="animate-in zoom-in-95 duration-300">
                                        <div className="overflow-hidden">
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

                                            <div className="p-8 bg-gray-50/50 border-t border-gray-100">
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
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <PaymentList userId={user?.id} hideHeader />
                </div>
            )
            }
        </div>
    );
};
