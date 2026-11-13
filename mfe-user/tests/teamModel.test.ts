import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assignableRoles, customRoleKeyProblem, delegationExpiryProblem, errorMessage, expiryFromDateInput,
  isCustomRoleKey, pageCount, roleChipLabel, type RoleTemplate,
} from '../src/pages/teamModel.ts';

describe('expiryFromDateInput', () => {
  it('turns a date into the end of that UTC day', () => {
    assert.equal(expiryFromDateInput('2026-11-30'), '2026-11-30T23:59:59.000Z');
  });
  it('treats an empty field as no expiry', () => {
    assert.equal(expiryFromDateInput('  '), null);
  });
  it('rejects malformed and impossible dates', () => {
    assert.throws(() => expiryFromDateInput('30/11/2026'));
    assert.throws(() => expiryFromDateInput('2026-13-45'));
  });
});

describe('delegationExpiryProblem', () => {
  const now = new Date('2026-11-09T12:00:00Z');
  it('needs an end date in the future within 90 days', () => {
    assert.match(delegationExpiryProblem(null, now)!, /end date/);
    assert.match(delegationExpiryProblem('2026-11-08T00:00:00Z', now)!, /future/);
    assert.match(delegationExpiryProblem('2027-03-01T00:00:00Z', now)!, /90 days/);
    assert.equal(delegationExpiryProblem('2026-11-20T23:59:59Z', now), null);
  });
});

describe('customRoleKeyProblem', () => {
  it('accepts capitals, digits and underscores', () => {
    assert.equal(customRoleKeyProblem('NIGHT_SHIFT'), null);
    assert.equal(customRoleKeyProblem('night_shift'), null);
  });
  it('rejects short, leading-digit and punctuated keys', () => {
    assert.notEqual(customRoleKeyProblem('N'), null);
    assert.notEqual(customRoleKeyProblem('9LIVES'), null);
    assert.notEqual(customRoleKeyProblem('NIGHT-SHIFT'), null);
  });
});

describe('role helpers', () => {
  const role = (key: string, grantable: boolean): RoleTemplate =>
    ({ key, name: key, description: null, custom: false, permissions: [], grantable });
  it('offers only grantable roles', () => {
    assert.deepEqual(assignableRoles([role('A', true), role('B', false)]).map((r) => r.key), ['A']);
  });
  it('labels scope, delegation and expiry', () => {
    assert.equal(roleChipLabel({ id: 1, roleKey: 'ORDER_MANAGER', roleName: 'Order Manager', scopeType: 'TENANT', scopeId: null,
      expiresAt: '2026-11-20T23:59:59Z', delegatedBy: 'boss@x.test' }), 'Order Manager · from boss@x.test · until 2026-11-20');
    assert.equal(roleChipLabel({ id: 2, roleKey: 'ORDER_OPERATOR', roleName: 'Order Operator', scopeType: 'STORE', scopeId: 'S1',
      expiresAt: null, delegatedBy: null }), 'Order Operator · store S1');
  });
  it('recognises stored custom role keys', () => {
    assert.equal(isCustomRoleKey('C_0A1B2C3D4E5F_NIGHT_SHIFT'), true);
    assert.equal(isCustomRoleKey('ORDER_MANAGER'), false);
  });
});

describe('paging and errors', () => {
  it('counts at least one page', () => {
    assert.equal(pageCount(0, 25), 1);
    assert.equal(pageCount(51, 25), 3);
  });
  it('prefers the server message', () => {
    assert.equal(errorMessage({ response: { data: { message: 'No.' } } }, 'fallback'), 'No.');
    assert.equal(errorMessage({ message: 'Network Error' }, 'fallback'), 'Network Error');
    assert.equal(errorMessage(undefined, 'fallback'), 'fallback');
  });
});
