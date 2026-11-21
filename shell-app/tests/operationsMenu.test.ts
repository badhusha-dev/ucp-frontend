import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canViewOperations, OPERATIONS_ITEMS, visibleOperations } from '../src/operationsMenu.ts';

const holding = (...granted: string[]) => (permission: string) => granted.includes(permission);

describe('canViewOperations', () => {
  it('shows the menu to roles that only work on orders, returns, pricing, the storefront or the catalog', () => {
    for (const permission of ['order:view', 'return:view', 'pricing:read', 'storefront:read', 'catalog:manage']) {
      assert.equal(canViewOperations(holding(permission)), true, permission);
    }
  });

  it('still shows it for the long-standing operations permissions', () => {
    for (const permission of ['inventory:read', 'stock:read', 'accounting:read', 'crm:read', 'analytics:read', 'orders:manage', 'qa:read']) {
      assert.equal(canViewOperations(holding(permission)), true, permission);
    }
  });

  it('shows Point of Sale to cashiers, store managers and POS analysts', () => {
    for (const permission of ['pos:sell', 'pos:report', 'pos:manage']) {
      const groups = visibleOperations(holding(permission));
      assert.deepEqual(groups.map((g) => g.items.map((i) => i.label)), [['Point of Sale']], permission);
    }
  });

  it('hides it when no item would show', () => {
    assert.equal(canViewOperations(holding()), false);
    assert.equal(canViewOperations(holding('delivery:read', 'profile:read')), false);
  });

  it('lists Order Management and Accounting with the permissions their screens check', () => {
    const byPath = new Map(OPERATIONS_ITEMS.map((item) => [item.path, item.permissions]));
    assert.deepEqual(byPath.get('/orders/control'), ['order:view']);
    assert.deepEqual(byPath.get('/accounting'), ['accounting:read']);
  });
});

describe('visibleOperations', () => {
  it('gives the Super Admin all 18 items in 6 groups, in menu order', () => {
    const groups = visibleOperations(() => true);
    assert.deepEqual(groups.map((g) => g.group), ['Orders', 'Catalog & pricing', 'Inventory & supply', 'Finance & customers', 'Insights & quality', 'Administration']);
    assert.equal(groups.reduce((n, g) => n + g.items.length, 0), 18);
  });

  it('leaves out groups with nothing to open', () => {
    const groups = visibleOperations(holding('order:view', 'return:view'));
    assert.deepEqual(groups.map((g) => g.group), ['Orders']);
    assert.deepEqual(groups[0].items.map((i) => i.label), ['Order Management', 'Returns & Refunds']);
  });

  it('gives every item a unique path and label', () => {
    assert.equal(new Set(OPERATIONS_ITEMS.map((i) => i.path)).size, OPERATIONS_ITEMS.length);
    assert.equal(new Set(OPERATIONS_ITEMS.map((i) => i.label)).size, OPERATIONS_ITEMS.length);
  });
});
