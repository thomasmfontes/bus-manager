import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Shield, Settings as SettingsIcon, User, Database } from 'lucide-react';
import { AdminList } from '@/components/settings/AdminList';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SystemPreferences } from '@/components/settings/SystemPreferences';
import { DataManagement } from '@/components/settings/DataManagement';
import { UserRole } from '@/types';

export const Settings: React.FC = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === UserRole.ADMIN;

    // Set default tab based on role: admins see profile, passengers see preferences
    const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'data' | 'admins'>(
        isAdmin ? 'profile' : 'preferences'
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in duration-500">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-900/20">
                        <SettingsIcon className="text-white" size={20} />
                    </div>
                    Configurações
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base ml-[52px]">Preferências do sistema e perfil do usuário.</p>
            </div>

            {/* Tabs */}
            <div className="relative -mx-4 sm:mx-0">
                <div className="flex gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto scrollbar-thin px-4 sm:px-0 snap-x snap-mandatory">
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap snap-start ${activeTab === 'profile'
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            title="Perfil"
                        >
                            <User size={18} className="shrink-0" />
                            <span className="hidden sm:inline">Perfil</span>
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={`px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap snap-start ${activeTab === 'preferences'
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        title="Preferências"
                    >
                        <SettingsIcon size={18} className="shrink-0" />
                        <span className="hidden sm:inline">Preferências</span>
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('data')}
                            className={`px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap snap-start ${activeTab === 'data'
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            title="Dados"
                        >
                            <Database size={18} className="shrink-0" />
                            <span className="hidden sm:inline">Dados</span>
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('admins')}
                            className={`px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap snap-start ${activeTab === 'admins'
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            title="Administradores"
                        >
                            <Shield size={18} className="shrink-0" />
                            <span className="hidden sm:inline">Administradores</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div key={activeTab} className="animate-in fade-in duration-500">
                {activeTab === 'profile' && isAdmin && <ProfileSettings />}
                {activeTab === 'preferences' && <SystemPreferences />}
                {activeTab === 'data' && isAdmin && <DataManagement />}
                {activeTab === 'admins' && isAdmin && <AdminList />}
            </div>
        </div>
    );
};
