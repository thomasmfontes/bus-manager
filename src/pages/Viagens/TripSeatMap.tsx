import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { useSeatAssignmentStore } from '@/stores/useSeatAssignmentStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SeatMap } from '@/components/seating/SeatMap';
import { SeatLegend } from '@/components/seating/SeatLegend';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, MapPin, Calendar, Bus as BusIcon, Check, X, Unlock, Lock, AlertCircle, ExternalLink, Pencil, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SeatStatus, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { TripEditModal } from '@/components/viagens/TripEditModal';
import { TripParticipantsList } from '@/components/viagens/TripParticipantsList';
import { FaWhatsapp } from 'react-icons/fa';

export const TripSeatMap: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { trips, fetchViagens } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { passengers, enrollments, fetchPassageiros } = usePassengerStore();
    const {
        atribuirAssento,
        liberarAssento,
        bloquearAssento,
    } = useSeatAssignmentStore();
    const { showToast } = useToast();
    const { user } = useAuthStore();

    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedPassengerId, setSelectedPassengerId] = useState('');
    const [actionType, setActionType] = useState<'assign' | 'release' | 'block'>('assign');
    const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'map' | 'participants'>('map');

    useEffect(() => {
        if (id) {
            console.log('🔄 Carregando dados para a viagem:', id);
            fetchViagens();
            fetchOnibus();
            fetchPassageiros(); // Global fetch to allow admins to see all possible passengers
        }
    }, [id, fetchViagens, fetchOnibus, fetchPassageiros]);

    const trip = trips.find((t) => t.id === id);

    // Get all buses associated with the trip
    const tripBuses = trip?.onibus_ids
        ? buses.filter(b => trip.onibus_ids?.includes(b.id))
        : trip?.onibus_id
            ? buses.filter(b => b.id === trip.onibus_id)
            : [];

    // Set initial selected bus
    useEffect(() => {
        if (tripBuses.length > 0 && !selectedBusId) {
            setSelectedBusId(tripBuses[0].id);
        }
    }, [tripBuses, selectedBusId]);

    const currentBus = tripBuses.find(b => b.id === selectedBusId) || tripBuses[0] || null;

    // Identify the "BLOQUEADO" identity ID
    const blockedIdentityId = useMemo(() => {
        return passengers.find(p => p.nome_completo === 'BLOQUEADO')?.id;
    }, [passengers]);

    // Map global enrollments to SeatAssignments for the SeatMap component
    const assignments = useMemo(() => {
        if (!id || !currentBus) return [];

        const targetTripId = id.trim().toLowerCase();
        const targetBusId = currentBus.id.trim().toLowerCase();
        const blockedId = blockedIdentityId?.trim().toLowerCase();

        return enrollments
            .filter(e => {
                // Robust Trip ID check
                const eTripId = (e.viagem_id || '').toString().trim().toLowerCase();
                if (eTripId !== targetTripId) return false;

                // Must have a seat
                if (!e.assento) return false;

                // Robust Bus ID check (matches if same bus or if no bus specified)
                const eBusId = (e.onibus_id || '').toString().trim().toLowerCase();
                return !eBusId || eBusId === targetBusId;
            })
            .map(e => {
                const pId = (e.passageiro_id || '').toString().trim().toLowerCase();
                const isBlocked = blockedId && pId === blockedId;

                return {
                    viagemId: e.viagem_id,
                    onibusId: e.onibus_id || currentBus.id,
                    assentoCodigo: String(e.assento),
                    passageiroId: e.passageiro_id,
                    status: isBlocked ? SeatStatus.BLOQUEADO : SeatStatus.OCUPADO
                };
            });
    }, [enrollments, id, currentBus, blockedIdentityId]);

    const handleSeatClick = (seatCode: string) => {
        setSelectedSeat(seatCode);
        const seatStr = String(seatCode);
        const assignment = assignments.find((a) => String(a.assentoCodigo) === seatStr);

        if (!assignment) {
            // Empty seat - show assign or block options
            setActionType('assign');
            setSelectedPassengerId('');
            setModalOpen(true);
        } else {
            // Assigned seat - show release option
            setActionType('release');
            setModalOpen(true);
        }
    };

    const handleAssignSeat = async () => {
        if (!id || !selectedSeat || !selectedPassengerId || !currentBus) {
            showToast('Selecione um passageiro e um ônibus', 'error');
            return;
        }

        const passenger = passengers.find(p => p.id === selectedPassengerId);
        const hasPaid = passenger?.enrollment?.pagamento === 'Pago' || passenger?.enrollment?.pagamento === 'Realizado';
        if (user?.role !== UserRole.ADMIN && passenger && !hasPaid) {
            showToast('Apenas passageiros com pagamento CONFIRMADO podem reservar assento', 'warning');
            return;
        }

        console.log('🚀 Enviando para atribuirAssento:', {
            passengerId: selectedPassengerId,
            seat: selectedSeat,
            tripId: id,
            busId: currentBus.id
        });

        try {
            console.log('✅ UI: Seat assigned, refreshing UI state...');
            await atribuirAssento(selectedPassengerId, selectedSeat, id, currentBus.id);
            await fetchPassageiros(id);
            showToast('Assento atribuído com sucesso!', 'success');
            setModalOpen(false);
            setSelectedSeat(null);
            setSelectedPassengerId('');
        } catch (error) {
            showToast('Erro ao atribuir assento', 'error');
        }
    };

    const handleReleaseSeat = async () => {
        if (!selectedSeat || !id) return;

        const seatStr = String(selectedSeat);
        // Find enrollment for this seat in this trip and bus
        const enrollment = enrollments.find(e =>
            e.viagem_id?.toLowerCase() === id.toLowerCase() &&
            String(e.assento) === seatStr &&
            (!e.onibus_id || e.onibus_id.toLowerCase() === currentBus?.id.toLowerCase())
        );
        if (!enrollment) return;

        try {
            await liberarAssento(enrollment.passageiro_id, enrollment.id);
            showToast('Assento liberado com sucesso!', 'success');
            setModalOpen(false);
            setSelectedSeat(null);
            await fetchPassageiros(id);
        } catch (error) {
            showToast('Erro ao liberar assento', 'error');
        }
    };

    const handleBlockSeat = async () => {
        if (!id || !selectedSeat || !currentBus) {
            showToast('Selecione um assento e um ônibus', 'error');
            return;
        }

        try {
            await bloquearAssento(selectedSeat, id, currentBus.id);
            showToast('Assento bloqueado com sucesso!', 'success');
            setModalOpen(false);
            setSelectedSeat(null);
            await fetchPassageiros(id);
        } catch (error) {
            showToast('Erro ao bloquear assento', 'error');
        }
    };



    const [removeConfirmModal, setRemoveConfirmModal] = useState<{
        isOpen: boolean;
        passengerId: string;
        enrollmentId: string;
        passengerName: string;
    }>({
        isOpen: false,
        passengerId: '',
        enrollmentId: '',
        passengerName: ''
    });

    const handleRemoveEnrollment = async (passengerId: string, enrollmentId: string, passengerName?: string) => {
        // Find the passenger name if not explicitly passed
        const name = passengerName || passengers.find(p => p.id === passengerId)?.nome_completo || 'este passageiro';
        setRemoveConfirmModal({
            isOpen: true,
            passengerId,
            enrollmentId,
            passengerName: name
        });
    };

    const confirmRemoval = async () => {
        const { enrollmentId } = removeConfirmModal;
        if (!enrollmentId) return;

        try {
            // Soft delete: keep the enrollment for financial logs, but mark as "DESISTENTE" in the seat
            const { error, data } = await supabase
                .from('viagem_passageiros')
                .update({ assento: 'DESISTENTE', onibus_id: null })
                .eq('id', enrollmentId)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error(`Nenhuma alteração foi feita. Inscrição ID: ${enrollmentId} não encontrada ou sem permissão.`);
            }

            showToast('Passageiro removido da lista!', 'success');
            await fetchPassageiros(id);
        } catch (error: any) {
            console.error('Error removing passenger:', error);
            showToast(error.message || 'Erro ao remover inscrição', 'error');
        } finally {
            setRemoveConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Filter passengers by trip, payment status, and payer relationship
    const passengerOptions = useMemo(() => {
        const clean = (s: string) => s.replace(/\D/g, '');

        // 1. Group by identity (Name + CPF)
        const identityMap = new Map<string, any>();
        passengers.forEach(p => {
            // Skip the special 'BLOQUEADO' identity for selection
            if (p.nome_completo === 'BLOQUEADO') return;

            const key = `${p.nome_completo.toLowerCase().trim()}-${clean(p.cpf_rg || '')}`;
            const existing = identityMap.get(key);

            // Find enrollment for THIS trip in the global list
            const currentTripEnroll = (enrollments || []).find(e =>
                e.passageiro_id === p.id &&
                e.viagem_id?.toLowerCase() === id?.toLowerCase()
            );

            // Priority: if they have an enrollment for THIS trip, that's the version we want
            if (currentTripEnroll) {
                identityMap.set(key, { ...p, enrollment: currentTripEnroll });
            }
            // Otherwise, keep the first one we find (master or other trip) as a baseline
            else if (!existing) {
                identityMap.set(key, p);
            }
        });

        const filtered = Array.from(identityMap.values())
            .filter(p => {
                const enrollment = p.enrollment;

                // Not already assigned to a seat in this trip
                if (enrollment?.viagem_id?.toLowerCase() === id?.toLowerCase() && enrollment?.assento) return false;

                // Admin can see all passengers 
                if (user?.role === UserRole.ADMIN) return true;

                // For regular users:
                // Must be in this trip
                if (enrollment?.viagem_id?.toLowerCase() !== id?.toLowerCase()) return false;
                // Must have paid
                const hasPaid = enrollment?.pagamento === 'Pago' || enrollment?.pagamento === 'Realizado';
                if (!hasPaid) return false;

                const userDoc = user?.email ? clean(user.email) : '';
                const passengerDoc = p.cpf_rg ? clean(p.cpf_rg) : '';

                // Only themselves or people they paid for
                const isMe = p.id === user?.id || (userDoc && userDoc === passengerDoc);
                const iPaidForThem = user?.id && enrollment?.pago_por === user.id;

                return isMe || iPaidForThem;
            })
            .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));

        return [
            { value: '', label: '-- Selecione um passageiro --' },
            ...filtered.map((p) => ({
                value: p.id,
                label: `${p.nome_completo} (${p.cpf_rg || 'Sem documento'})`,
            })),
        ];
    }, [passengers, enrollments, id, user]);

    const currentAssignment = selectedSeat
        ? assignments.find((a) => a.assentoCodigo === selectedSeat)
        : null;

    const currentPassenger = currentAssignment?.passageiroId
        ? passengers.find((p) => p.id === currentAssignment.passageiroId)
        : null;

    if (!trip) {
        return (
            <div className="space-y-6">
                <p className="text-gray-500">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full text-gray-900">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/viagens')}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm group"
                    aria-label="Voltar"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                        Mapa de Assentos
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Visualize e gerencie a ocupação dos ônibus para esta viagem
                    </p>
                </div>
            </div>

            {/* Trip info */}
            <Card>
                <div className="relative">
                    {user?.role === UserRole.ADMIN && (
                        <button
                            onClick={() => setEditModalOpen(true)}
                            className="absolute bottom-[-10px] right-[-10px] md:bottom-auto md:top-[-4px] md:right-[-4px] p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all bg-white/80 md:bg-transparent shadow-sm md:shadow-none border border-gray-100 md:border-transparent"
                            title="Editar Viagem"
                        >
                            <Pencil size={18} />
                        </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                                <MapPin size={24} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rota</p>
                                <p className="font-bold text-gray-900 truncate">
                                    {trip.nome} → {trip.destino}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                                <Calendar size={24} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Partida</span>
                                        <span className="font-bold text-gray-900 leading-tight">{formatDate(trip.data_ida)}</span>
                                    </div>
                                    {trip.data_volta && (
                                        <div className="flex flex-col sm:border-l sm:border-gray-200 sm:pl-4">
                                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Retorno</span>
                                            <span className="font-bold text-gray-900 leading-tight">{formatDate(trip.data_volta)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
                            <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600">
                                <BusIcon size={24} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ônibus</p>
                                <p className="font-bold text-gray-900">
                                    {tripBuses.length > 0
                                        ? `${tripBuses.length} ônibus vinculado(s)`
                                        : 'Nenhum ônibus'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <TripEditModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                trip={trip}
                onSuccess={() => id && fetchPassageiros(id)}
            />

            {/* Tabs Selector */}
            {user?.role === UserRole.ADMIN && (
                <div className="flex bg-gray-100 p-1 rounded-2xl w-full sm:w-fit mx-auto sm:mx-0">
                    <button
                        onClick={() => setActiveTab('map')}
                        className={cn(
                            "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'map' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <BusIcon size={18} />
                        Mapa
                    </button>
                    <button
                        onClick={() => setActiveTab('participants')}
                        className={cn(
                            "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'participants' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Users size={18} />
                        Passageiros
                    </button>
                </div>
            )}

            {/* Content based on Tab */}
            {activeTab === 'map' ? (
                <>
                    {/* Seat map using the new fused header selector */}
                    {currentBus ? (
                        <div className="space-y-4">
                            <SeatMap
                                bus={currentBus}
                                allBuses={tripBuses}
                                selectedBusId={selectedBusId ?? undefined}
                                onBusSelect={setSelectedBusId}
                                assignments={assignments}
                                passengers={passengers}
                                selectedSeat={selectedSeat}
                                onSeatClick={handleSeatClick}
                            />
                            <SeatLegend />
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                            <BusIcon className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-gray-500">Nenhum ônibus selecionado ou disponível.</p>
                        </div>
                    )}
                </>
            ) : (
                <TripParticipantsList
                    trip={trip}
                    passengers={passengers}
                    enrollments={enrollments}
                    onDeleteEnrollment={handleRemoveEnrollment}
                />
            )}

            {/* Seat action modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedSeat(null);
                }}
                title={`Assento ${selectedSeat} - ${currentBus?.nome}`}
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setModalOpen(false);
                                setSelectedSeat(null);
                            }}
                        >
                            <X size={20} className="sm:mr-2" />
                            <span className="hidden sm:inline">Cancelar</span>
                        </Button>
                        {/* Registration link for non-registered users */}
                        {user?.role === UserRole.PASSAGEIRO && !user.id && (
                            <a
                                href="https://excursao-agua-rasa.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <ExternalLink size={16} className="mr-2" />
                                Fazer Cadastro
                            </a>
                        )}
                        {/* Passageiro: only assign button */}
                        {user?.role === UserRole.PASSAGEIRO && user.id && actionType === 'assign' && (
                            <Button onClick={handleAssignSeat}>
                                <Check size={20} className="sm:mr-2" />
                                <span className="hidden sm:inline">Atribuir</span>
                            </Button>
                        )}
                        {/* Admin: all buttons */}
                        {user?.role === UserRole.ADMIN && (
                            <>
                                {actionType === 'assign' && (
                                    <>
                                        <Button onClick={handleAssignSeat}>
                                            <Check size={20} className="sm:mr-2" />
                                            <span className="hidden sm:inline">Atribuir</span>
                                        </Button>
                                        <Button variant="secondary" onClick={handleBlockSeat}>
                                            <Lock size={20} className="sm:mr-2" />
                                            <span className="hidden sm:inline">Bloquear</span>
                                        </Button>
                                    </>
                                )}
                                {actionType === 'release' && (
                                    <Button variant="danger" onClick={handleReleaseSeat}>
                                        <Unlock size={20} className="sm:mr-2" />
                                        <span className="hidden sm:inline">Liberar</span>
                                    </Button>
                                )}
                            </>
                        )}
                    </>
                }
            >
                {actionType === 'assign' ? (
                    <div className="space-y-4">
                        {user?.role === UserRole.PASSAGEIRO && !user.id ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-yellow-800">
                                    Você não tem permissão para modificar assentos. Cadastre-se para poder reservar.
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600">Selecione um passageiro para este assento:</p>
                                <select
                                    value={selectedPassengerId}
                                    onChange={(e) => setSelectedPassengerId(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    {passengerOptions.map((option: any) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {currentPassenger && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                {currentPassenger.nome_completo === 'BLOQUEADO' ? (
                                    <>
                                        <p className="text-sm text-gray-600 mb-2">Status:</p>
                                        <div className="flex items-center gap-2">
                                            <Lock size={20} className="text-gray-600" />
                                            <p className="font-semibold text-gray-900">Assento Bloqueado</p>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Este assento foi bloqueado administrativamente e não está disponível para atribuição.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">{currentPassenger.nome_completo}</p>
                                                <p className="text-sm text-gray-600">{currentPassenger.cpf_rg}</p>
                                                <p className="text-sm text-gray-600">{currentPassenger.telefone}</p>
                                            </div>
                                            {currentPassenger.telefone && (
                                                <a
                                                    href={`https://wa.me/55${currentPassenger.telefone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center w-11 h-11 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm"
                                                    title="Chamar no WhatsApp"
                                                >
                                                    <FaWhatsapp size={24} />
                                                </a>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {user?.role === UserRole.PASSAGEIRO && !user.id ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-yellow-800">
                                    Você não tem permissão para modificar assentos.
                                </p>
                            </div>
                        ) : user?.role === UserRole.ADMIN ? (
                            currentPassenger?.nome_completo !== 'BLOQUEADO' ? (
                                <p className="text-gray-600">Deseja liberar este assento?</p>
                            ) : (
                                <p className="text-gray-600">Deseja desbloquear este assento?</p>
                            )
                        ) : null}
                    </div>
                )}
            </Modal>

            {/* Removal Confirmation Modal */}
            <Modal
                isOpen={removeConfirmModal.isOpen}
                onClose={() => setRemoveConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title="Remover Passageiro"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setRemoveConfirmModal(prev => ({ ...prev, isOpen: false }))}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmRemoval}
                        >
                            Remover
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={24} />
                        <div>
                            <h4 className="text-red-800 font-bold mb-1">Confirmação de Remoção</h4>
                            <p className="text-sm text-red-700">
                                Tem certeza que deseja remover <strong>{removeConfirmModal.passengerName}</strong> desta viagem?
                            </p>
                            <p className="text-xs text-red-600 mt-2">
                                Esta pessoa deixará de aparecer na lista de passageiros e assentos, mas os pagamentos realizados continuarão salvos no Extrato e no Financeiro.
                            </p>
                        </div>
                    </div>
                </div>
            </Modal >
        </div>
    );
};
