import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addToCart, cashVariance, dateRange, itemCount, linesSubtotal, looksLikeCode, parseAmount, paymentState, problemMessage, quickCashAmounts,
  refundPreview, screensFor, setLineDiscount, setQuantity, stockShortage, stockWarnings, type CatalogItem,
} from '../src/posModel.ts';

const tea: CatalogItem = { id: 1, sku: 'TEA-250', name: 'Assam tea', price: '100.00', available: 3 };
const mug: CatalogItem = { id: 2, sku: 'MUG', name: 'Mug', price: 49.99, available: null };

describe('cart', () => {
  it('adds, merges and counts lines', () => {
    let cart = addToCart([], tea);
    cart = addToCart(cart, mug, 2);
    cart = addToCart(cart, tea);
    assert.equal(cart.length, 2);
    assert.equal(cart[0].quantity, 2);
    assert.equal(itemCount(cart), 4);
    assert.equal(linesSubtotal(cart), 299.98);
  });

  it('removes a line at zero and keeps discounts within the line amount', () => {
    let cart = addToCart(addToCart([], tea, 2), mug);
    cart = setLineDiscount(cart, 1, 500);
    assert.equal(cart[0].lineDiscount, 200);
    cart = setQuantity(cart, 1, 1);
    assert.equal(cart[0].lineDiscount, 100);
    cart = setQuantity(cart, 1, 0);
    assert.deepEqual(cart.map((l) => l.productId), [2]);
  });

  it('warns when the cart wants more than stock shows on hand', () => {
    const cart = addToCart([], tea, 4);
    assert.deepEqual(stockWarnings(cart).map((l) => l.name), ['Assam tea']);
    assert.deepEqual(stockWarnings(addToCart([], mug, 50)), []);
  });
});

describe('payments', () => {
  it('suggests exact cash and the next round notes', () => {
    assert.deepEqual(quickCashAmounts(265.5), [265.5, 266, 270, 280, 300]);
    assert.deepEqual(quickCashAmounts(20), [20, 50, 100, 500, 1000]);
    assert.deepEqual(quickCashAmounts(0), []);
  });

  it('gives change from cash only and refuses card over the total', () => {
    const split = paymentState(265.5, [{ method: 'CARD', amount: 100 }, { method: 'CASH', amount: 200 }]);
    assert.equal(split.change, 34.5);
    assert.equal(split.canComplete, true);
    const short = paymentState(265.5, [{ method: 'CASH', amount: 200 }]);
    assert.equal(short.remaining, 65.5);
    assert.equal(short.canComplete, false);
    const card = paymentState(10, [{ method: 'CARD', amount: 12 }]);
    assert.equal(card.problem, 'Card and other payments cannot be more than the total.');
    assert.equal(paymentState(0, []).canComplete, true);
  });
});

describe('refunds and shifts', () => {
  it('splits a line fairly and the last unit takes the remainder', () => {
    assert.equal(refundPreview(10, 3, 0, 0, 1), 3.33);
    assert.equal(refundPreview(10, 3, 2, 6.66, 1), 3.34);
    assert.equal(refundPreview(212.4, 2, 0, 0, 1), 106.2);
  });

  it('computes the cash variance', () => {
    assert.equal(cashVariance(509.3, 500), -9.3);
    assert.equal(cashVariance(100, 100.5), 0.5);
  });
});

describe('screens and input', () => {
  it('shows screens by permission', () => {
    assert.deepEqual(screensFor(['pos:sell', 'pos:shift']), ['sell', 'receipts', 'shift']);
    assert.deepEqual(screensFor(['pos:report']), ['receipts', 'reports']);
    assert.deepEqual(screensFor(['pos:sell', 'pos:manage']), ['sell', 'receipts', 'shift', 'reports', 'settings']);
  });

  it('tells scanned codes from names', () => {
    assert.equal(looksLikeCode('8901234567890'), true);
    assert.equal(looksLikeCode('TEA-250'), true);
    assert.equal(looksLikeCode('tea'), false);
    assert.equal(looksLikeCode('green tea'), false);
  });

  it('parses typed amounts', () => {
    assert.equal(parseAmount('1,250.50'), 1250.5);
    assert.ok(Number.isNaN(parseAmount('abc')));
    assert.ok(Number.isNaN(parseAmount('')));
  });

  it('builds date ranges in local time', () => {
    const now = new Date(2026, 10, 21, 13, 0);
    assert.deepEqual(dateRange('today', now), { from: '2026-11-21', to: '2026-11-21' });
    assert.deepEqual(dateRange('yesterday', now), { from: '2026-11-20', to: '2026-11-20' });
    assert.deepEqual(dateRange('last7', now), { from: '2026-11-15', to: '2026-11-21' });
  });

  it('explains API problems in plain words', () => {
    assert.equal(problemMessage(400, { error: 'Add a payment.' }), 'Add a payment.');
    assert.match(problemMessage(401, {}), /session has ended/);
    assert.match(problemMessage(503, ''), /not reachable/);
    const shortage = stockShortage({ code: 'OUT_OF_STOCK', canOverride: true, items: [{ productId: 1, name: 'Tea', requested: 2, available: 1 }] });
    assert.equal(shortage?.canOverride, true);
    assert.equal(stockShortage({ error: 'x' }), null);
  });
});
