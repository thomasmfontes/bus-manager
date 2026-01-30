import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BusMultiSelect } from '@/components/ui/BusMultiSelect';
import { useToast } from '@/components/ui/Toast';
import { Save, X, Plus, AlertCircle, CreditCard, Key, User } from 'lucide-react';

export const TripForm: React.FC = () => {
    const navigate = useNavigate();
    const { createViagem, trips, loading } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        nome: '',
        destino: '',
        data_ida: '',
        data_volta: '',
        preco: '' as string | number,
        onibus_ids: [] as string[],
        origem_endereco: '',
        destino_endereco: '',
        meta_financeira: '' as string | number,
        pagamento_gateway: 'manual' as 'off' | 'asaas' | 'mp' | 'manual',
        chave_pix: '',
        titular_pix: '',
        gateway_api_key: '',
    });

    useEffect(() => {
        fetchOnibus();
    }, [fetchOnibus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.onibus_ids || formData.onibus_ids.length === 0) {
            showToast('Selecione pelo menos um ônibus', 'error');
            return;
        }

        if (!formData.data_ida) {
            showToast('Informe a data de ida', 'error');
            return;
        }

        const preco = typeof formData.preco === 'string' ? parseFloat(formData.preco) : formData.preco;

        if (isNaN(preco) || preco <= 0) {
            showToast('Informe um preço válido', 'error');
            return;
        }

        const formatWithOffset = (dateString: string) => {
            if (!dateString) return null;
            const date = new Date(dateString);
            const tzo = -date.getTimezoneOffset();
            const dif = tzo >= 0 ? '+' : '-';
            const pad = (num: number) => (num < 10 ? '0' : '') + num;
            const offset = dif + pad(Math.floor(Math.abs(tzo) / 60)) + ':' + pad(Math.abs(tzo) % 60);
            return `${dateString.replace('T', ' ')}:00${offset}`;
        };

        try {
            await createViagem({
                nome: formData.nome,
                destino: formData.destino,
                data_ida: formatWithOffset(formData.data_ida) || '',
                data_volta: formatWithOffset(formData.data_volta) || undefined,
                preco,
                onibus_ids: formData.onibus_ids,
                origem_endereco: formData.origem_endereco,
                destino_endereco: formData.destino_endereco,
                meta_financeira: typeof formData.meta_financeira === 'string' ? parseFloat(formData.meta_financeira) || 0 : formData.meta_financeira,
                pagamento_gateway: formData.pagamento_gateway,
                chave_pix: formData.chave_pix,
                titular_pix: formData.titular_pix,
                gateway_api_key: formData.gateway_api_key,
            });
            showToast('Viagem cadastrada com sucesso!', 'success');
            navigate('/viagens');
        } catch (error) {
            showToast('Erro ao cadastrar viagem', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-dark">Nova Viagem</h1>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nome da Viagem (Origem)"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: Excursão Aparecida"
                            required
                        />

                        <Input
                            label="Destino"
                            value={formData.destino}
                            onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                            placeholder="Ex: Aparecida do Norte"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            type="datetime-local"
                            label="Data de Ida"
                            value={formData.data_ida}
                            onChange={(e) => setFormData({ ...formData, data_ida: e.target.value })}
                            required
                        />
                        <Input
                            type="datetime-local"
                            label="Data de Volta (Opcional)"
                            value={formData.data_volta}
                            onChange={(e) => setFormData({ ...formData, data_volta: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Endereço de Saída Precisão (Opcional)"
                            value={formData.origem_endereco}
                            onChange={(e) => setFormData({ ...formData, origem_endereco: e.target.value })}
                            placeholder="Ex: Rua X, 123, Bairro, Cidade, SP"
                        />
                        <Input
                            label="Endereço de Destino Precisão (Opcional)"
                            value={formData.destino_endereco}
                            onChange={(e) => setFormData({ ...formData, destino_endereco: e.target.value })}
                            placeholder="Ex: Av. Y, 456, Centro, Cidade, UF"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            type="number"
                            label="Preço por Pessoa"
                            value={formData.preco}
                            onChange={(e) => setFormData({ ...formData, preco: e.target.value ? parseFloat(e.target.value) : '' })}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                        />
                        <Input
                            type="number"
                            label="Meta Financeira Total (Opcional)"
                            value={formData.meta_financeira}
                            onChange={(e) => setFormData({ ...formData, meta_financeira: e.target.value ? parseFloat(e.target.value) : '' })}
                            placeholder="Ex: 2500.00"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="text-blue-600" size={20} />
                            <h2 className="text-lg font-bold text-gray-900">Configurações de Pagamento</h2>
                        </div>

                        <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Método de Pagamento
                                </label>
                                <select
                                    value={formData.pagamento_gateway}
                                    onChange={(e) => setFormData({ ...formData, pagamento_gateway: e.target.value as any })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="manual">PIX Manual (Copia e Cola)</option>
                                    <option value="asaas">ASAAS (Automatizado)</option>
                                    <option value="mp">Mercado Pago (Automatizado)</option>
                                    <option value="off">Nenhum / Desativado</option>
                                </select>
                            </div>

                            {formData.pagamento_gateway === 'manual' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Input
                                        label="Chave PIX"
                                        value={formData.chave_pix}
                                        onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                                        placeholder="CPF, Email, Celular ou Chave Aleatória"
                                        icon={<Key size={18} />}
                                    />
                                    <Input
                                        label="Titular do PIX"
                                        value={formData.titular_pix}
                                        onChange={(e) => setFormData({ ...formData, titular_pix: e.target.value })}
                                        placeholder="Nome completo do recebedor"
                                        icon={<User size={18} />}
                                    />
                                </div>
                            )}

                            {(formData.pagamento_gateway === 'asaas' || formData.pagamento_gateway === 'mp') && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Input
                                        type="password"
                                        label={formData.pagamento_gateway === 'asaas' ? "ASAAS Access Token" : "Mercado Pago Access Token"}
                                        value={formData.gateway_api_key}
                                        onChange={(e) => setFormData({ ...formData, gateway_api_key: e.target.value })}
                                        placeholder="Insira o token da API para automação"
                                        icon={<Key size={18} />}
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        {formData.pagamento_gateway === 'asaas'
                                            ? "As cobranças serão geradas automaticamente e os status atualizados via Webhook."
                                            : "Integração via checkout do Mercado Pago para cartões e PIX."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>


                    {(() => {
                        const busIdsUsedInTrips = new Set(
                            trips.flatMap(t => t.onibus_ids || (t.onibus_id ? [t.onibus_id] : []))
                        );
                        const availableBuses = buses.filter(b => !busIdsUsedInTrips.has(b.id));

                        return availableBuses.length === 0 ? (
                            <div className="p-8 bg-orange-50/50 border-2 border-dashed border-orange-200 rounded-2xl text-center space-y-4">
                                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-orange-900">Nenhum ônibus disponível</p>
                                    <p className="text-xs text-orange-700 max-w-[200px] mx-auto">
                                        Todos os ônibus cadastrados já estão ocupados em outras viagens.
                                    </p>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    type="button"
                                    className="bg-white border-orange-200 text-orange-600 hover:bg-orange-50 w-full sm:w-auto mx-auto"
                                    onClick={() => navigate('/onibus/novo')}
                                >
                                    <Plus size={16} className="mr-2" />
                                    Criar Novo Ônibus
                                </Button>
                            </div>
                        ) : (
                            <BusMultiSelect
                                buses={availableBuses}
                                selectedBusIds={formData.onibus_ids}
                                onChange={(busIds) => setFormData({ ...formData, onibus_ids: busIds })}
                                label="Ônibus"
                                required
                            />
                        );
                    })()}

                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/viagens')}
                            className="w-full sm:flex-1 py-3 text-base"
                        >
                            <X size={20} className="mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            isLoading={loading}
                            className="w-full sm:flex-1 py-3 text-base shadow-lg shadow-blue-200"
                        >
                            <Save size={20} className="mr-2" />
                            {loading ? 'Salvando...' : 'Salvar Viagem'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
