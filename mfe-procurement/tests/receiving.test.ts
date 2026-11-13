import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { billableInvoiceLines, invoiceLinesBody, purchaseOrderBody, purchaseOrderIsValid, receiptBody, remainingReceiptLines } from '../src/receiving.ts';

const order = { lines: [
  { productId: 1, sku: 'A', quantityOrdered: 10, quantityReceived: 4, unitCost: '2.50' },
  { productId: 2, sku: 'B', quantityOrdered: 5, quantityReceived: 5, unitCost: '1.00' },
  { productId: 3, sku: 'C', quantityOrdered: 3, quantityReceived: 0, unitCost: '9.00' },
] };

describe('receiving', () => {
  it('offers only outstanding lines, pre-filled with what is left', () => {
    assert.deepEqual(remainingReceiptLines(order), [
      { productId: 1, quantity: '6', remaining: 6, sku: 'A' },
      { productId: 3, quantity: '3', remaining: 3, sku: 'C' },
    ]);
    assert.deepEqual(remainingReceiptLines({}), []);
  });

  it('sends only positive quantities as numbers', () => {
    assert.deepEqual(receiptBody([{ productId: '1', quantity: '6' }, { productId: '3', quantity: '0' }, { productId: '4', quantity: '' }]),
      [{ productId: 1, quantity: 6 }]);
  });
});

describe('invoicing', () => {
  it('bills received quantities at the ordered cost', () => {
    assert.deepEqual(billableInvoiceLines(order), [
      { productId: 1, quantity: '4', unitCost: '2.50', sku: 'A' },
      { productId: 2, quantity: '5', unitCost: '1.00', sku: 'B' },
    ]);
    assert.deepEqual(invoiceLinesBody([{ productId: '1', quantity: '4', unitCost: '2.50' }, { productId: '2', quantity: '0', unitCost: '1' }]),
      [{ productId: 1, quantity: 4, unitCost: 2.5 }]);
  });
});

describe('purchase orders', () => {
  it('builds the draft body and drops lines without a catalog item', () => {
    const body = purchaseOrderBody('7', '', 'note', [{ supplierProductId: '3', quantity: '2' }, { supplierProductId: '', quantity: '9' }]);
    assert.deepEqual(body, { supplierId: 7, expectedDate: null, note: 'note', lines: [{ supplierProductId: 3, quantity: 2 }] });
    assert.equal(purchaseOrderIsValid(body), true);
  });

  it('rejects drafts without a supplier, lines, or positive quantities', () => {
    assert.equal(purchaseOrderIsValid(purchaseOrderBody('', '', '', [{ supplierProductId: '3', quantity: '2' }])), false);
    assert.equal(purchaseOrderIsValid(purchaseOrderBody('7', '', '', [])), false);
    assert.equal(purchaseOrderIsValid(purchaseOrderBody('7', '', '', [{ supplierProductId: '3', quantity: '0' }])), false);
  });
});
