import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { CsvUploader } from '@/components/passengers/CsvUploader';
import { Plus, Edit, Trash2, Search, Upload, Trash, Users } from 'lucide-react';
import { ProtectedAction } from '@/components/ProtectedAction';

export const PassengerList: React.FC = () => {
    const { passengers, fetchPassageiros, createPassageiro, deletePassageiro, deleteAllPassageiros, loading } = usePassengerStore();
    const { showToast } = useToast();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [csvUploaderOpen, setCsvUploaderOpen] = useState(false);

    useEffect(() => {
        fetchPassageiros();
    }, [fetchPassageiros]);

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await deletePassageiro(deleteId);
            showToast('Passageiro excluído com sucesso!', 'success');
            setDeleteId(null);
        } catch (error) {
            showToast('Erro ao excluir passageiro', 'error');
        }
    };

    const handleDeleteAll = async () => {
        try {
            await deleteAllPassageiros();
            showToast('Todos os passageiros foram excluídos!', 'success');
            setShowDeleteAllModal(false);
        } catch (error) {
            showToast('Erro ao excluir passageiros', 'error');
        }
    };

    const handleCsvImport = async (importedPassengers: {
        nome_completo: string;
        cpf_rg: string;
        telefone: string;
        comum_congregacao?: string;
        idade?: string;
        estado_civil?: string;
        instrumento?: string;
        auxiliar?: string;
        pagamento?: string;
    }[]) => {
        try {
            for (const passenger of importedPassengers) {
                await createPassageiro({
                    ...passenger,
                    idade: passenger.idade ? parseInt(passenger.idade) : undefined,
                });
            }
            showToast(`${importedPassengers.length} passageiro(s) importado(s) com sucesso!`, 'success');
            setCsvUploaderOpen(false);
        } catch (error) {
            showToast('Erro ao importar passageiros', 'error');
        }
    };

    // Group by name and doc to show unique identities
    const uniquePassengersMap = new Map();
    passengers
        .sort((a, b) => {
            // Priority 1: Master record (no viagem_id)
            if (a.viagem_id === null && b.viagem_id !== null) return -1;
            if (a.viagem_id !== null && b.viagem_id === null) return 1;
            return 0;
        })
        .forEach(p => {
            const key = `${p.nome_completo.trim().toLowerCase()}-${(p.cpf_rg || '').trim()}`;
            if (!uniquePassengersMap.has(key)) {
                uniquePassengersMap.set(key, p);
            }
        });

    const uniquePassengers = Array.from(uniquePassengersMap.values());

    const filteredPassengers = uniquePassengers.filter(
        (p: any) =>
            p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.cpf_rg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.telefone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.comum_congregacao?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-5 w-full">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="text-blue-600" size={32} />
                        Passageiros
                    </h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">Gerencie os passageiros cadastrados</p>
                </div>

                {/* Action Buttons - Horizontal Layout */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <ProtectedAction requiredPermission="create">
                        <Link to="/passageiros/novo">
                            <Button size="sm" className="whitespace-nowrap">
                                <Plus size={18} className="sm:mr-1.5" />
                                <span className="hidden sm:inline">Novo</span>
                            </Button>
                        </Link>
                    </ProtectedAction>

                    <ProtectedAction requiredPermission="create">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setCsvUploaderOpen(true)}
                            className="whitespace-nowrap"
                        >
                            <Upload size={18} className="sm:mr-1.5" />
                            <span className="hidden sm:inline">CSV</span>
                        </Button>
                    </ProtectedAction>



                    {passengers.length > 0 && (
                        <ProtectedAction requiredPermission="delete">
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setShowDeleteAllModal(true)}
                                className="whitespace-nowrap ml-auto"
                            >
                                <Trash size={18} className="sm:mr-1.5" />
                                <span className="hidden sm:inline">Limpar</span>
                            </Button>
                        </ProtectedAction>
                    )}
                </div>
            </div>

            <Card className="w-full">
                {/* Search Bar */}
                {passengers.length > 0 && (
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome, documento ou telefone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth"
                            />
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                        <p className="text-gray-500 mt-3">Carregando...</p>
                    </div>
                ) : filteredPassengers.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">
                            {searchTerm ? 'Nenhum passageiro encontrado' : 'Nenhum passageiro cadastrado'}
                        </p>
                        {!searchTerm && (
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link to="/passageiros/novo">
                                    <Button>Cadastrar Primeiro Passageiro</Button>
                                </Link>
                                <Button variant="secondary" onClick={() => setCsvUploaderOpen(true)}>
                                    <Upload size={18} />
                                    Importar CSV
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="table-base w-full">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Documento</th>
                                        <th>Telefone</th>
                                        <th>Congregação</th>
                                        <th>Idade</th>
                                        <th className="text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPassengers.map((passenger) => (
                                        <tr key={passenger.id}>
                                            <td className="font-medium text-gray-900">
                                                <div>{passenger.nome_completo}</div>
                                                {(passenger.instrumento || passenger.auxiliar) && (
                                                    <div className="text-xs text-gray-500">
                                                        {passenger.instrumento && `🎵 ${passenger.instrumento}`}
                                                        {passenger.instrumento && passenger.auxiliar && ' • '}
                                                        {passenger.auxiliar && `🤝 ${passenger.auxiliar}`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-gray-600">{passenger.cpf_rg}</td>
                                            <td className="text-gray-600">{passenger.telefone}</td>
                                            <td className="text-gray-600">{passenger.comum_congregacao || '-'}</td>
                                            <td className="text-gray-600">{passenger.idade || '-'}</td>
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    <Link to={`/passageiros/editar/${passenger.id}`}>
                                                        <button
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteId(passenger.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {filteredPassengers.map((passenger) => (
                                <div key={passenger.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{passenger.nome_completo}</h3>
                                            <p className="text-sm text-gray-500 mt-0.5">{passenger.cpf_rg}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Link to={`/passageiros/editar/${passenger.id}`}>
                                                <button
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(passenger.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-500">Telefone: </span>
                                        <span className="text-gray-900 font-medium">{passenger.telefone}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este passageiro? Esta ação não pode ser desfeita."
            />

            <ConfirmModal
                isOpen={showDeleteAllModal}
                onClose={() => setShowDeleteAllModal(false)}
                onConfirm={handleDeleteAll}
                title="Confirmar Exclusão em Massa"
                message={`Tem certeza que deseja excluir TODOS os ${passengers.length} passageiros? Esta ação não pode ser desfeita e removerá permanentemente todos os registros.`}
            />

            <CsvUploader
                isOpen={csvUploaderOpen}
                onClose={() => setCsvUploaderOpen(false)}
                onImport={handleCsvImport}
            />
        </div>
    );
};
