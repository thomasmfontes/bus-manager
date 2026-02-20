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
import { calculateAge } from '@/utils/formatters';

export const PassengerList: React.FC = () => {
    const { passengers, fetchPassageiros, createPassageiro, deletePassageiro, deleteAllPassageiros, loading } = usePassengerStore();
    const { showToast } = useToast();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [csvUploaderOpen, setCsvUploaderOpen] = useState(false);

    useEffect(() => {
        // Fetch all passengers (Master List)
        fetchPassageiros();
    }, [fetchPassageiros]);

    const handleDelete = async (passengerId: string, enrollmentId?: string) => {
        try {
            await deletePassageiro(passengerId, enrollmentId);
            showToast(enrollmentId ? 'Inscrição removida com sucesso!' : 'Passageiro excluído com sucesso!', 'success');
            setDeleteId(null);
        } catch (error) {
            showToast('Erro ao excluir', 'error');
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

    const handleCsvImport = async (importedPassengers: any[]) => {
        try {
            for (const p of importedPassengers) {
                await createPassageiro({
                    ...p,
                    idade: p.idade ? parseInt(p.idade) : undefined,
                });
            }
            showToast(`${importedPassengers.length} passageiro(s) importado(s) com sucesso!`, 'success');
            setCsvUploaderOpen(false);
        } catch (error) {
            showToast('Erro ao importar passageiros', 'error');
        }
    };


    const filteredPassengers = passengers.filter(
        (p: any) =>
            p.nome_completo !== 'BLOQUEADO' && (
                p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.cpf_rg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.telefone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.comum_congregacao?.toLowerCase().includes(searchTerm.toLowerCase())
            )
    );

    return (
        <div className="space-y-5 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Users className="text-white" size={20} />
                        </div>
                        Passageiros
                    </h1>
                    <div className="flex items-center gap-2 ml-[52px]">
                        <p className="text-gray-500 text-sm">
                            Cadastro e listagem de clientes e viajantes.
                        </p>
                    </div>
                </div>

                {/* Action Buttons - Premium Layout */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <ProtectedAction requiredPermission="create">
                        <Link
                            to="/passageiros/novo"
                            className="w-full sm:w-auto rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all block"
                        >
                            <Button
                                variant="primary"
                                tabIndex={-1}
                                className="w-full sm:w-auto h-11 px-6 rounded-xl shadow-lg whitespace-nowrap"
                            >
                                <Plus size={20} className="sm:mr-2" />
                                <span className="hidden sm:inline">Novo Passageiro</span>
                                <span className="sm:hidden">Novo</span>
                            </Button>
                        </Link>
                    </ProtectedAction>

                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
                        <ProtectedAction requiredPermission="create">
                            <Button
                                variant="secondary"
                                onClick={() => setCsvUploaderOpen(true)}
                                className="h-11 px-4 sm:px-6 rounded-xl shadow-sm hover:shadow-md transition-all whitespace-nowrap flex-1 sm:flex-none justify-center"
                            >
                                <Upload size={18} className="sm:mr-2" />
                                <span className="hidden sm:inline">Importar CSV</span>
                                <span className="sm:hidden">CSV</span>
                            </Button>
                        </ProtectedAction>

                        {passengers.length > 0 && (
                            <ProtectedAction requiredPermission="delete">
                                <Button
                                    variant="danger"
                                    onClick={() => setShowDeleteAllModal(true)}
                                    className="h-11 px-4 sm:px-6 rounded-xl shadow-lg transition-all whitespace-nowrap flex-1 sm:flex-none justify-center"
                                >
                                    <Trash size={18} className="sm:mr-2" />
                                    <span className="hidden sm:inline">Limpar Lista</span>
                                    <span className="sm:hidden">Limpar</span>
                                </Button>
                            </ProtectedAction>
                        )}
                    </div>
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
                                            <td className="text-gray-600">
                                                {calculateAge(passenger.data_nascimento) || passenger.idade || '-'}
                                            </td>
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        to={`/passageiros/editar/${passenger.id}`}
                                                        className="rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <button
                                                            tabIndex={-1}
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
                                <div key={passenger.id} className="border border-gray-200 rounded-2xl p-4 hover:border-gray-300 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{passenger.nome_completo}</h3>
                                            <p className="text-sm text-gray-500 mt-0.5">{passenger.cpf_rg}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Link
                                                to={`/passageiros/editar/${passenger.id}`}
                                                className="rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <button
                                                    tabIndex={-1}
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
                onConfirm={() => deleteId && handleDelete(deleteId)}
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
