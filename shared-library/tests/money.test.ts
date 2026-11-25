import { test } from 'node:test';
import assert from 'node:assert/strict';
import { businessCurrency, currencySymbol, formatMoney, rememberBusinessCurrency } from '../src/ui/money.ts';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };

test('remembers only valid currency codes and defaults to USD', () => {
  const s = memory();
  assert.equal(businessCurrency(s), 'USD');
  rememberBusinessCurrency('inr', s);
  assert.equal(businessCurrency(s), 'USD');
  rememberBusinessCurrency('INR', s);
  assert.equal(businessCurrency(s), 'INR');
});

test('formats rupees with lakh grouping and ringgit with RM', () => {
  assert.equal(formatMoney(123456.5, 'INR'), '₹1,23,456.50');
  assert.match(formatMoney(1234.5, 'MYR'), /^RM\s?1,234\.50$/);
  assert.equal(formatMoney(12, 'USD'), '$12.00');
  assert.equal(formatMoney(null, 'INR'), '—');
  assert.equal(currencySymbol('INR'), '₹');
  assert.equal(currencySymbol('MYR'), 'RM');
});

test('converts business-currency amounts to the chosen display currency', async () => {
  const { chooseDisplayCurrency, displayCurrency, rememberDisplayRates, availableDisplayCurrencies } = await import('../src/ui/money.ts');
  const s = memory(), prefs = memory();
  rememberBusinessCurrency('INR', s);
  rememberDisplayRates({ MYR: 0.0527, bad: 2, USD: -1 }, s);
  assert.deepEqual(availableDisplayCurrencies(s), ['INR', 'MYR']);
  assert.equal(displayCurrency(s, prefs), 'INR');
  chooseDisplayCurrency('MYR', prefs);
  assert.equal(displayCurrency(s, prefs), 'MYR');
  chooseDisplayCurrency('GBP', prefs);
  assert.equal(displayCurrency(s, prefs), 'INR');
});
