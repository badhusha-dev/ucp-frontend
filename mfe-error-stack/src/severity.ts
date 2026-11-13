// Error severity and triage-status colours, shared by the overview, list and detail pages.

export function severityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL': return '#EF4444';
    case 'ERROR': return '#F59E0B';
    case 'WARNING': return '#EAB308';
    default: return '#3B82F6';
  }
}

export function statusColors(status: string): { bg: string; text: string } {
  switch (status) {
    case 'NEW': return { bg: '#FEE2E2', text: '#DC2626' };
    case 'INVESTIGATING': return { bg: '#FEF3C7', text: '#D97706' };
    case 'RESOLVED': return { bg: '#DCFCE7', text: '#16A34A' };
    case 'IGNORED': return { bg: '#F1F5F9', text: '#64748B' };
    default: return { bg: '#E2E8F0', text: '#475569' };
  }
}
