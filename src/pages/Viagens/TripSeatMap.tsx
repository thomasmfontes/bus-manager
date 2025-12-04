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
import { ArrowLeft, MapPin, Calendar, Bus as BusIcon, Check, X, Unlock, Lock, AlertCircle, ExternalLink } from 'lucide-react';
import { SeatStatus, UserRole } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';

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
            status: SeatStatus.OCUPADO
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

        try {
            await atribuirAssento(selectedPassengerId, selectedSeat, currentBus.id);

            showToast('Assento atribuído com sucesso!', 'success');
            setModalOpen(false);
            setSelectedSeat(null);
            setSelectedPassengerId('');
            loadAssignments(); // Reload assignments
        } catch (error) {
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

    const assignedPassengerIds = tripPassengers.map((p) => p.id);

    const passengerOptions = [
        { value: '', label: '-- Selecione um passageiro --' },
        ...passengers
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                        <MapPin className="text-primary" size={24} />
                        <div>
                            <p className="text-sm text-gray-600">Rota</p>
                            <p className="font-semibold">
                                {trip.nome} → {trip.destino}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="text-primary" size={24} />
                        <div>
                            <p className="text-sm text-gray-600">Data/Hora</p>
                            <p className="font-semibold">{formatDate(trip.data_ida)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <BusIcon className="text-primary" size={24} />
                        <div>
                            <p className="text-sm text-gray-600">Ônibus</p>
                            <p className="font-semibold">
                                {tripBuses.length > 0
                                    ? `${tripBuses.length} ônibus vinculado(s)`
                                    : 'Nenhum ônibus'}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Bus Selector Tabs */}
            {tripBuses.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {tripBuses.map((bus) => (
                        <button
                            key={bus.id}
                            onClick={() => setSelectedBusId(bus.id)}
                            className={`
                                px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors
                                ${selectedBusId === bus.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}
                            `}
                        >
                            {bus.nome}
                            <span className="ml-2 text-xs opacity-80">({bus.placa})</span>
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
                        {/* Visualizador: registration link */}
                        {user?.role === UserRole.USER && !user.id && (
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
                        {user?.role === UserRole.USER && user.id && actionType === 'assign' && (
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
                        {user?.role === UserRole.USER && !user.id ? (
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
                                <p className="text-sm text-gray-600 mb-2">Passageiro atual:</p>
                                <p className="font-semibold">{currentPassenger.nome_completo}</p>
                                <p className="text-sm text-gray-600">{currentPassenger.cpf_rg}</p>
                                <p className="text-sm text-gray-600">{currentPassenger.telefone}</p>
                            </div>
                        )}

                        {user?.role === UserRole.USER && !user.id ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-yellow-800">
                                    Você não tem permissão para modificar assentos.
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-600">Deseja liberar este assento?</p>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
