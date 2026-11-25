import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertAmount, formatShopperPrice, isRightToLeft, localizationFrom, readShopperPreferences, resolvePreferences, storeShopperPreferences } from '../src/storefront/shopperPreferences.ts';

const loc = localizationFrom({ defaultLocale: 'en', locales: ['en', 'fr', 'ar'], defaultCurrency: 'USD', currencies: ['USD', 'EUR', 'INR', 'GBP'], exchangeRates: { EUR: 0.92, INR: '83.1', GBP: -1 } });

test('reads the storefront localization and drops invalid rates', () => {
  assert.deepEqual(loc.exchangeRates, { EUR: 0.92, INR: 83.1 });
  assert.deepEqual(localizationFrom(null).currencies, ['USD']);
});

test('keeps a saved choice only when the storefront offers it with a rate', () => {
  assert.deepEqual(resolvePreferences(loc, { locale: 'fr', currency: 'EUR' }), { locale: 'fr', currency: 'EUR' });
  assert.deepEqual(resolvePreferences(loc, { locale: 'de', currency: 'GBP' }), { locale: 'en', currency: 'USD' });
  assert.equal(resolvePreferences(loc, null, 'ar-EG').locale, 'ar');
});

test('converts and formats prices in the chosen currency and language', () => {
  assert.equal(convertAmount(10, loc, 'EUR').amount.toFixed(2), '9.20');
  assert.deepEqual(convertAmount(10, loc, 'GBP'), { amount: 10, currency: 'USD' });
  assert.equal(formatShopperPrice(12.5, loc, { locale: 'en', currency: 'USD' }), '$12.50');
  assert.equal(formatShopperPrice(12.5, loc, { locale: 'en', currency: 'INR' }), '₹1,038.75');
  assert.equal(formatShopperPrice('x', loc, { locale: 'en', currency: 'USD' }), '—');
});

test('right-to-left languages and saved preferences', () => {
  assert.equal(isRightToLeft('ar'), true);
  assert.equal(isRightToLeft('fr-FR'), false);
  const store = new Map<string, string>();
  const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); } };
  assert.equal(readShopperPreferences(storage), null);
  storeShopperPreferences({ locale: 'fr', currency: 'EUR' }, storage);
  assert.deepEqual(readShopperPreferences(storage), { locale: 'fr', currency: 'EUR' });
});
