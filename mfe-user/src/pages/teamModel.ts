// Pure helpers for the client team screen (role engine v2). Kept free of runtime imports so they run under node --test.

export const MAX_DELEGATION_DAYS = 90;
const DAY_MS = 86_400_000;

export type RoleAssignment = {
  id: number;
  roleKey: string;
  roleName: string;
  scopeType: string;
  scopeId: string | null;
  expiresAt: string | null;
  delegatedBy: string | null;
};
export type DirectGrant = { id: number; permissionKey: string; expiresAt: string | null; reason: string };
export type MemberApplication = { applicationCode: string; displayName: string; roles: RoleAssignment[]; permissions: DirectGrant[] };
export type Member = { userId: number; email: string; name: string; membershipStatus: string; applications: MemberApplication[] };
export type RoleTemplate = { key: string; name: string; description: string | null; custom: boolean; permissions: string[]; grantable: boolean };
export type PermissionGroup = { group: string; permissions: { key: string; description: string; grantable: boolean }[] };

/** "2026-11-30" from a date input → end of that day in UTC as an ISO instant; empty → null. */
export function expiryFromDateInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) throw new Error('Use a date in the form YYYY-MM-DD.');
  const instant = new Date(`${trimmed}T23:59:59.000Z`);
  if (Number.isNaN(instant.getTime())) throw new Error('Use a real calendar date.');
  return instant.toISOString();
}

/** Mirrors the server rule so the dialog can explain itself before submitting. */
export function delegationExpiryProblem(isoExpiry: string | null, now: Date = new Date()): string | null {
  if (!isoExpiry) return 'A delegation needs an end date.';
  const expires = new Date(isoExpiry).getTime();
  if (expires <= now.getTime()) return 'The end date must be in the future.';
  if (expires > now.getTime() + MAX_DELEGATION_DAYS * DAY_MS) return `A delegation can last at most ${MAX_DELEGATION_DAYS} days.`;
  return null;
}

/** Custom role keys: 2–40 capitals, digits or underscores, starting with a letter (server prefixes the client id). */
export function customRoleKeyProblem(key: string): string | null {
  return /^[A-Z][A-Z0-9_]{1,39}$/.test(key.trim().toUpperCase()) ? null : 'Use 2–40 capital letters, digits or underscores, starting with a letter.';
}

/** Only roles the signed-in manager may hand out are offered; the server enforces the same rule. */
export function assignableRoles(roles: RoleTemplate[]): RoleTemplate[] {
  return roles.filter((role) => role.grantable);
}

export function roleChipLabel(role: RoleAssignment): string {
  const parts = [role.roleName || role.roleKey];
  if (role.scopeType && role.scopeType !== 'TENANT') parts.push(`${role.scopeType.toLowerCase()} ${role.scopeId}`);
  if (role.delegatedBy) parts.push(`from ${role.delegatedBy}`);
  if (role.expiresAt) parts.push(`until ${role.expiresAt.slice(0, 10)}`);
  return parts.join(' · ');
}

/** The id used in the URL of a custom role is the full stored key ("C_<client>_<KEY>"). */
export function isCustomRoleKey(key: string): boolean {
  return /^C_[0-9A-F]{12}_[A-Z][A-Z0-9_]+$/.test(key);
}

export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, size)));
}

/** A server error body ({message} or {error}) or the transport message, never an empty string. */
export function errorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
  return response?.message || response?.error || (error as { message?: string })?.message || fallback;
}
