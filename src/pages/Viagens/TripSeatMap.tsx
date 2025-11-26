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
import { ArrowLeft, MapPin, Calendar, Bus as BusIcon, Check, X, Lock, Unlock } from 'lucide-react';
import { SeatStatus, UserRole } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';

export const TripSeatMap: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { trips, fetchViagens } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { passengers, fetchPassageiros } = usePassengerStore();
    const {
        assignments,
        fetchAssentosPorViagem,
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
    const [selectedBusId, setSelectedBusId] = useState<string>('');

    useEffect(() => {
        fetchViagens();
        fetchOnibus();
        fetchPassageiros();
        if (id) {
            fetchAssentosPorViagem(id);
        }
    }, [id, fetchViagens, fetchOnibus, fetchPassageiros, fetchAssentosPorViagem]);

    const trip = trips.find((t) => t.id === id);

    // Get all buses for this trip
    const tripBuses = trip && trip.onibusIds
        ? buses.filter(b => trip.onibusIds.includes(b.id))
        : [];

    // Initialize selected bus
    useEffect(() => {
        if (tripBuses.length > 0 && !selectedBusId) {
            setSelectedBusId(tripBuses[0].id);
        }
    }, [tripBuses, selectedBusId]);

    const currentBus = tripBuses.find(b => b.id === selectedBusId);

    // Filter assignments for current trip AND current bus
    const tripAssignments = id
        ? assignments.filter((a) => a.viagemId === id && a.onibusId === selectedBusId)
        : [];

    const handleSeatClick = (seatCode: string) => {
        setSelectedSeat(seatCode);
        const assignment = tripAssignments.find((a) => a.assentoCodigo === seatCode);

        if (!assignment || assignment.status === SeatStatus.LIVRE) {
            setActionType('assign');
            setSelectedPassengerId('');
            setModalOpen(true);
        } else if (assignment.status === SeatStatus.OCUPADO) {
            setActionType('release');
            setModalOpen(true);
        } else if (assignment.status === SeatStatus.BLOQUEADO) {
            setActionType('release');
            setModalOpen(true);
        }
    };

    const handleAssignSeat = async () => {
        if (!id || !selectedSeat || !selectedPassengerId || !selectedBusId) {
            showToast('Selecione um passageiro', 'error');
            return;
        }

        try {
            await atribuirAssento(id, selectedBusId, selectedSeat, selectedPassengerId);
            showToast('Assento atribuído com sucesso!', 'success');
            setModalOpen(false);
            setSelectedSeat(null);
            setSelectedPassengerId('');
        } catch (error) {
            showToast('Erro ao atribuir assento', 'error');
        }
    };

    const handleReleaseSeat = async () => {
        if (!id || !selectedSeat || !selectedBusId) return;

        try {
            await liberarAssento(id, selectedBusId, selectedSeat);
            showToast('Assento liberado com sucesso!', 'success');
            setModalOpen(false);
            setSelectedSeat(null);
        } catch (error) {
            showToast('Erro ao liberar assento', 'error');
        }
    };

    const handleBlockSeat = async () => {
        if (!id || !selectedSeat || !selectedBusId) return;

        try {
            await bloquearAssento(id, selectedBusId, selectedSeat);
            showToast('Assento bloqueado com sucesso!', 'success');
            setModalOpen(false);
            setSelectedSeat(null);
        } catch (error) {
            showToast('Erro ao bloquear assento', 'error');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get all assignments for the current trip (across all buses) to check for duplicates
    const allTripAssignments = id
        ? assignments.filter((a) => a.viagemId === id)
        : [];

    const assignedPassengerIds = allTripAssignments
        .filter((a) => a.status === SeatStatus.OCUPADO && a.passageiroId)
        .map((a) => a.passageiroId);

    const passengerOptions = [
        { value: '', label: '-- Selecione um passageiro --' },
        ...passengers
            .filter((p) => !assignedPassengerIds.includes(p.id)) // Filter out already assigned passengers
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map((p) => ({
                value: p.id,
                label: `${p.nome} (${p.documento})`,
            })),
    ];

    const currentAssignment = selectedSeat
        ? tripAssignments.find((a) => a.assentoCodigo === selectedSeat)
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
                                {trip.origem} → {trip.destino}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="text-primary" size={24} />
                        <div>
                            <p className="text-sm text-gray-600">Data/Hora</p>
                            <p className="font-semibold">{formatDate(trip.data)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <BusIcon className="text-primary" size={24} />
                        <div>
                            <p className="text-sm text-gray-600">Ônibus</p>
                            <p className="font-semibold">
                                {tripBuses.length > 1
                                    ? `${tripBuses.length} ônibus nesta viagem`
                                    : tripBuses[0]?.nome || 'Nenhum ônibus'}
                            </p>
                        </div>
                    </div>
                </div>
                {trip.descricao && (
                    <p className="mt-4 text-gray-600">{trip.descricao}</p>
                )}
            </Card>

            {/* Bus Tabs */}
            {tripBuses.length > 1 && (
                <div className="flex flex-col items-center space-y-3 mb-6">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Selecione o Ônibus</p>
                    <div className="bg-gray-100/80 p-1.5 rounded-xl inline-flex gap-2 shadow-inner border border-gray-200/50">
                        {tripBuses.map(bus => {
                            const isActive = selectedBusId === bus.id;
                            return (
                                <button
                                    key={bus.id}
                                    onClick={() => setSelectedBusId(bus.id)}
                                    className={`
                                        flex items-center gap-2.5 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ease-out
                                        ${isActive
                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5 scale-100'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                        }
                                    `}
                                >
                                    <BusIcon size={18} className={isActive ? 'text-blue-500' : 'text-gray-400'} />
                                    <div className="flex flex-col items-start leading-none gap-0.5">
                                        <span className="text-sm">{bus.nome}</span>
                                        <span className={`text-[10px] ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>{bus.placa}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Seat map */}
            {currentBus ? (
                <div className="space-y-4">
                    <SeatMap
                        bus={currentBus}
                        assignments={tripAssignments}
                        passengers={passengers}
                        selectedSeat={selectedSeat}
                        onSeatClick={handleSeatClick}
                    />
                    <SeatLegend />
                </div>
            ) : (
                <Card>
                    <p className="text-gray-500 text-center py-8">Selecione um ônibus para ver o mapa de assentos.</p>
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
                        {/* Visualizador: no action buttons */}
                        {user?.role === UserRole.VISUALIZADOR && (
                            <p className="text-sm text-gray-500">Você não tem permissão para modificar assentos</p>
                        )}
                        {/* Passageiro: only assign button */}
                        {user?.role === UserRole.PASSAGEIRO && actionType === 'assign' && (
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
                                        <Button variant="danger" onClick={handleBlockSeat}>
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
                    </div>
                ) : (
                    <div className="space-y-4">
                        {currentPassenger && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Passageiro atual:</p>
                                <p className="font-semibold">{currentPassenger.nome}</p>
                                <p className="text-sm text-gray-600">{currentPassenger.documento}</p>
                                <p className="text-sm text-gray-600">{currentPassenger.telefone}</p>
                            </div>
                        )}
                        {currentAssignment?.status === SeatStatus.BLOQUEADO && (
                            <p className="text-gray-600">Este assento está bloqueado.</p>
                        )}
                        <p className="text-gray-600">Deseja liberar este assento?</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};
