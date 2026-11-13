// Route-guard decision for ProtectedRoute, kept free of runtime imports so it can be unit-tested directly.
// The backend authorizes every API call; this only decides whether to show a screen or the unauthorized page.

export const ANY_SIGNED_IN = '*';

export type RouteUser = { role: string; permissions?: string[] | null };

/**
 * allowedRoles may contain ANY_SIGNED_IN for screens about the user's own account (profile, cart, orders): every
 * signed-in person may open them whatever their platform role, since services only return the caller's own records.
 */
export function routeAllowed(user: RouteUser, allowedRoles: string[], requiredPermission?: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if (allowedRoles.includes(ANY_SIGNED_IN) && !requiredPermission) return true;
  const permissions = user.permissions || [];
  if (requiredPermission) {
    const granted = permissions.includes('*') || permissions.includes(requiredPermission);
    const legacyRoleAllowed = !user.permissions && (allowedRoles.includes(user.role) || user.role === 'ADMIN');
    return granted || legacyRoleAllowed;
  }
  return allowedRoles.includes(user.role) || user.role === 'ADMIN';
}
