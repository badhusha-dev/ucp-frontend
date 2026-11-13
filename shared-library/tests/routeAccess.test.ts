import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ANY_SIGNED_IN, routeAllowed } from '../src/auth/routeAccess.ts';

describe('routeAllowed', () => {
  it('opens own-account screens to every signed-in role', () => {
    for (const role of ['USER', 'TENANT_OWNER', 'ORDER_MANAGER', 'PLATFORM_AUDITOR']) {
      assert.equal(routeAllowed({ role, permissions: [] }, [ANY_SIGNED_IN]), true, role);
    }
  });

  it('keeps role lists exclusive when no wildcard is given (behaviour before V20)', () => {
    assert.equal(routeAllowed({ role: 'USER', permissions: [] }, ['USER', 'MANAGER']), true);
    assert.equal(routeAllowed({ role: 'ORDER_MANAGER', permissions: [] }, ['USER', 'MANAGER']), false);
    assert.equal(routeAllowed({ role: 'ADMIN', permissions: [] }, ['USER']), true);
  });

  it('requires the permission when one is named, even with the wildcard', () => {
    assert.equal(routeAllowed({ role: 'TENANT_OWNER', permissions: ['crm:read'] }, [ANY_SIGNED_IN], 'qa:read'), false);
    assert.equal(routeAllowed({ role: 'QA_MANAGER', permissions: ['qa:read'] }, ['ADMIN'], 'qa:read'), true);
    assert.equal(routeAllowed({ role: 'USER', permissions: ['*'] }, ['ADMIN'], 'qa:read'), true);
  });

  it('keeps the legacy role fallback only for tokens without a permissions claim', () => {
    assert.equal(routeAllowed({ role: 'MANAGER' }, ['MANAGER'], 'crm:read'), true);
    assert.equal(routeAllowed({ role: 'MANAGER', permissions: [] }, ['MANAGER'], 'crm:read'), false);
  });

  it('always admits the platform super administrator', () => {
    assert.equal(routeAllowed({ role: 'SUPER_ADMIN', permissions: [] }, ['USER'], 'anything'), true);
  });
});
