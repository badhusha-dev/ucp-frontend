import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useSelector } from 'react-redux';
export const RoleGuard = ({ allowedRoles, children, fallback = null }) => {
    const user = useSelector((state) => state.auth.user);
    if (!user)
        return _jsx(_Fragment, { children: fallback });
    if (allowedRoles.includes(user.role) || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        return _jsx(_Fragment, { children: children });
    }
    return _jsx(_Fragment, { children: fallback });
};
