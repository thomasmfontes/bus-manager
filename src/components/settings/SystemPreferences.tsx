import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Settings, Save } from 'lucide-react';

export const SystemPreferences: React.FC = () => {
    const { showToast } = useToast();
    const [defaultSeats, setDefaultSeats] = useState('46');

    useEffect(() => {
        const savedSeats = localStorage.getItem('default_bus_seats');
        if (savedSeats) {
            setDefaultSeats(savedSeats);
        }
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('default_bus_seats', defaultSeats);
        showToast('Preferências salvas com sucesso!', 'success');
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <Settings className="text-gray-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Preferências do Sistema</h2>
                        <p className="text-gray-500 text-sm">Personalize o comportamento padrão do sistema</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Capacidade Padrão dos Ônibus
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Este valor será preenchido automaticamente ao criar um novo ônibus.
                        </p>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={defaultSeats}
                                onChange={(e) => setDefaultSeats(e.target.value)}
                                placeholder="Ex: 46"
                                min="1"
                            />
                            <span className="text-sm text-gray-500">lugares</span>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit">
                            <Save size={18} className="mr-2" />
                            Salvar Preferências
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
