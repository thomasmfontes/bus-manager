import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Trip, Passenger, UserRole } from '@/types';
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
    ShoppingCart,
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
import { Spinner } from '@/components/ui/Spinner';
import { TripEnrollmentModal } from '@/components/viagens/TripEnrollmentModal';

export const TripPaymentCenter = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useToast();
    const { user } = useAuthStore();
    const initialTripId = searchParams.get('v');
    const selectSelf = searchParams.get('selectSelf') === 'true';
    const pids = searchParams.get('pids');

    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Passenger[]>([]);
    const { passengers, enrollments, fetchPassageiros } = usePassengerStore();
    const { buses, fetchOnibus } = useBusStore();
    const { trips: storeTrips, fetchViagens, selectedTripId, setSelectedTripId } = useTripStore();
    const [selectedPassengers, setSelectedPassengers] = useState<Passenger[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'selection' | 'pix' | 'success'>('selection');
    const [selectedTripFilterId, setSelectedTripFilterId] = useState<string>(initialTripId || selectedTripId || 'all');
    const [customPayerName, setCustomPayerName] = useState('');
    const [activeTab, setActiveTab] = useState<'payment' | 'history'>('payment');
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    // Capture if we started with pids once, regardless of URL cleanup
    const hasInitialPids = useRef(!!new URLSearchParams(window.location.search).get('pids'));
    const [showFloatingCart, setShowFloatingCart] = useState(!hasInitialPids.current);
    const prevTripIdRef = useRef<string | null>(initialTripId || selectedTripId || null);
    const [paymentModalTrip, setPaymentModalTrip] = useState<Trip | null>(null);

    // Prevent background scrolling when summary is open AND has items
    useEffect(() => {
        if (isSummaryOpen && selectedPassengers.length > 0) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isSummaryOpen, selectedPassengers.length]);

    const userPassenger = useMemo(() => {
        if (!user?.id) return null;
        return passengers.find(p => p.id === user.id);
    }, [user, passengers]);

    // Derived: Passengers who have already paid for the SELECTED trip
    const tripPayments = useMemo(() => {
        if (!trip?.id) return new Set<string>();
        const paidIds = new Set<string>();
        enrollments.forEach(e => {
            if (e.viagem_id === trip.id && (e.pagamento === 'Pago' || e.pagamento === 'paid' || e.pagamento === 'Realizado')) {
                paidIds.add(e.passageiro_id);
            }
        });
        return paidIds;
    }, [trip?.id, enrollments]);

    // Pre-fill payer name and search from URL/User
    useEffect(() => {
        const searchFromUrl = searchParams.get('search');
        if (searchFromUrl) {
            setSearchQuery(searchFromUrl);
        }

        // Always ensure the payer name is initialized to the logged-in user if empty
        if (user?.full_name && !customPayerName) {
            setCustomPayerName(user.full_name);
        }

        if (selectSelf && !pids && userPassenger && selectedPassengers.length === 0 && !tripPayments.has(userPassenger.id)) {
            setSelectedPassengers([userPassenger]);
        }

        // Load passengers from pids if provided
        if (pids && selectedPassengers.length === 0) {
            const pidList = pids.split(',');
            const loadPassengers = async () => {
                const { data, error } = await supabase
                    .from('passageiros')
                    .select('*')
                    .in('id', pidList);

                if (!error && data) {
                    setSelectedPassengers(data);
                    // Clear pids from URL after loading them into state to prevent re-application on trip change
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('pids');
                    newParams.delete('selectSelf');
                    setSearchParams(newParams, { replace: true });
                }
            };
            loadPassengers();
        }
    }, [user, searchParams, userPassenger, tripPayments, pids, setSearchParams]);

    // Handle floating cart appearance delay
    useEffect(() => {
        if (hasInitialPids.current) {
            const timer = setTimeout(() => {
                setShowFloatingCart(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);


    // Real-time search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) handleSearch();
            else setSearchResults([]);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Step Management: If we have no trip selected, we start at 'trip-selection'
    const [step, setStep] = useState<'trip-selection' | 'payment-flow'>('trip-selection');

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
        // The selection list only shows future trips (including 24h grace period)
        return storeTrips.filter(t => {
            const tripDate = new Date(t.data_ida);
            const cutoffDate = new Date(tripDate.getTime() + 24 * 60 * 60 * 1000);
            return cutoffDate >= now;
        });
    }, [storeTrips]);

    // Initialize from URL or Global Store
    useEffect(() => {
        if (storeTrips.length === 0) return;

        const tryAutoSelect = (tripId: string) => {
            const t = storeTrips.find(t => t.id === tripId);
            if (!t) return false;

            // Only auto-jump to payment if there's a vacancy OR user is already part of it
            const hasVacancies = getVacancies(t) > 0;
            const isUserEnrolled = isUserOccupiedInTrip(t.id);

            if (hasVacancies || isUserEnrolled) {
                setTrip(t);
                setSelectedTripFilterId(tripId);
                return true;
            }
            return false;
        };

        // If we have a URL param, it takes precedence for the initial load
        if (initialTripId) {
            const autoSelected = tryAutoSelect(initialTripId);
            if (autoSelected) {
                setSelectedTripId(initialTripId); // Sync global context if URL has it
                // Note: We stay on 'trip-selection' step as per previous logic for URL-based search
            }
            return;
        }

        // If no URL param, but we have a global selection, use it
        if (selectedTripId) {
            const autoSelected = tryAutoSelect(selectedTripId);
            if (autoSelected) {
                const myEnrollment = enrollments.find(e =>
                    e.viagem_id === selectedTripId &&
                    (e.passageiro_id === user?.id || e.pago_por === user?.id) &&
                    e.assento !== 'DESISTENTE'
                );
                const t = storeTrips.find(t => t.id === selectedTripId);

                if (t?.requires_approval && (myEnrollment?.status === 'PENDING' || myEnrollment?.status === 'REJECTED')) {
                    setStep('trip-selection');
                    return;
                }
                setStep('payment-flow');
            }
        }
    }, [storeTrips, initialTripId]);

    // Sync with Global Context changes (Reactive)
    useEffect(() => {
        if (selectedTripId) {
            const t = storeTrips.find(t => t.id === selectedTripId);
            if (t) {
                const hasVacancies = getVacancies(t) > 0;
                const isUserEnrolled = isUserOccupiedInTrip(t.id);

                if (hasVacancies || isUserEnrolled) {
                    const myEnrollment = enrollments.find(e =>
                        e.viagem_id === selectedTripId &&
                        (e.passageiro_id === user?.id || e.pago_por === user?.id) &&
                        e.assento !== 'DESISTENTE'
                    );

                    if (t.requires_approval && (myEnrollment?.status === 'PENDING' || myEnrollment?.status === 'REJECTED')) {
                        setTrip(null);
                        setStep('trip-selection');
                        setSelectedTripFilterId(selectedTripId); // keep filter on that trip so its card is visible
                        return;
                    }

                    setTrip(t);
                    setStep('payment-flow');
                    setSelectedTripFilterId(selectedTripId);
                } else {
                    setTrip(null);
                    setStep('trip-selection');
                    setSelectedTripFilterId('all');
                }
            }
        } else if (step === 'payment-flow') {
            setTrip(null);
            setStep('trip-selection');
            setSelectedTripFilterId('all');
        }
    }, [selectedTripId]);

    const getVacancies = (t: Trip) => {
        const occupied = enrollments.filter((e) => {
            if (e.viagem_id !== t.id) return false;
            if (e.assento === 'DESISTENTE') return false;
            // Waitlist (pending/rejected approval) does not occupy a seat
            if (e.status === 'PENDING' || e.status === 'REJECTED') return false;
            return true;
        }).length;

        const totalSeats = (t.onibus_ids || []).reduce((total, id) => {
            const bus = buses.find((b) => b.id === id);
            return total + (bus?.capacidade || 0);
        }, 0);

        return Math.max(0, totalSeats - occupied);
    };

    const isUserOccupiedInTrip = (tripId: string) => {
        return enrollments.some(e => {
            if (e.viagem_id !== tripId) return false;
            if (e.assento === 'DESISTENTE') return false;

            return e.passageiro_id === user?.id || e.pago_por === user?.id;
        });
    };

    // Helper to check if a passenger is already part of a trip list (even if not paid)
    const isAccountedFor = (passId: string) => {
        if (!trip) return false;
        return enrollments.some(e =>
            e.viagem_id === trip.id &&
            e.passageiro_id === passId &&
            e.assento !== 'DESISTENTE'
        );
    };

    const isPastTrip = useMemo(() => {
        if (!trip) return false;
        const tripDate = new Date(trip.data_ida);
        const cutoffDate = new Date(tripDate.getTime() + 24 * 60 * 60 * 1000);
        return cutoffDate < new Date();
    }, [trip]);

    const selectTrip = (t: Trip) => {
        setTrip(t);
        setSelectedTripId(t.id); // Sync global context
        setStep('payment-flow');
        // Clear specific parameters when manually selecting a trip
        setSearchParams({ v: t.id }, { replace: true });
    };

    // Clear selected passengers when trip changes
    useEffect(() => {
        // Only clear if the trip ID actually changed
        if (trip?.id === prevTripIdRef.current) return;

        console.log('Trip changed or initialized, resetting state');
        prevTripIdRef.current = trip?.id || null;

        setSelectedPassengers([]);
        setSearchQuery('');
        setSearchResults([]);
        setPaymentStatus('selection');
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
        const filtered = passengers.filter(p => {
            const isSystemIdentity = p.nome_completo === 'BLOQUEADO' || p.cpf_rg === 'BLOCKED';
            if (isSystemIdentity) return false;

            return p.nome_completo.toLowerCase().includes(query) ||
                (p.cpf_rg && p.cpf_rg.toLowerCase().includes(query));
        });

        // Deduplicate Logic (Client-Side)
        // Group by identity (Name + Doc) to avoid showing duplicates
        const identityMap = new Map<string, Passenger>();

        filtered.forEach(p => {
            const identityKey = `${p.nome_completo.toLowerCase().trim()}-${(p.cpf_rg || '').trim()}`;
            const existing = identityMap.get(identityKey);

            // 1. If it's for the CURRENT trip, it ALWAYS wins
            if (trip && p.enrollment?.viagem_id === trip.id) {
                identityMap.set(identityKey, p);
            }
            // 2. If nothing exists yet, accept it
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
        if (!trip) return;

        // ENSURE we only look at the enrollment for THE CURRENT TRIP
        const pEnrollment = (p.enrollment?.viagem_id === trip.id ? p.enrollment : null) || 
                           enrollments.find(e => e.passageiro_id === p.id && e.viagem_id === trip.id && e.assento !== 'DESISTENTE');
                           
        const isPaid = pEnrollment?.pagamento === 'Pago' || pEnrollment?.pagamento === 'Realizado';

        // Only block if they are already paid FOR THIS trip
        if (isPaid) {
            showToast('Este passageiro já está pago neste roteiro', 'info');
            return;
        }

        const isCurrentlySelected = selectedPassengers.some(item => item.id === p.id);

        // If trying to add (not remove)
        if (!isCurrentlySelected) {
            if (trip.requires_approval && (!pEnrollment || pEnrollment.status !== 'APPROVED')) {
                showToast('Este passageiro precisa solicitar aprovação prévia para esta viagem.', 'error');
                return;
            }

            if (pEnrollment?.status === 'PENDING' || pEnrollment?.status === 'REJECTED') {
                showToast('A solicitação deste passageiro está pendente ou foi recusada.', 'error');
                return;
            }

            if (!isAccountedFor(p.id)) {
                const vacancies = getVacancies(trip);
                const cartNewOccupantsCount = selectedPassengers.filter(item => !isAccountedFor(item.id)).length;

                if (vacancies - cartNewOccupantsCount <= 0) {
                    showToast('Não há vagas/cotas suficientes para adicionar este passageiro.', 'error');
                    return;
                }
            }
        }

        setSelectedPassengers(prev => {
            const isSelected = prev.find(item => item.id === p.id);

            // Removing from cart is always allowed
            if (isSelected) {
                const newSelection = prev.filter(item => item.id !== p.id);
                if (newSelection.length === 0) setIsSummaryOpen(false);
                return newSelection;
            }

            return [...prev, p];
        });
    };

    const handleQuickAccessClick = () => {
        if (!userPassenger) return;
        togglePassengerSelection(userPassenger);
    };

    const totalAmount = useMemo(() => {
        if (!trip) return 0;
        return selectedPassengers.length * trip.preco;
    }, [selectedPassengers, trip]);

    const handleGeneratePayment = async () => {
        if (selectedPassengers.length === 0 || !trip) return;

        if (isPastTrip) {
            showToast('Esta viagem já foi encerrada e não permite novos pagamentos.', 'error');
            return;
        }

        const newPassengersCount = selectedPassengers.filter(p => !isAccountedFor(p.id)).length;
        if (getVacancies(trip) < newPassengersCount) {
            showToast('Não há vagas/cotas suficientes para este roteiro.', 'error');
            return;
        }

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

    // Real-time Payer Name update (for persistence)
    useEffect(() => {
        if (paymentStatus === 'pix' && pixData?.databaseId && customPayerName.trim()) {
            const timer = setTimeout(async () => {
                try {
                    await supabase
                        .from('pagamentos')
                        .update({ payer_name: customPayerName })
                        .eq('id', pixData.databaseId);
                } catch (err) {
                    console.error('Error syncing payer name:', err);
                }
            }, 1000); // 1s debounce

            return () => clearTimeout(timer);
        }
    }, [customPayerName, paymentStatus, pixData?.databaseId]);

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
                <Spinner size="xl" text="Carregando centro de pagamentos..." />
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
                                <div key="flow-header" className="flex flex-col gap-3 w-full p-1">
                                    {/* Line 1: Actions & Price */}
                                    <div className="flex items-center justify-between w-full">
                                        <button
                                            onClick={() => {
                                                setStep('trip-selection');
                                                setSelectedTripId(null);
                                                setSelectedTripFilterId('all');
                                                setSearchParams({}, { replace: true });
                                            }}
                                            className="flex items-center gap-2 h-10 px-4 text-xs font-bold text-blue-600 bg-white rounded-xl border border-blue-100 shadow-sm transition-all active:scale-95"
                                        >
                                            <ArrowLeft size={14} />
                                            Mudar Excursão
                                        </button>

                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Valor Unitário</p>
                                            <p className="text-xl font-black text-gray-900 leading-none">{formatCurrency(trip?.preco || 0)}</p>
                                        </div>
                                    </div>

                                    {/* Line 2: Trip Status Card */}
                                    {trip && (
                                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/80 rounded-[1.25rem] border border-blue-100/50 shadow-sm">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-blue-200 shadow-lg">
                                                <MapPin size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-0.5">Pagando para:</p>
                                                <p className="text-sm font-black text-gray-800 truncate">{trip.nome}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Past Trip Banner */}
                        {step === 'payment-flow' && isPastTrip && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                                <AlertCircle size={20} />
                                <div className="text-sm font-bold">
                                    Esta excursão já foi realizada e por isso não aceita novos pagamentos via PIX.
                                </div>
                            </div>
                        )}

                        {/* 3. Main Content Container - FLATTENED */}
                        <div key={step} className="w-full pt-4 fade-in duration-700">
                            {step === 'trip-selection' ? (
                                <div>
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
                                        <div key={selectedTripFilterId} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 pt-4 pb-12 fade-in duration-700">
                                            {trips
                                                .filter(t => selectedTripFilterId === 'all' || t.id === selectedTripFilterId)
                                                .map(t => {
                                                    const myEnrollment = enrollments.find(e =>
                                                        e.viagem_id === t.id &&
                                                        (e.passageiro_id === user?.id || e.pago_por === user?.id) &&
                                                        e.assento !== 'DESISTENTE'
                                                    );
                                                    const isPending = t.requires_approval && myEnrollment?.status === 'PENDING';
                                                    const isRejected = t.requires_approval && myEnrollment?.status === 'REJECTED';
                                                    const isBlocked = isPending || isRejected;

                                                    return (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => {
                                                            if (user?.role === UserRole.ADMIN) {
                                                                navigate(`/viagens/${t.id}`);
                                                                return;
                                                            }
                                                            if (isPending) {
                                                                showToast('Sua solicitação de participação ainda está aguardando aprovação do organizador.', 'warning');
                                                                return;
                                                            }
                                                            if (isRejected) {
                                                                showToast('A sua solicitação para participar desta viagem não foi aprovada.', 'error');
                                                                return;
                                                            }

                                                            // If already participated/occupied, go straight to selection
                                                            if (isUserOccupiedInTrip(t.id)) {
                                                                selectTrip(t);
                                                            } else {
                                                                // Otherwise, show info modal first (consistent with Dash)
                                                                setPaymentModalTrip(t);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "group relative bg-white rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden flex flex-col",
                                                            isPending && "border-amber-200 bg-amber-50/30 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-2",
                                                            isRejected && "border-red-200 bg-red-50/20 hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-2",
                                                            !isBlocked && "border-gray-100 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200/50 hover:-translate-y-2",
                                                            (getVacancies(t) <= 0 && !isUserOccupiedInTrip(t.id) && !isBlocked) && "opacity-75 grayscale-[0.5] cursor-not-allowed hover:translate-y-0 pointer-events-none"
                                                        )}
                                                    >
                                                        {/* Decorator Gradient Header */}
                                                        <div className={cn(
                                                            "h-20 p-6 flex flex-col justify-center relative overflow-hidden",
                                                            isPending ? "bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400" :
                                                            isRejected ? "bg-gradient-to-br from-red-500 via-red-500 to-rose-600" :
                                                            "bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700"
                                                        )}>
                                                            {/* Abstract Shapes */}
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/15 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
                                                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-400/20 rounded-full blur-2xl -ml-12 -mb-12" />

                                                            <div className="relative flex justify-between items-center">
                                                                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl border border-white/30 shadow-sm">
                                                                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none">
                                                                        {isPending ? 'Aguardando Aprovação' : isRejected ? 'Solicitação Recusada' : (t.data_ida ? new Date(t.data_ida).toLocaleDateString('pt-BR', { month: 'long' }) : 'Próxima')}
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
                                                                <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2">
                                                                    <div className="flex items-center gap-2 text-gray-400 font-bold min-w-0 flex-1">
                                                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                                            <MapPin size={12} className="text-gray-400" />
                                                                        </div>
                                                                        <span className="text-xs uppercase tracking-[0.1em] truncate font-black">{t.destino}</span>
                                                                    </div>

                                                                    <div className={cn(
                                                                        "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] whitespace-nowrap font-black uppercase tracking-widest shrink-0 shadow-sm",
                                                                        getVacancies(t) > 5 ? "bg-blue-50 text-blue-600" :
                                                                            getVacancies(t) > 0 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                                                    )}>
                                                                        <Users size={12} />
                                                                        <span>{getVacancies(t)} Vagas</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Info Grid */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                                <div className="bg-gray-50/80 p-4 rounded-3xl border border-gray-100/50 group-hover:bg-blue-50/50 group-hover:border-blue-100/50 transition-colors duration-500">
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <Calendar size={14} className="text-blue-500" />
                                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Partida</span>
                                                                    </div>
                                                                    <p className="text-sm font-black text-gray-700">{new Date(t.data_ida).toLocaleDateString('pt-BR')} às {new Date(t.data_ida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                                </div>
                                                                <div className="bg-gray-50/80 p-4 rounded-3xl border border-gray-100/50 group-hover:bg-blue-50/50 group-hover:border-blue-100/50 transition-colors duration-500">
                                                                    {t.data_volta ? (
                                                                        <>
                                                                            <div className="flex items-center gap-3 mb-1">
                                                                                <Clock size={14} className="text-purple-500" />
                                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Retorno</span>
                                                                            </div>
                                                                            <p className="text-sm font-black text-gray-700">{new Date(t.data_volta).toLocaleDateString('pt-BR')} às {new Date(t.data_volta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <div className="flex items-center gap-3 mb-1">
                                                                                <Clock size={14} className="text-blue-500" />
                                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora</span>
                                                                            </div>
                                                                            <p className="text-sm font-black text-gray-700">{new Date(t.data_ida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                                        </>
                                                                    )}
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
                                                                        isPending ? "bg-amber-400 text-white" :
                                                                        isRejected ? "bg-red-100 text-red-600" :
                                                                        (getVacancies(t) > 0 || isUserOccupiedInTrip(t.id))
                                                                            ? "bg-gray-900 text-white group-hover:bg-blue-600 group-hover:shadow-xl group-hover:shadow-blue-500/40"
                                                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    {isPending ? 'Aguardando' :
                                                                     isRejected ? 'Recusado' :
                                                                     t.requires_approval && !enrollments.some(e => e.viagem_id === t.id && (e.passageiro_id === user?.id || e.pago_por === user?.id) && e.status === 'APPROVED' && (e.pagamento === 'Pendente' || e.pagamento === 'pending'))
                                                                        ? 'Solicitar'
                                                                        : (getVacancies(t) > 0 || isUserOccupiedInTrip(t.id)) ? 'Selecionar' : 'Esgotado'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {paymentStatus === 'selection' ? (
                                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                            {/* Info Notice */}
                                            <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100/50 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                    <Users size={18} />
                                                </div>
                                                <p className="text-[10px] sm:text-xs font-black text-blue-700 leading-tight">
                                                    DICA: Você pode pesquisar e selecionar <span className="underline">vários passageiros</span> para pagar todos em um único PIX.
                                                </p>
                                            </div>

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

                                            {/* Fast Selection for the Logged User */}
                                            {!searchQuery && userPassenger && !selectedPassengers.find(sp => sp.id === userPassenger.id) && !tripPayments.has(userPassenger.id) && (
                                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                                                    <button
                                                        onClick={handleQuickAccessClick}
                                                        className="w-full h-12 px-4 flex items-center gap-3 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm group"
                                                    >
                                                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                            <Users size={14} />
                                                        </div>
                                                        <span className="text-sm font-black text-gray-700 group-hover:text-blue-600 truncate">
                                                            Pagar para mim ({userPassenger.nome_completo.split(' ')[0]})
                                                        </span>
                                                        <ChevronRightIcon size={16} className="ml-auto text-gray-300 group-hover:text-blue-600" />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                                {searchResults.map(p => {
                                                    const isSelected = selectedPassengers.find(item => item.id === p.id);
                                                    const isPaid = tripPayments.has(p.id);
                                                    const pEnrollment = p.enrollment || enrollments.find(e => e.passageiro_id === p.id && e.viagem_id === trip?.id && e.assento !== 'DESISTENTE');
                                                    const isPendingApproval = trip?.requires_approval && (!pEnrollment || pEnrollment.status !== 'APPROVED');

                                                    return (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => !isPaid && !isPendingApproval && togglePassengerSelection(p)}
                                                            className={cn(
                                                                "flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer group",
                                                                isSelected ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white hover:bg-gray-50 border border-transparent hover:border-gray-100',
                                                                (isPaid || isPendingApproval) && 'opacity-40 cursor-not-allowed grayscale'
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
                                                                        {isPaid ? 'Pagamento Confirmado' : isPendingApproval ? 'Aprovação Pendente' : p.cpf_rg || 'Sem Documento'}
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
                                                    <div className="py-12 text-center text-gray-400 fade-in">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Search size={24} className="text-gray-200" />
                                                            <p className="text-sm font-bold text-gray-400">Pesquise passageiros pelo nome ou documento.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>


                                            {/* Drawer-like Summary Panel (Overlay) */}
                                            {selectedPassengers.length > 0 && (
                                                <>
                                                    {/* Backdrop */}
                                                    <div
                                                        className={cn(
                                                            "fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300",
                                                            isSummaryOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                                                        )}
                                                        onClick={() => setIsSummaryOpen(false)}
                                                    />

                                                    {/* Side Panel (Summary) */}
                                                    <div
                                                        className={cn(
                                                            "fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-[101] shadow-2xl transition-all duration-500 ease-out flex flex-col",
                                                            isSummaryOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 invisible pointer-events-none"
                                                        )}
                                                    >
                                                        {/* Drawer Header */}
                                                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                                    <ShoppingCart size={20} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Seu Carrinho</h3>
                                                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mt-1">
                                                                        {selectedPassengers.length} {selectedPassengers.length === 1 ? 'Passageiro' : 'Passageiros'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setIsSummaryOpen(false)}
                                                                className="w-10 h-10 rounded-xl bg-white/50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-all shadow-sm"
                                                            >
                                                                <X size={20} />
                                                            </button>
                                                        </div>

                                                        {/* Passenger List Scrollable */}
                                                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                                            {selectedPassengers.map(p => (
                                                                <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all group">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center font-black shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                                                                            {p.nome_completo.charAt(0)}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <p className="text-sm font-black text-gray-800 tracking-tight line-clamp-1">{p.nome_completo}</p>
                                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{p.cpf_rg || 'Sem Documento'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-sm font-black text-blue-600 tabular-nums">{formatCurrency(trip?.preco || 0)}</span>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                togglePassengerSelection(p);
                                                                            }}
                                                                            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                                                        >
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Drawer Footer */}
                                                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-6">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Total do Pedido</p>
                                                                <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter">
                                                                    {formatCurrency(totalAmount)}
                                                                </p>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <Button
                                                                    onClick={handleGeneratePayment}
                                                                    isLoading={isProcessing}
                                                                    className="w-full h-16 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 bg-gray-900 hover:bg-blue-600 hover:-translate-y-1 active:scale-95 transition-all rounded-2xl"
                                                                >
                                                                    GERAR PIX
                                                                </Button>
                                                                <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                                                    Ao clicar em gerar pix, um código único será criado.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Floating Cart Button (Trigger) */}
                                                    <button
                                                        onClick={() => setIsSummaryOpen(true)}
                                                        className={cn(
                                                            "fixed bottom-8 right-8 z-[90] w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 transition-all duration-500 hover:scale-110 active:scale-95",
                                                            isSummaryOpen && "scale-0 opacity-0 pointer-events-none",
                                                            !showFloatingCart ? "scale-0 opacity-0 translate-y-20" : "scale-100 opacity-100 translate-y-0 animate-pop-in animate-bounce-subtle"
                                                        )}
                                                    >
                                                        <ShoppingCart size={24} />
                                                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg">
                                                            {selectedPassengers.length}
                                                        </span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : paymentStatus === 'success' ? (
                                        <div className="fade-in duration-700 text-center bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-blue-500/5 overflow-hidden">
                                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 py-16 px-8 relative overflow-hidden">
                                                {/* Decorative background elements */}
                                                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                                                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
                                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
                                                </div>

                                                <div className="relative z-10 w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-2xl animate-scale-in">
                                                    <CheckCircle2 size={48} className="text-white" />
                                                </div>
                                                <h2 className="relative z-10 text-4xl font-black text-white mb-2 tracking-tight">Sucesso!</h2>
                                                <p className="relative z-10 text-green-50/80 font-bold uppercase tracking-[0.2em] text-xs">Pagamento Confirmado</p>
                                            </div>

                                            <div className="p-8 sm:p-12">
                                                <div className="max-w-md mx-auto">
                                                    <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                                                        O PIX de <span className="font-black text-gray-900 bg-blue-50 px-2 py-1 rounded-lg">{formatCurrency(totalAmount)}</span> foi processado com segurança.
                                                    </p>

                                                    <div className="space-y-4 mb-10">
                                                        <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:border-blue-200 group">
                                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-200 group-hover:scale-110 transition-transform">
                                                                <CreditCardIcon size={24} />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Passageiros Finalizados</p>
                                                                <div className="flex flex-col gap-1">
                                                                    {selectedPassengers.map(p => (
                                                                        <div key={p.id} className="text-sm font-black text-gray-800 flex items-center gap-2">
                                                                            <div className="w-1 h-1 bg-green-500 rounded-full" />
                                                                            {p.nome_completo}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-6 bg-blue-600/5 rounded-2xl border border-blue-100 flex items-start gap-4 text-left">
                                                            <div className="p-2 bg-blue-600 text-white rounded-lg mt-0.5">
                                                                <AlertCircle size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-blue-900 mb-1">Próximo Passo</p>
                                                                <p className="text-xs text-blue-700/80 leading-relaxed font-bold">
                                                                    Agora você e seus passageiros já podem escolher seus lugares preferidos no mapa do ônibus.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-4">
                                                        <Button
                                                            onClick={() => navigate(`/viagens/${trip?.id}`)}
                                                            className="w-full h-16 text-base font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 bg-gray-900 hover:bg-blue-600 hover:-translate-y-1 active:scale-95 transition-all rounded-2xl"
                                                        >
                                                            ESCOLHER ASSENTOS
                                                        </Button>
                                                        <button
                                                            onClick={() => {
                                                                setPaymentStatus('selection');
                                                                setSelectedPassengers([]);
                                                                setSearchQuery('');
                                                                setSearchResults([]);
                                                                setPixData(null);
                                                                fetchPassageiros();
                                                            }}
                                                            className="w-full py-4 text-xs font-black text-gray-400 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
                                                        >
                                                            Novo Pagamento neste Roteiro
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="fade-in duration-500 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-blue-500/5 overflow-hidden">
                                            <div className="p-8 sm:p-12">
                                                <div className="max-w-md mx-auto">
                                                    <PixPaymentPanel
                                                        pixCode={pixData?.brCode || ""}
                                                        pixAmount={formatCurrency(totalAmount)}
                                                        qrDataUrl={pixData?.qrCodeImage || ""}
                                                        onCopy={() => {
                                                            navigator.clipboard.writeText(pixData?.brCode || "");
                                                            showToast('Código PIX copiado com sucesso!', 'success');
                                                        }}
                                                    />

                                                    <div className="flex items-center justify-center gap-3 py-6 text-blue-600 font-black">
                                                        <div className="relative flex h-3 w-3">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                                                        </div>
                                                        <span className="text-xs uppercase tracking-[0.2em]">Aguardando Pagamento...</span>
                                                    </div>

                                                    <div className="p-8 bg-blue-50/30 rounded-2xl border border-blue-100/50 space-y-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3 ml-2">
                                                                Identificação do Pagador
                                                            </label>
                                                            <div className="relative">
                                                                <Input
                                                                    value={customPayerName}
                                                                    onChange={(e) => setCustomPayerName(e.target.value)}
                                                                    placeholder="Quem está pagando?"
                                                                    className="bg-white border-blue-100 focus:ring-blue-500 rounded-2xl h-14 text-sm pl-6 shadow-sm font-bold"
                                                                />
                                                            </div>
                                                            <p className="text-[10px] text-blue-400 mt-3 ml-2 font-black uppercase tracking-wider opacity-60">
                                                                * Nome que aparecerá no extrato
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                                        <button
                                                            className="w-full py-4 text-xs font-black text-gray-400 uppercase tracking-[0.2em] hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                                                            onClick={() => setPaymentStatus('selection')}
                                                            disabled={isProcessing}
                                                        >
                                                            <X size={14} />
                                                            Cancelar e Voltar
                                                        </button>
                                                    </div>
                                                </div>
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
            {/* Trip Enrollment Modal (Info Modal) */}
            <TripEnrollmentModal
                isOpen={!!paymentModalTrip}
                onClose={() => setPaymentModalTrip(null)}
                trip={paymentModalTrip}
            />
        </div >
    );
};
