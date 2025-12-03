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
        <div className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-soft-lg transition-all">
                <div className="flex items-start gap-3 sm:gap-4 mb-6">
                    <div className="p-2.5 sm:p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm shrink-0">
                        <Settings className="text-white" size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Preferências do Sistema</h2>
                        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Personalize o comportamento padrão do sistema</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Capacidade Padrão dos Ônibus
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Este valor será preenchido automaticamente ao criar um novo ônibus.
                        </p>
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                value={defaultSeats}
                                onChange={(e) => setDefaultSeats(e.target.value)}
                                placeholder="Ex: 46"
                                min="1"
                                className="flex-1"
                            />
                            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">lugares</span>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" className="w-full sm:w-auto">
                            <Save size={18} />
                            Salvar Preferências
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
