import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { ArrowLeft, MapPin, Calendar, Bus as BusIcon, Check, X, Unlock, Lock, AlertCircle, ExternalLink, Pencil } from 'lucide-react';
import { SeatStatus, UserRole } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { TripEditModal } from '@/components/viagens/TripEditModal';

export const TripSeatMap: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { trips, fetchViagens } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { passengers, fetchPassageiros } = usePassengerStore();
    const {
        getAssentosPorViagem,
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
    const [tripPassengers, setTripPassengers] = useState<any[]>([]);
    const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

    useEffect(() => {
        fetchViagens();
        fetchOnibus();
        fetchPassageiros();
    }, [fetchViagens, fetchOnibus, fetchPassageiros]);

    const loadAssignments = async () => {
        if (id) {
            try {
                const data = await getAssentosPorViagem(id);
                setTripPassengers(data);
            } catch (error) {
                console.error('Error loading assignments:', error);
                showToast('Erro ao carregar assentos', 'error');
            }
        }
    };

    useEffect(() => {
        loadAssignments();
    }, [id, getAssentosPorViagem]);

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

    // Map passengers to SeatAssignments for the SeatMap component
    // Only show assignments for the currently selected bus AND passengers with seats
    const assignments = tripPassengers
        .filter(p => p.assento) // Only include passengers with assigned seats
        .filter(p => !p.onibus_id || p.onibus_id === currentBus?.id) // Filter by bus if passenger has bus assignment
        .map(p => ({
            viagemId: p.viagem_id,
            onibusId: p.onibus_id || trip?.onibus_id || currentBus?.id || '',
            assentoCodigo: p.assento,
            passageiroId: p.id,
            status: p.nome_completo === 'BLOQUEADO' ? SeatStatus.BLOQUEADO : SeatStatus.OCUPADO
        }));

    const handleSeatClick = (seatCode: string) => {
        setSelectedSeat(seatCode);
        const assignment = assignments.find((a) => a.assentoCodigo === seatCode);

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

        console.log('🚀 Iniciando atribuição:', {
            tripId: id,
            seat: selectedSeat,
            passengerId: selectedPassengerId,
            busId: currentBus.id
        });

        try {
            await atribuirAssento(selectedPassengerId, selectedSeat, id, currentBus.id);

            showToast('Assento atribuído com sucesso!', 'success');
            setModalOpen(false);
            setSelectedSeat(null);
            setSelectedPassengerId('');

            console.log('✅ Recarregando assentos...');
            await loadAssignments(); // Reload assignments
            console.log('✅ Assentos recarregados');
        } catch (error) {
            console.error('❌ Erro ao atribuir:', error);
            showToast('Erro ao atribuir assento', 'error');
        }
    };

    const handleReleaseSeat = async () => {
        if (!selectedSeat) return;

        // Find passenger for this seat
        const passenger = tripPassengers.find(p => p.assento === selectedSeat && (!p.onibus_id || p.onibus_id === currentBus?.id));
        if (!passenger) return;

        try {
            await liberarAssento(passenger.id);
            showToast('Assento liberado com sucesso!', 'success');
            setModalOpen(false);
            setSelectedSeat(null);
            loadAssignments(); // Reload assignments
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
            loadAssignments(); // Reload assignments
        } catch (error) {
            showToast('Erro ao bloquear assento', 'error');
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

    const assignedPassengerIds = tripPassengers
        .filter(p => p.assento) // Only passengers with seats
        .map((p) => p.id);

    const passengerOptions = [
        { value: '', label: '-- Selecione um passageiro --' },
        ...passengers
            .filter((p) => p.nome_completo !== 'BLOQUEADO') // Exclude blocked seat markers
            .filter((p) => !assignedPassengerIds.includes(p.id)) // Filter out already assigned passengers
            .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo))
            .map((p) => ({
                value: p.id,
                label: `${p.nome_completo} (${p.cpf_rg || 'Sem documento'})`,
            })),
    ];

    const currentAssignment = selectedSeat
        ? assignments.find((a) => a.assentoCodigo === selectedSeat)
        : null;

    const currentPassenger = currentAssignment?.passageiroId
        ? tripPassengers.find((p) => p.id === currentAssignment.passageiroId)
        : null;

    if (!trip) {
        return (
            <div className="space-y-6">
                <p className="text-gray-500">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/viagens">
                    <Button variant="secondary">
                        <ArrowLeft size={20} className="mr-2" />
                        Voltar
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-dark">Mapa de Assentos</h1>
            </div>

            {/* Trip info */}
            <Card>
                <div className="relative">
                    {user?.role === UserRole.ADMIN && (
                        <button
                            onClick={() => setEditModalOpen(true)}
                            className="absolute -top-1 -right-1 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                            title="Editar Viagem"
                        >
                            <Pencil size={18} />
                        </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</p>
                                <p className="font-bold text-gray-900">{formatDate(trip.data_ida)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
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
                onSuccess={loadAssignments}
            />

            {/* Bus Selector Tabs */}
            {tripBuses.length > 1 && (
                <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {tripBuses.map((bus) => (
                        <button
                            key={bus.id}
                            onClick={() => setSelectedBusId(bus.id)}
                            className={`
                                px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium whitespace-nowrap transition-colors text-center
                                ${selectedBusId === bus.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}
                            `}
                        >
                            {bus.nome}
                        </button>
                    ))}
                </div>
            )}

            {/* Seat map */}
            {currentBus ? (
                <div className="space-y-4">
                    <SeatMap
                        bus={currentBus}
                        assignments={assignments}
                        passengers={passengers}
                        selectedSeat={selectedSeat}
                        onSeatClick={handleSeatClick}
                    />
                    <SeatLegend />
                </div>
            ) : (
                <Card>
                    <p className="text-gray-500 text-center py-8">Nenhum ônibus vinculado a esta viagem.</p>
                </Card>
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
                                    {passengerOptions.map((option) => (
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
                                        <p className="text-sm text-gray-600 mb-2">Passageiro atual:</p>
                                        <p className="font-semibold">{currentPassenger.nome_completo}</p>
                                        <p className="text-sm text-gray-600">{currentPassenger.cpf_rg}</p>
                                        <p className="text-sm text-gray-600">{currentPassenger.telefone}</p>
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
        </div>
    );
};
