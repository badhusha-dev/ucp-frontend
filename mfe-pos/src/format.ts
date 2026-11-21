import { formatAmount } from '@ecommerce/shared-library';

const locale = (() => {
  try { return navigator.language || 'en-US'; } catch { return 'en-US'; }
})();

/** Money in the store's currency, in the person's own number format. */
export function money(value: unknown, currency?: string | null): string {
  return formatAmount(value, currency || undefined, locale);
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export function time(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
