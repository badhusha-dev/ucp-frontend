import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
export const ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const location = useLocation();
    if (!isAuthenticated || !user) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    const permissions = user.permissions || [];
    const granted = permissions.includes('*') || (requiredPermission ? permissions.includes(requiredPermission) : false);
    const legacyRoleAllowed = !user.permissions && (allowedRoles.includes(user.role) || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    if (user.role !== 'SUPER_ADMIN' && (requiredPermission ? !granted && !legacyRoleAllowed : !allowedRoles.includes(user.role) && user.role !== 'ADMIN')) {
        return _jsx(Navigate, { to: "/unauthorized", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
