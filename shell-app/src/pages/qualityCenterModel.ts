// Quality Center display rules.

export const activeStatuses = new Set(['QUEUED', 'PREFLIGHT', 'RUNNING', 'FINALIZING']);

export type StatusColor = 'success' | 'error' | 'warning' | 'info' | 'default';

export function statusColor(status?: string): StatusColor {
  switch (status) {
    case 'PASSED': case 'ASSERTION_PASSED': return 'success';
    case 'FAILED': case 'ASSERTION_FAILED': return 'error';
    case 'BLOCKED': case 'INFRASTRUCTURE_FAILURE': case 'TIMED_OUT': case 'CANCELLED': return 'warning';
    case 'RUNNING': case 'PREFLIGHT': case 'QUEUED': case 'FINALIZING': return 'info';
    default: return 'default';
  }
}

export const pretty = (value?: string | null) =>
  value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) : '—';

export const messageOf = (error: any): string =>
  error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Request failed';
