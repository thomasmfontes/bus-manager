import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Shield, Users } from 'lucide-react';

export const Login: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-soft-xl p-8 w-full max-w-2xl border border-gray-100 fade-in duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                        <Bus className="text-white" size={40} strokeWidth={2} />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Bus Manager</h1>
                    <p className="text-gray-600 text-lg">Sistema de Gerenciamento de Assentos</p>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
                        Selecione o tipo de acesso
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Admin Login Card */}
                    <button
                        onClick={() => navigate('/login/admin')}
                        className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 hover:border-blue-400 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Shield className="text-white" size={32} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    Administrador
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Acesso completo ao sistema
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Login com e-mail
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* User Login Card */}
                    <button
                        onClick={() => navigate('/login/user')}
                        className="group relative bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 hover:border-green-400 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Users className="text-white" size={32} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    Usuário
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Passageiros e visitantes
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Login com CPF/RG
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Escolha a opção adequada para acessar o sistema
                    </p>
                </div>
            </div>
        </div>
    );
};
