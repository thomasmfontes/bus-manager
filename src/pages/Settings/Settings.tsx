import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Shield, Settings as SettingsIcon, User, Database } from 'lucide-react';
import { AdminList } from '@/components/settings/AdminList';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SystemPreferences } from '@/components/settings/SystemPreferences';
import { DataManagement } from '@/components/settings/DataManagement';
import { UserRole } from '@/types';

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'data' | 'admins'>('profile');
    const { user } = useAuthStore();

    const isAdmin = user?.role === UserRole.ADMIN;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configurações</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Gerencie as configurações do sistema</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-1">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'profile'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    title="Perfil"
                >
                    <User size={16} />
                    <span className="hidden sm:inline">Perfil</span>
                </button>
                <button
                    onClick={() => setActiveTab('preferences')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'preferences'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    title="Preferências"
                >
                    <SettingsIcon size={16} />
                    <span className="hidden sm:inline">Preferências</span>
                </button>
                <button
                    onClick={() => setActiveTab('data')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'data'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    title="Dados"
                >
                    <Database size={16} />
                    <span className="hidden sm:inline">Dados</span>
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('admins')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'admins'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        title="Administradores"
                    >
                        <Shield size={16} />
                        <span className="hidden sm:inline">Administradores</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'profile' && <ProfileSettings />}
                {activeTab === 'preferences' && <SystemPreferences />}
                {activeTab === 'data' && <DataManagement />}
                {activeTab === 'admins' && isAdmin && <AdminList />}
            </div>
        </div>
    );
};
