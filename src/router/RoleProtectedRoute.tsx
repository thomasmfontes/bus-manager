import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types';

interface RoleProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user && !allowedRoles.includes(user.role)) {
        // Redirect to dashboard if user doesn't have permission
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
