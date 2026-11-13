import React from 'react';
interface RoleGuardProps {
    allowedRoles: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}
export declare const RoleGuard: React.FC<RoleGuardProps>;
export {};
