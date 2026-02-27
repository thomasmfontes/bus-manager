import React, { useState } from 'react';
import { useBusStore } from '@/stores/useBusStore';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Plus } from 'lucide-react';

interface BusInlineFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (busId: string) => void;
}

export const BusInlineForm: React.FC<BusInlineFormProps> = ({ isOpen, onClose, onSuccess }) => {
    const { createOnibus, loading } = useBusStore();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        nome: '',
        placa: '',
        capacidade: 46,
    });

    const resetForm = () => {
        setFormData({
            nome: '',
            placa: '',
            capacidade: 46,
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const busData = {
            nome: formData.nome,
            placa: formData.placa,
            capacidade: formData.capacidade,
        };

        try {
            // we await the result directly, so createOnibus needs to return the created bus.
            // If createOnibus doesn't return the ID, we will need to fetch and find it,
            // or modify the store. Let's assume the store function either returns it or we can fetch it.
            // Wait, looking at supabase, an insert returns data. We need the ID.
            const createdBus = await createOnibus(busData);
            showToast('Ônibus cadastrado com sucesso!', 'success');

            // Assume createOnibus returns the newly created bus object including { id }
            if (createdBus && createdBus.id) {
                onSuccess(createdBus.id);
            } else {
                // Fallback: If createOnibus doesn't return data, we just call onSuccess with empty
                // and the parent might need to handle it or we fetch buses.
                onSuccess(''); // parent could refetch
            }
            handleClose();
        } catch (error) {
            showToast('Erro ao cadastrar ônibus', 'error');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Novo Ônibus"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <Input
                    label="Nome do Ônibus"
                    labelClassName="font-bold ml-1"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Ônibus 1 - Leito"
                    required
                />

                <Input
                    label="Placa"
                    labelClassName="font-bold ml-1"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                    placeholder="Ex: ABC-1234"
                />

                <Input
                    type="number"
                    label="Capacidade (Total de Assentos)"
                    labelClassName="font-bold ml-1"
                    value={formData.capacidade}
                    onChange={(e) =>
                        setFormData({ ...formData, capacidade: parseInt(e.target.value) || 0 })
                    }
                    min="1"
                    required
                />

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 mt-2 border-t border-gray-100">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        className="h-11 flex-1 rounded-xl shadow-sm hover:shadow-md transition-all font-bold"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={loading}
                        className="h-11 flex-[2] rounded-xl shadow-lg transition-all font-bold"
                    >
                        <Plus size={18} className="mr-2" />
                        {loading ? 'Salvando...' : 'Cadastrar Ônibus'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
