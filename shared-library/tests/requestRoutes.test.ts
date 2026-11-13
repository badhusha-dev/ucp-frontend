import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applicationForRequest, pickToken, requestPath } from '../src/auth/requestRoutes.ts';

describe('requestPath', () => {
  it('extracts the path from absolute and relative URLs', () => {
    assert.equal(requestPath('http://localhost:8080/api/crm/contacts?size=5'), '/api/crm/contacts');
    assert.equal(requestPath('/api/procurement' + '/suppliers'), '/api/procurement/suppliers');
    assert.equal(requestPath('api/orders/admin/orders'), '/api/orders/admin/orders');
    assert.equal(requestPath('/api/procurement//suppliers#x'), '/api/procurement/suppliers');
  });
});

describe('applicationForRequest', () => {
  it('maps tenant-scoped admin APIs to their application', () => {
    assert.equal(applicationForRequest('/api/products/admin/pricing/dashboard'), 'ECOMMERCE_ADMIN');
    assert.equal(applicationForRequest('/api/orders/admin/analytics/overview'), 'ECOMMERCE_ADMIN');
    assert.equal(applicationForRequest('/api/stock/admin/items'), 'ECOMMERCE_ADMIN');
    assert.equal(applicationForRequest('/api/crm/contacts'), 'ECOMMERCE_ADMIN');
    assert.equal(applicationForRequest('/api/errors/admin/overview'), 'ECOMMERCE_ADMIN');
    assert.equal(applicationForRequest('/api/procurement/suppliers'), 'ECOMMERCE_ADMIN');
    assert.equal(applicationForRequest('/api/procurement/ucp/suppliers'), 'INVENTORY');
    assert.equal(applicationForRequest('/api/accounting/admin/ledger'), 'ACCOUNTING');
    assert.equal(applicationForRequest('/api/admin/qa/runs'), 'QUALITY_CENTER');
    assert.equal(applicationForRequest('/api/loyalty/admin/stats'), 'ECOMMERCE_ADMIN');
    assert.equal(applicationForRequest('/api/loyalty/42/bonus'), 'ECOMMERCE_ADMIN');
    assert.equal(applicationForRequest('/api/tenant/team/members?page=0'), 'ECOMMERCE_ADMIN');
    assert.equal(applicationForRequest('/api/tenant/delegations/mine'), 'ECOMMERCE_ADMIN');
  });

  it('keeps the platform token for storefront, own-account and non-tenant APIs', () => {
    for (const url of ['/api/products', '/api/products/7', '/api/cart', '/api/orders/checkout', '/api/orders/5',
      '/api/orders', '/api/users/42', '/api/loyalty/42', '/api/loyalty/42/transactions', '/api/errors/ingest',
      '/api/accounting/balance', '/api/products/admin/analytics/inventory', '/api/stock/101']) {
      assert.equal(applicationForRequest(url), undefined, url);
    }
  });

  it('does not match look-alike prefixes', () => {
    assert.equal(applicationForRequest('/api/crmx/contacts'), undefined);
    assert.equal(applicationForRequest('/api/orders/administrator'), undefined);
    assert.equal(applicationForRequest('/api/tenants'), undefined);
  });
});

describe('pickToken', () => {
  const local = { getItem: (k: string) => (k === 'jwt_token' ? 'platform-token' : null) };
  const sessions = (app: string) => (app === 'ECOMMERCE_ADMIN' ? 'ecom-token' : null);

  it('uses the application session for admin APIs and fails closed without one', () => {
    assert.equal(pickToken('/api/crm/contacts', sessions, local), 'ecom-token');
    assert.equal(pickToken('/api/admin/qa/runs', sessions, local), null);
  });

  it('uses the platform token elsewhere', () => {
    assert.equal(pickToken('/api/cart', sessions, local), 'platform-token');
    assert.equal(pickToken('/api/cart', sessions, { getItem: () => null }), null);
  });
});
