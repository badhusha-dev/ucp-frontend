// Labels for the account security page. No runtime imports: unit-tested directly.

const EVENT_LABELS: Record<string, string> = {
  SIGN_IN: 'Signed in',
  SIGN_IN_FAILED: 'Failed sign-in (wrong password)',
  SIGN_IN_LOCKED: 'Sign-in blocked: account temporarily locked',
  SIGN_IN_DEACTIVATED: 'Sign-in refused: account deactivated',
  APPLICATION_SIGN_IN: 'Opened a client application',
  APPLICATION_ACCESS_DENIED: 'Client application refused',
  ACCOUNT_CREATED: 'Account created',
  PASSWORD_CHANGED: 'Password changed',
  PASSWORD_CHANGE_FAILED: 'Password change refused (wrong current password)',
  PASSWORD_RESET_REQUESTED: 'Password reset requested',
  PASSWORD_RESET_LINK_ISSUED: 'Reset link created by an administrator',
  PASSWORD_RESET: 'Password reset',
  SESSION_REVOKED: 'Session signed out',
  SIGNED_OUT_OTHER_SESSIONS: 'Signed out of all other sessions',
};

export function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type.toLowerCase().replace(/_/g, ' ');
}

/** Events worth drawing attention to on the activity list. */
export function isWarningEvent(type: string): boolean {
  return /FAILED|LOCKED|DEACTIVATED|DENIED/.test(type);
}

/** A short device description from a User-Agent header, e.g. "Chrome on Windows". */
export function deviceLabel(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Unknown device';
  const browser = /Edg\//.test(userAgent) ? 'Edge' : /Firefox\//.test(userAgent) ? 'Firefox'
    : /Chrome\//.test(userAgent) ? 'Chrome' : /Safari\//.test(userAgent) ? 'Safari' : /curl\//.test(userAgent) ? 'curl' : 'Browser';
  const system = /Windows/.test(userAgent) ? 'Windows' : /Android/.test(userAgent) ? 'Android'
    : /iPhone|iPad/.test(userAgent) ? 'iOS' : /Mac OS X/.test(userAgent) ? 'macOS' : /Linux/.test(userAgent) ? 'Linux' : '';
  return system ? `${browser} on ${system}` : browser;
}

export function sessionLabel(session: { kind: string; applicationCode: string | null; tenant: string | null }): string {
  if (session.kind !== 'APPLICATION') return 'Account sign-in';
  return [session.applicationCode, session.tenant].filter(Boolean).join(' · ');
}
