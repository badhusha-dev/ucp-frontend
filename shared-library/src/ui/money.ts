// The business's currency and money formatting shared by every application. The currency comes from the
// "currency" claim of the application token (set per business in Super Admin) and is remembered for the
// browser session. No runtime imports, so it is unit-tested directly.

const KEY = 'ucp.currency';
const RATES_KEY = 'ucp.currency.rates';
const DISPLAY_KEY = 'ucp.displayCurrency';
const CODE = /^[A-Z]{3}$/;

/** The locale whose number style suits each currency: lakh/crore grouping for rupees, RM for ringgit. */
const LOCALE_FOR: Record<string, string> = {
  INR: 'en-IN', MYR: 'en-MY', USD: 'en-US', EUR: 'en-IE', GBP: 'en-GB', AED: 'en-AE', SAR: 'en-SA', SGD: 'en-SG', AUD: 'en-AU', CAD: 'en-CA',
};

export const BUSINESS_CURRENCIES = ['INR', 'MYR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'SGD', 'AUD', 'CAD'];

interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }

function local(): StorageLike | null {
  try {
    return (globalThis as { localStorage?: StorageLike }).localStorage ?? null;
  } catch {
    return null;
  }
}

function storage(): StorageLike | null {
  try {
    return (globalThis as { sessionStorage?: StorageLike }).sessionStorage ?? null;
  } catch {
    return null;
  }
}

/** Remembers the business currency (from a token claim); ignores anything that is not a 3-letter code. */
export function rememberBusinessCurrency(currency: unknown, store: StorageLike | null = storage()): void {
  if (typeof currency === 'string' && CODE.test(currency)) store?.setItem(KEY, currency);
}

/** The business currency for this session, USD until one is known. */
export function businessCurrency(store: StorageLike | null = storage()): string {
  const value = store?.getItem(KEY) ?? '';
  return CODE.test(value) ? value : 'USD';
}

export function currencyLocale(currency: string): string {
  return LOCALE_FOR[currency] ?? 'en-US';
}

/** Remembers the business's extra display currencies (code -> rate from the business currency, from the token). */
export function rememberDisplayRates(rates: unknown, store: StorageLike | null = storage()): void {
  const clean: Record<string, number> = {};
  if (rates && typeof rates === 'object') {
    for (const [code, value] of Object.entries(rates as Record<string, unknown>)) {
      const n = Number(value);
      if (CODE.test(code) && Number.isFinite(n) && n > 0) clean[code] = n;
    }
  }
  store?.setItem(RATES_KEY, JSON.stringify(clean));
}

export function displayRates(store: StorageLike | null = storage()): Record<string, number> {
  try {
    const value = JSON.parse(store?.getItem(RATES_KEY) ?? '{}');
    return value && typeof value === 'object' ? value as Record<string, number> : {};
  } catch {
    return {};
  }
}

/** The business currency first, then the currencies people may switch the screens to. */
export function availableDisplayCurrencies(store: StorageLike | null = storage()): string[] {
  return [businessCurrency(store), ...Object.keys(displayRates(store))];
}

/** The currency the screens are shown in: the person's choice when the business offers it, else the business currency. */
export function displayCurrency(store: StorageLike | null = storage(), prefs: StorageLike | null = local()): string {
  const chosen = prefs?.getItem(DISPLAY_KEY) ?? '';
  return availableDisplayCurrencies(store).includes(chosen) ? chosen : businessCurrency(store);
}

/** Saves the person's display currency for this browser. */
export function chooseDisplayCurrency(currency: string, prefs: StorageLike | null = local()): void {
  if (CODE.test(currency)) prefs?.setItem(DISPLAY_KEY, currency);
}

/**
 * An amount for display. Amounts in the business currency are converted to the chosen display currency with the
 * business's rate; other currencies are shown as they are. "₹1,23,456.50", "RM 1,234.50"; "—" when missing.
 */
export function formatMoney(amount: unknown, currency: string = businessCurrency()): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  let value = Number(amount);
  if (!Number.isFinite(value)) return '—';
  if (currency === businessCurrency()) {
    const shown = displayCurrency();
    const rate = displayRates()[shown];
    if (shown !== currency && rate) { value *= rate; currency = shown; }
  }
  try {
    return new Intl.NumberFormat(currencyLocale(currency), { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/** The currency symbol alone, for input adornments ("₹", "RM", "$"). */
export function currencySymbol(currency: string = businessCurrency()): string {
  try {
    const part = new Intl.NumberFormat(currencyLocale(currency), { style: 'currency', currency }).formatToParts(0).find((p) => p.type === 'currency');
    return part?.value ?? currency;
  } catch {
    return currency;
  }
}
