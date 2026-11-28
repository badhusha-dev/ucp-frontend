// Pure helpers for the Super Admin console screens (no React, so the Node test runner can load them directly).

export type SectionKey = 'clients' | 'workspace' | 'health' | 'users' | 'notifications' | 'audit';

export interface Section {
  key: SectionKey;
  label: string;
  /** Platform permission that opens the section; the API enforces the same permission. */
  permission: string;
}

export const SECTIONS: Section[] = [
  { key: 'clients', label: 'Client access', permission: 'platform:tenants.read' },
  { key: 'workspace', label: 'Client workspace', permission: 'platform:tenants.manage' },
  { key: 'health', label: 'System health', permission: 'platform:system.read' },
  { key: 'users', label: 'Users', permission: 'platform:users.read' },
  { key: 'notifications', label: 'Notifications & DLQ', permission: 'errors:manage' },
  { key: 'audit', label: 'Audit log', permission: 'platform:audit.read' },
];

export function holds(permissions: readonly string[] | undefined, permission: string): boolean {
  return Boolean(permissions && (permissions.includes('*') || permissions.includes(permission)));
}

/** Sections the signed-in staff member may open, in display order. */
export function sectionsFor(permissions: readonly string[] | undefined): Section[] {
  return SECTIONS.filter((section) => holds(permissions, section.permission));
}

// ---- Client workspace ----------------------------------------------------------------------------------------------
// Screens platform staff run for one client (they left the client's own E-commerce Admin). The portal acts for the
// client with an E-commerce Admin token from /api/users/login/application/exchange; the gateway accepts changes to
// these areas only from a Super Admin acting for the client.

export type WorkspaceTab = 'storefront' | 'business' | 'currency' | 'team' | 'modules' | 'errors';

export const WORKSPACE_TABS: { key: WorkspaceTab; label: string }[] = [
  { key: 'storefront', label: 'Storefront management' },
  { key: 'business', label: 'Business setup' },
  { key: 'currency', label: 'Currency settings' },
  { key: 'team', label: 'Client team' },
  { key: 'modules', label: 'Module access' },
  { key: 'errors', label: 'Error stack' },
];

/** Who the embedded screens should treat as acting: the role and permissions in the client token. */
export function actingAsFromClaims(claims: Record<string, unknown> | null | undefined): { role: string; permissions: string[] } {
  const role = typeof claims?.tenant_role === 'string' ? claims.tenant_role : '';
  const raw = claims?.permissions;
  const permissions = Array.isArray(raw) ? raw.filter((value): value is string => typeof value === 'string') : [];
  return { role, permissions };
}

/** Plain-language reason a client workspace could not be opened. */
export function workspaceOpenError(status: number, message: string, clientName: string): string {
  if (status === 403) return `E-commerce Admin is not enabled for ${clientName}, or your account may not act for clients. Enable it under Client access first.`;
  if (status === 404) return `${clientName} could not be found. Refresh the client list.`;
  return message || `The workspace for ${clientName} could not be opened.`;
}

// ---- Status presentation -------------------------------------------------------------------------------------------

export type Tone = 'success' | 'warning' | 'error' | 'default' | 'info';

/** Colour for a health, account or dead-letter status. */
export function statusTone(status: string | null | undefined): Tone {
  switch ((status || '').toUpperCase()) {
    case 'UP':
    case 'ACTIVE':
    case 'RESOLVED':
      return 'success';
    case 'DEGRADED':
    case 'LOCKED':
    case 'REPLAYED':
      return 'warning';
    case 'DOWN':
    case 'UNREACHABLE':
    case 'MISSING':
    case 'FAILED':
    case 'INACTIVE':
      return 'error';
    case 'UNKNOWN':
      return 'info';
    default:
      return 'default';
  }
}

/** "SIGN_IN_FAILED" -> "Sign in failed". */
export function humanize(value: string | null | undefined): string {
  if (!value) return '';
  const words = value.replace(/[_\-.]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// ---- Dates ---------------------------------------------------------------------------------------------------------

export function formatDateTime(iso: string | null | undefined, locale?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

/** "just now", "5 min ago", "3 h ago", "2 d ago"; future times read "in 15 min". */
export function relativeTime(iso: string | null | undefined, nowMs: number = Date.now()): string {
  if (!iso) return '—';
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return iso;
  const seconds = Math.round((nowMs - at) / 1000);
  const future = seconds < 0;
  const abs = Math.abs(seconds);
  let text: string;
  if (abs < 45) return future ? 'in a moment' : 'just now';
  if (abs < 3600) text = `${Math.round(abs / 60)} min`;
  else if (abs < 86_400) text = `${Math.round(abs / 3600)} h`;
  else text = `${Math.round(abs / 86_400)} d`;
  return future ? `in ${text}` : `${text} ago`;
}

/** Lock durations offered in the console, in minutes. */
export const LOCK_DURATIONS: { minutes: number; label: string }[] = [
  { minutes: 15, label: '15 minutes' },
  { minutes: 60, label: '1 hour' },
  { minutes: 60 * 24, label: '24 hours' },
  { minutes: 60 * 24 * 7, label: '7 days' },
  { minutes: 60 * 24 * 30, label: '30 days' },
];

// ---- Requests ------------------------------------------------------------------------------------------------------

export type QueryValue = string | number | boolean | null | undefined;

/** "?a=1&b=x" from the non-empty values, or "" when there are none. */
export function queryString(params: Record<string, QueryValue>): string {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value).trim())}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/** True when the text looks like a numeric account id rather than an email or name. */
export function isAccountId(text: string): boolean {
  return /^\d{1,18}$/.test(text.trim());
}

// ---- Payloads and export -------------------------------------------------------------------------------------------

/** Pretty-prints JSON text or a value; returns the original text when it is not JSON. */
export function prettyJson(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

/** One-line summary of an audit entry's change, e.g. "active: true → false". */
export function describeChange(before: unknown, after: unknown): string {
  const b = isRecord(before) ? before : {};
  const a = isRecord(after) ? after : {};
  const keys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));
  const parts: string[] = [];
  for (const key of keys) {
    const from = b[key];
    const to = a[key];
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    if (from === undefined && (to === null || to === undefined)) continue; // a new empty field (no reason given) says nothing
    if (from === undefined) parts.push(`${key}: ${display(to)}`);
    else parts.push(`${key}: ${display(from)} → ${display(to)}`);
  }
  return parts.join(', ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function display(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** RFC 4180 CSV: every cell quoted when needed, objects as JSON, CRLF line ends (opens cleanly in Excel). */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const cell = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) || /^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [columns.join(','), ...rows.map((row) => columns.map((column) => cell(row[column])).join(','))].join('\r\n') + '\r\n';
}

/** Short preview of a long message (payloads, stack traces). */
export function truncate(text: string | null | undefined, max = 120): string {
  if (!text) return '';
  const single = text.replace(/\s+/g, ' ').trim();
  return single.length > max ? `${single.slice(0, max - 1)}…` : single;
}
