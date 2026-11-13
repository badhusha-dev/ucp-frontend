import React from 'react';
interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
    requiredPermission?: string;
}
export declare const ProtectedRoute: React.FC<ProtectedRouteProps>;
export {};
