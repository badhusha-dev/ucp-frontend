// The signed-in user's role, used only to choose what to show; the server authorizes every action.

export function roleFromToken(token: string | null | undefined): string {
  try {
    const payload = token?.split('.')[1];
    if (!payload) return 'USER';
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return String(claims.role || 'USER').replace(/^ROLE_/, '').toUpperCase();
  } catch {
    return 'USER';
  }
}
