import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { externalOrigins, launchTarget } from '../src/pages/launcherModel.ts';

describe('launcher targets', () => {
  const origins = externalOrigins({}, { protocol: 'http:', hostname: 'localhost' });

  it('opens in-shell applications on their home screen', () => {
    assert.deepEqual(launchTarget('ECOMMERCE_ADMIN', origins), { kind: 'shell', path: '/orders/control' });
    assert.deepEqual(launchTarget('ACCOUNTING', origins), { kind: 'shell', path: '/accounting/admin' });
    assert.deepEqual(launchTarget('INVENTORY', origins), { kind: 'shell', path: '/inventory' });
    assert.deepEqual(launchTarget('QUALITY_CENTER', origins), { kind: 'shell', path: '/admin/quality-center' });
    assert.deepEqual(launchTarget('RETAIL_POS', origins), { kind: 'shell', path: '/pos' });
  });

  it('opens Super Admin and Delivery on their own sites', () => {
    assert.deepEqual(launchTarget('SUPER_ADMIN', origins), { kind: 'external', url: 'http://localhost:3013' });
    assert.deepEqual(launchTarget('DELIVERY_OPS', origins), { kind: 'external', url: 'http://localhost:3014' });
  });

  it('prefers configured origins', () => {
    const configured = externalOrigins({ VITE_SUPER_ADMIN_URL: 'https://admin.example.com', VITE_DELIVERY_URL: '' },
      { protocol: 'https:', hostname: 'shop.example.com' });
    assert.equal(configured.SUPER_ADMIN, 'https://admin.example.com');
    assert.equal(configured.DELIVERY_OPS, 'https://shop.example.com:3014');
  });

  it('says plainly when an application has no screen', () => {
    assert.equal(launchTarget('VENDOR_PORTAL', origins).kind, 'unavailable');
  });
});
