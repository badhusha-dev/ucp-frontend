// Language and currency a shopper picks on a storefront. Prices stay stored in the storefront's default currency;
// the storefront publishes a rate for each other currency it offers, and display prices are converted with it.
// No runtime imports, so it is unit-tested directly.

export interface StorefrontLocalization {
  defaultLocale: string;
  locales: string[];
  defaultCurrency: string;
  currencies: string[];
  exchangeRates: Record<string, number>;
}

export interface ShopperPreferences {
  locale: string;
  currency: string;
}

interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }

export const SHOPPER_PREFERENCES_EVENT = 'ucp:shopper-preferences';
const KEY = 'ucp.shopper.preferences';
const RTL = new Set(['ar', 'he', 'fa', 'ur']);

/** Reads the localization part of a public storefront response; missing parts fall back to English and USD. */
export function localizationFrom(site: Record<string, unknown> | null | undefined): StorefrontLocalization {
  const list = (v: unknown, fallback: string) => (Array.isArray(v) && v.length ? v.map(String) : [fallback]);
  const defaultLocale = typeof site?.defaultLocale === 'string' ? site.defaultLocale : 'en';
  const defaultCurrency = typeof site?.defaultCurrency === 'string' ? site.defaultCurrency : 'USD';
  const rates: Record<string, number> = {};
  const raw = site?.exchangeRates;
  if (raw && typeof raw === 'object') {
    for (const [code, value] of Object.entries(raw as Record<string, unknown>)) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) rates[code] = n;
    }
  }
  return { defaultLocale, locales: list(site?.locales, defaultLocale), defaultCurrency, currencies: list(site?.currencies, defaultCurrency), exchangeRates: rates };
}

/** The shopper's saved choice, kept only where this storefront still offers it. */
export function resolvePreferences(loc: StorefrontLocalization, saved: Partial<ShopperPreferences> | null, browserLocale?: string): ShopperPreferences {
  const browser = browserLocale && loc.locales.find((l) => l === browserLocale || l === browserLocale.split('-')[0]);
  const locale = saved?.locale && loc.locales.includes(saved.locale) ? saved.locale : browser || loc.defaultLocale;
  const currency = saved?.currency && loc.currencies.includes(saved.currency) && rateFor(loc, saved.currency) !== null ? saved.currency : loc.defaultCurrency;
  return { locale, currency };
}

/** 1 for the default currency, the published rate for another, null when the storefront has none. */
export function rateFor(loc: StorefrontLocalization, currency: string): number | null {
  if (currency === loc.defaultCurrency) return 1;
  return loc.exchangeRates[currency] ?? null;
}

/** An amount kept in the default currency, converted to the chosen one (falls back to the default if no rate). */
export function convertAmount(amount: number, loc: StorefrontLocalization, currency: string): { amount: number; currency: string } {
  const rate = rateFor(loc, currency);
  if (rate === null) return { amount, currency: loc.defaultCurrency };
  return { amount: amount * rate, currency };
}

/** A price for display: converted, then formatted in the shopper's language ("€11.50", "₹1,038.75"). */
export function formatShopperPrice(amount: unknown, loc: StorefrontLocalization, prefs: ShopperPreferences): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '—';
  const converted = convertAmount(value, loc, prefs.currency);
  try {
    return new Intl.NumberFormat(prefs.locale, { style: 'currency', currency: converted.currency }).format(converted.amount);
  } catch {
    return `${converted.amount.toFixed(2)} ${converted.currency}`;
  }
}

/** "English", "Français", "العربية": each language in its own words, falling back to the code. */
export function languageName(code: string): string {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
  } catch {
    return code;
  }
}

export function isRightToLeft(locale: string): boolean {
  return RTL.has(locale.split('-')[0]);
}

export function readShopperPreferences(storage: StorageLike): Partial<ShopperPreferences> | null {
  try {
    const value = JSON.parse(storage.getItem(KEY) ?? 'null');
    return value && typeof value === 'object' ? { locale: String(value.locale ?? ''), currency: String(value.currency ?? '') } : null;
  } catch {
    return null;
  }
}

export function storeShopperPreferences(prefs: ShopperPreferences, storage: StorageLike): void {
  storage.setItem(KEY, JSON.stringify(prefs));
}
