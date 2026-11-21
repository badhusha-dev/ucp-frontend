import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatAmount, formatCount, problemTone, roleLabel } from '../src/ui/format.ts';

describe('roleLabel', () => {
  it('turns role keys into words', () => {
    assert.equal(roleLabel('SUPER_ADMIN'), 'Super Admin');
    assert.equal(roleLabel('ORDER_MANAGER'), 'Order Manager');
    assert.equal(roleLabel('QA_ANALYST'), 'QA Analyst');
    assert.equal(roleLabel('CFO'), 'CFO');
    assert.equal(roleLabel('PLATFORM_OPS'), 'Platform Ops');
  });
  it('is empty for nothing', () => {
    assert.equal(roleLabel(undefined), '');
    assert.equal(roleLabel(''), '');
  });
});

describe('formatAmount', () => {
  it('adds separators and two decimals without inventing a currency', () => {
    assert.equal(formatAmount(199.99), '199.99');
    assert.equal(formatAmount('1234567.5'), '1,234,567.50');
    assert.equal(formatAmount(0), '0.00');
  });
  it('uses the currency when one is given', () => {
    assert.equal(formatAmount(12.5, 'USD'), '$12.50');
    assert.match(formatAmount(12.5, 'NOPE'), /12\.50 NOPE/);
  });
  it('shows a dash for unknown values', () => {
    assert.equal(formatAmount(null), '—');
    assert.equal(formatAmount(''), '—');
    assert.equal(formatAmount('abc'), '—');
  });
});

describe('formatCount and problemTone', () => {
  it('formats counts', () => {
    assert.equal(formatCount(12345), '12,345');
    assert.equal(formatCount(undefined), '—');
  });
  it('only highlights problems above zero', () => {
    assert.equal(problemTone(0), 'neutral');
    assert.equal(problemTone(3), 'attention');
    assert.equal(problemTone(1, 'critical'), 'critical');
    assert.equal(problemTone(null, 'critical'), 'neutral');
  });
});
