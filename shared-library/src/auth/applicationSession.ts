// Shared sign-in and session handling for the independently deployable applications.
// The server issues an application- and tenant-scoped token after checking membership,
// entitlement and grant. The browser never decides access: claims are read here only to
// reject a token issued for another application and to drop expired sessions early.
// Signature, issuer, audience and the current grant are always verified server-side.

import type { ApplicationCode } from '../config/applicationRegistry';

export interface ApplicationSession {
  token: string;
  applicationCode: ApplicationCode;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  role: string;
}

export interface ApplicationSignInRequest {
  applicationCode: ApplicationCode;
  tenantSlug: string;
  email: string;
  password: string;
}

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class ApplicationSignInError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApplicationSignInError';
    this.status = status;
  }
}

const STORAGE_PREFIX = 'ucp.session.';
const DEFAULT_ERRORS: Record<number, string> = {
  400: 'Enter your client workspace, email and password.',
  401: 'The email or password is incorrect.',
  403: 'Your account does not have access to this application for that client.',
};

export function sessionStorageKey(applicationCode: ApplicationCode): string {
  return STORAGE_PREFIX + applicationCode;
}

/** Decodes a JWT payload without verifying it. Returns null for malformed tokens. */
export function decodeTokenClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      Array.from(atob(padded), (char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    );
    const claims = JSON.parse(json);
    return claims && typeof claims === 'object' ? claims : null;
  } catch {
    return null;
  }
}

/**
 * True when the token claims this application and tenant and has not expired.
 * A token without an `exp` claim is treated as invalid.
 */
export function isUsableApplicationToken(
  token: string,
  applicationCode: ApplicationCode,
  tenantId: string,
  nowMs: number = Date.now(),
): boolean {
  const claims = decodeTokenClaims(token);
  if (!claims) return false;
  if (claims.application_code !== applicationCode || claims.tenant_id !== tenantId) return false;
  return typeof claims.exp === 'number' && claims.exp * 1000 > nowMs;
}

/** Signs in to one application for one client workspace. Throws ApplicationSignInError on failure. */
export async function signInToApplication(
  request: ApplicationSignInRequest,
  fetchImpl: typeof fetch = fetch,
  apiBaseUrl = '',
): Promise<ApplicationSession> {
  let response: Response;
  try {
    response = await fetchImpl(`${apiBaseUrl}/api/users/login/application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: request.email.trim(),
        password: request.password,
        applicationCode: request.applicationCode,
        tenantSlug: request.tenantSlug.trim().toLowerCase(),
      }),
    });
  } catch {
    throw new ApplicationSignInError('The sign-in service could not be reached. Try again shortly.', 0);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const serverMessage = body && typeof body.error === 'string' ? body.error : null;
    throw new ApplicationSignInError(
      DEFAULT_ERRORS[response.status] ?? serverMessage ?? 'Sign in failed. Please try again.',
      response.status,
    );
  }

  const session = toSession(body, request.applicationCode);
  if (!session
      || !isUsableApplicationToken(session.token, request.applicationCode, session.tenantId)) {
    throw new ApplicationSignInError('The sign-in response was not valid for this application.', response.status);
  }
  return session;
}

export function storeApplicationSession(session: ApplicationSession, storage: SessionStorageLike): void {
  storage.setItem(sessionStorageKey(session.applicationCode), JSON.stringify(session));
}

/** Returns the stored session for this application, clearing it if it is malformed, foreign or expired. */
export function readApplicationSession(
  applicationCode: ApplicationCode,
  storage: SessionStorageLike,
  nowMs: number = Date.now(),
): ApplicationSession | null {
  const key = sessionStorageKey(applicationCode);
  let session: ApplicationSession | null = null;
  try {
    const raw = storage.getItem(key);
    session = raw ? toSession(JSON.parse(raw), applicationCode) : null;
  } catch {
    session = null;
  }
  if (session && isUsableApplicationToken(session.token, applicationCode, session.tenantId, nowMs)) {
    return session;
  }
  storage.removeItem(key);
  return null;
}

export function clearApplicationSession(applicationCode: ApplicationCode, storage: SessionStorageLike): void {
  storage.removeItem(sessionStorageKey(applicationCode));
}

// Platform (not tenant-scoped) sessions, used by the Super Admin portal. The token comes from
// the platform login and must not carry a tenant; the server re-checks the role on every request.

export interface PlatformSession {
  token: string;
  email: string;
  role: string;
  /** Platform permissions from the token; the server re-checks them on every request. */
  permissions: string[];
}

/** True when the platform session carries the permission (or the wildcard). Display decisions only. */
export function hasPlatformPermission(session: PlatformSession | null, permission: string): boolean {
  return Boolean(session && (session.permissions.includes('*') || session.permissions.includes(permission)));
}

const PLATFORM_KEY = STORAGE_PREFIX + 'PLATFORM';

/** True when the token is an unexpired platform token (no tenant or application scope). */
export function isUsablePlatformToken(token: string, nowMs: number = Date.now()): boolean {
  const claims = decodeTokenClaims(token);
  if (!claims || claims.tenant_id !== undefined || claims.application_code !== undefined) return false;
  return typeof claims.exp === 'number' && claims.exp * 1000 > nowMs;
}

/**
 * Signs in through the platform login. When requiredRole is given, a token for another role is
 * rejected with 403 so the portal can explain the restriction before making protected calls.
 */
export async function signInToPlatform(
  request: { email: string; password: string },
  requiredRole?: string,
  fetchImpl: typeof fetch = fetch,
  apiBaseUrl = '',
): Promise<PlatformSession> {
  let response: Response;
  try {
    response = await fetchImpl(`${apiBaseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: request.email.trim(), password: request.password }),
    });
  } catch {
    throw new ApplicationSignInError('The sign-in service could not be reached. Try again shortly.', 0);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const messages: Record<number, string> = { ...DEFAULT_ERRORS, 403: 'This account is deactivated.' };
    throw new ApplicationSignInError(messages[response.status] ?? 'Sign in failed. Please try again.', response.status);
  }
  const token = body && typeof body.token === 'string' ? body.token : '';
  if (!isUsablePlatformToken(token)) {
    throw new ApplicationSignInError('The sign-in response was not a valid platform session.', response.status);
  }
  const session = toPlatformSession(token);
  if (requiredRole && session.role !== requiredRole) {
    throw new ApplicationSignInError('This portal is limited to platform administrators.', 403);
  }
  return session;
}

export function storePlatformSession(session: PlatformSession, storage: SessionStorageLike): void {
  storage.setItem(PLATFORM_KEY, session.token);
}

/** Returns the stored platform session, clearing it if it is malformed, tenant-scoped or expired. */
export function readPlatformSession(storage: SessionStorageLike, nowMs: number = Date.now()): PlatformSession | null {
  const token = storage.getItem(PLATFORM_KEY);
  if (token && isUsablePlatformToken(token, nowMs)) return toPlatformSession(token);
  storage.removeItem(PLATFORM_KEY);
  return null;
}

export function clearPlatformSession(storage: SessionStorageLike): void {
  storage.removeItem(PLATFORM_KEY);
}

function toPlatformSession(token: string): PlatformSession {
  const claims = decodeTokenClaims(token) ?? {};
  return {
    token,
    email: typeof claims.sub === 'string' ? claims.sub : '',
    role: typeof claims.role === 'string' ? claims.role : '',
    permissions: Array.isArray(claims.permissions) ? claims.permissions.filter((p): p is string => typeof p === 'string') : [],
  };
}

/** Parses a session payload, accepting it only when it is for the expected application. */
function toSession(value: unknown, expectedCode: ApplicationCode): ApplicationSession | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.token !== 'string' || v.applicationCode !== expectedCode || typeof v.tenantId !== 'string') return null;
  return {
    token: v.token,
    applicationCode: expectedCode,
    tenantId: v.tenantId,
    tenantSlug: typeof v.tenantSlug === 'string' ? v.tenantSlug : '',
    tenantName: typeof v.tenantName === 'string' ? v.tenantName : '',
    role: typeof v.role === 'string' ? v.role : '',
  };
}

// ---- One sign-in across applications ------------------------------------------------------------------------
// The person's client workspaces, and the exchange of the account sign-in for a client application session.
// The server repeats every membership, entitlement, grant and role check.

// Same shape check as config/applicationRegistry (kept local: this module has no runtime imports, see tests).
function isKnownApplicationCode(value: unknown): value is ApplicationCode {
  return typeof value === 'string' && /^[A-Z][A-Z0-9_]{1,47}$/.test(value);
}

export interface WorkspaceApplication {
  applicationCode: ApplicationCode;
  displayName: string;
  role: string;
}

export interface Workspace {
  tenantId: string;
  slug: string;
  name: string;
  applications: WorkspaceApplication[];
}

export interface MyApplications {
  platform: { applicationCode: ApplicationCode; displayName: string }[];
  workspaces: Workspace[];
}

/** The workspaces that grant this application, for the one-click sign-in list. */
export function workspacesFor(applications: MyApplications | null, applicationCode: ApplicationCode): Workspace[] {
  if (!applications) return [];
  return applications.workspaces.filter((workspace) =>
    workspace.applications.some((application) => application.applicationCode === applicationCode));
}

/** Parses /api/users/me/workspaces, dropping anything malformed or naming an unknown application. */
export function parseMyApplications(body: unknown): MyApplications {
  const raw = (body ?? {}) as { platform?: unknown; workspaces?: unknown };
  const platform = Array.isArray(raw.platform) ? raw.platform.flatMap((entry) => {
    const item = entry as { applicationCode?: unknown; displayName?: unknown };
    return isKnownApplicationCode(item.applicationCode) && typeof item.displayName === 'string'
      ? [{ applicationCode: item.applicationCode, displayName: item.displayName }] : [];
  }) : [];
  const workspaces = Array.isArray(raw.workspaces) ? raw.workspaces.flatMap((entry) => {
    const item = entry as { tenantId?: unknown; slug?: unknown; name?: unknown; applications?: unknown };
    if (typeof item.tenantId !== 'string' || typeof item.slug !== 'string' || typeof item.name !== 'string') return [];
    const applications = Array.isArray(item.applications) ? item.applications.flatMap((app) => {
      const a = app as { applicationCode?: unknown; displayName?: unknown; role?: unknown };
      return isKnownApplicationCode(a.applicationCode) && typeof a.displayName === 'string' && typeof a.role === 'string'
        ? [{ applicationCode: a.applicationCode, displayName: a.displayName, role: a.role }] : [];
    }) : [];
    return [{ tenantId: item.tenantId, slug: item.slug, name: item.name, applications }];
  }) : [];
  return { platform, workspaces };
}

export async function fetchMyApplications(platformToken: string, fetchImpl: typeof fetch = fetch, apiBaseUrl = ''): Promise<MyApplications> {
  const response = await fetchImpl(`${apiBaseUrl}/api/users/me/workspaces`, { headers: { Authorization: `Bearer ${platformToken}` } });
  if (!response.ok) throw new ApplicationSignInError('Your workspaces could not be loaded.', response.status);
  return parseMyApplications(await response.json().catch(() => null));
}

/** Opens a client application with the current account sign-in; no password is sent again. */
export async function exchangeForApplication(
  request: { applicationCode: ApplicationCode; tenantSlug: string },
  platformToken: string,
  fetchImpl: typeof fetch = fetch,
  apiBaseUrl = '',
): Promise<ApplicationSession> {
  let response: Response;
  try {
    response = await fetchImpl(`${apiBaseUrl}/api/users/login/application/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${platformToken}` },
      body: JSON.stringify({ applicationCode: request.applicationCode, tenantSlug: request.tenantSlug }),
    });
  } catch {
    throw new ApplicationSignInError('The sign-in service could not be reached. Try again shortly.', 0);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: 'Your sign-in has ended. Sign in again.',
      403: 'Your account does not have access to this application for that client.',
      429: 'Too many sign-in attempts. Wait a minute and try again.',
    };
    throw new ApplicationSignInError(messages[response.status] ?? 'Sign in failed. Please try again.', response.status);
  }
  const session: ApplicationSession | null = body && typeof body.token === 'string' && typeof body.tenantId === 'string'
    ? { token: body.token, applicationCode: request.applicationCode, tenantId: body.tenantId,
        tenantSlug: typeof body.tenantSlug === 'string' ? body.tenantSlug : request.tenantSlug,
        tenantName: typeof body.tenantName === 'string' ? body.tenantName : '',
        role: typeof body.role === 'string' ? body.role : '' }
    : null;
  if (!session || !isUsableApplicationToken(session.token, request.applicationCode, session.tenantId)) {
    throw new ApplicationSignInError('The sign-in response was not valid for this application.', response.status);
  }
  return session;
}
