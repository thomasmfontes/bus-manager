import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBusStore } from '@/stores/useBusStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export const BusForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { buses, createOnibus, updateOnibus, fetchOnibus } = useBusStore();
    const { showToast } = useToast();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        nome: '',
        placa: '',
        rows: 10,
        columns: 4,
        corridorAfterColumn: 2,
    });

    useEffect(() => {
        if (isEditing) {
            fetchOnibus();
        }
    }, [isEditing, fetchOnibus]);

    useEffect(() => {
        if (isEditing && id) {
            const bus = buses.find((b) => b.id === id);
            if (bus) {
                setFormData({
                    nome: bus.nome,
                    placa: bus.placa,
                    rows: bus.configuracaoAssentos.rows,
                    columns: bus.configuracaoAssentos.columns,
                    corridorAfterColumn: bus.configuracaoAssentos.corridorAfterColumn || 0,
                });
            }
        }
    }, [isEditing, id, buses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const totalAssentos = formData.rows * formData.columns;
        const busData = {
            nome: formData.nome,
            placa: formData.placa,
            configuracaoAssentos: {
                rows: formData.rows,
                columns: formData.columns,
                corridorAfterColumn: formData.corridorAfterColumn,
            },
            totalAssentos,
        };

        try {
            if (isEditing && id) {
                await updateOnibus(id, busData);
                showToast('Ônibus atualizado com sucesso!', 'success');
            } else {
                await createOnibus(busData);
                showToast('Ônibus cadastrado com sucesso!', 'success');
            }
            navigate('/onibus');
        } catch (error) {
            showToast(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} ônibus`, 'error');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-dark">
                {isEditing ? 'Editar Ônibus' : 'Novo Ônibus'}
            </h1>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nome do Ônibus"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Ônibus 1 - Leito"
                        required
                    />

                    <Input
                        label="Placa"
                        value={formData.placa}
                        onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                        placeholder="Ex: ABC-1234"
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            type="number"
                            label="Número de Linhas"
                            value={formData.rows}
                            onChange={(e) =>
                                setFormData({ ...formData, rows: parseInt(e.target.value) || 0 })
                            }
                            min="1"
                            required
                        />

                        <Input
                            type="number"
                            label="Número de Colunas"
                            value={formData.columns}
                            onChange={(e) =>
                                setFormData({ ...formData, columns: parseInt(e.target.value) || 0 })
                            }
                            min="1"
                            required
                        />

                        <Input
                            type="number"
                            label="Corredor após Coluna"
                            value={formData.corridorAfterColumn}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    corridorAfterColumn: parseInt(e.target.value) || 0,
                                })
                            }
                            min="0"
                        />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                            Total de assentos: <span className="font-semibold">{formData.rows * formData.columns}</span>
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit">{isEditing ? 'Atualizar' : 'Salvar'}</Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/onibus')}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
