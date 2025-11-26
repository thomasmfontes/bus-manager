import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types';

interface ProtectedActionProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
    requiredPermission?: 'create' | 'edit' | 'delete';
    fallback?: React.ReactNode;
}

export const ProtectedAction: React.FC<ProtectedActionProps> = ({
    children,
    requiredRole,
    requiredPermission,
    fallback = null,
}) => {
    const { user, hasPermission } = useAuthStore();

    if (!user) return <>{fallback}</>;

    // Check role-based access
    if (requiredRole && user.role !== requiredRole && user.role !== UserRole.ADMIN) {
        return <>{fallback}</>;
    }

    // Check permission-based access
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
