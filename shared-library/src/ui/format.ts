// Display formatting shared by the storefront and the admin screens. No runtime imports, so it is unit-tested directly.

const SPECIAL_ROLE_WORDS: Record<string, string> = { QA: 'QA', CRM: 'CRM', CFO: 'CFO', OPS: 'Ops', SLA: 'SLA', API: 'API' };

/** A role or status key as words: SUPER_ADMIN -> "Super Admin", QA_ANALYST -> "QA Analyst". Unknown or empty -> "". */
export function roleLabel(role: string | null | undefined): string {
  if (!role) return '';
  return role
    .trim()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => SPECIAL_ROLE_WORDS[word.toUpperCase()] ?? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** A money amount with thousands separators and two decimals; no currency symbol unless one is given. "—" when unknown. */
export function formatAmount(value: unknown, currency?: string | null, locale = 'en-US'): string {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  if (currency) {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(number);
    } catch {
      // An unknown currency code falls back to the plain amount followed by the code.
      return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number)} ${currency}`;
    }
  }
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
}

/** A whole count with thousands separators. "—" when unknown. */
export function formatCount(value: unknown, locale = 'en-US'): string {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(number) : '—';
}

export type KpiTone = 'neutral' | 'good' | 'attention' | 'critical';

/**
 * How loudly a count should show: a count of problems is only highlighted when it is above zero, so a dashboard of
 * zeros reads calm instead of red. `critical` problems (missed SLAs, failures) outrank `attention` ones (holds, backlog).
 */
export function problemTone(value: unknown, severity: 'attention' | 'critical' = 'attention'): KpiTone {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? severity : 'neutral';
}
