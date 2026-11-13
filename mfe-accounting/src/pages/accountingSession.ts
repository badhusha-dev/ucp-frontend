// Accounting UI session rules: which actions to offer and who the signed-in user is. The server re-checks everything.

/** Claims of a JWT (base64url payload), or null when it cannot be read. Signature is the server's job. */
export function tokenClaims(token: string | null | undefined): Record<string, any> | null {
  try {
    const payload = token?.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function tokenHasAccountingPermission(token: string | null | undefined, permission: string): boolean {
  const claims = tokenClaims(token);
  if (!claims) return false;
  if (claims.role === 'SUPER_ADMIN') return true;
  if (Array.isArray(claims.permissions)) return claims.permissions.includes('*') || claims.permissions.includes(permission);
  return claims.role === 'ADMIN' || claims.role === 'MANAGER';
}

export function tokenUserId(token: string | null | undefined): number | null {
  const id = Number(tokenClaims(token)?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** A Date as the yyyy-mm-dd value of a date input, in local time. */
export const dateInput = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
