import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dateInput, tokenClaims, tokenHasAccountingPermission, tokenUserId } from '../src/pages/accountingSession.ts';

function jwt(claims: Record<string, unknown>) {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64(claims) + '.sig';
}

describe('tokenHasAccountingPermission', () => {
  it('grants a listed permission or the wildcard, and nothing else', () => {
    const token = jwt({ role: 'ACCOUNTANT', permissions: ['accounting:read'] });
    assert.equal(tokenHasAccountingPermission(token, 'accounting:read'), true);
    assert.equal(tokenHasAccountingPermission(token, 'accounting:approve'), false);
    assert.equal(tokenHasAccountingPermission(jwt({ role: 'X', permissions: ['*'] }), 'accounting:approve'), true);
  });

  it('lets Super Admin through and falls back to legacy staff roles only without a permission list', () => {
    assert.equal(tokenHasAccountingPermission(jwt({ role: 'SUPER_ADMIN' }), 'anything'), true);
    assert.equal(tokenHasAccountingPermission(jwt({ role: 'MANAGER' }), 'accounting:write'), true);
    assert.equal(tokenHasAccountingPermission(jwt({ role: 'MANAGER', permissions: [] }), 'accounting:write'), false);
    assert.equal(tokenHasAccountingPermission(jwt({ role: 'USER' }), 'accounting:read'), false);
  });

  it('denies missing or malformed tokens', () => {
    assert.equal(tokenHasAccountingPermission(null, 'accounting:read'), false);
    assert.equal(tokenHasAccountingPermission('not-a-jwt', 'accounting:read'), false);
    assert.equal(tokenClaims('a.%%%.c'), null);
  });
});

describe('tokenUserId', () => {
  it('returns a positive numeric id or null', () => {
    assert.equal(tokenUserId(jwt({ id: 42 })), 42);
    assert.equal(tokenUserId(jwt({ id: '7' })), 7);
    assert.equal(tokenUserId(jwt({ id: 0 })), null);
    assert.equal(tokenUserId(jwt({ id: 'abc' })), null);
    assert.equal(tokenUserId(undefined), null);
  });
});

describe('dateInput', () => {
  it('formats local dates as yyyy-mm-dd with padding', () => {
    assert.equal(dateInput(new Date(2026, 0, 5)), '2026-01-05');
    assert.equal(dateInput(new Date(2026, 11, 31)), '2026-12-31');
  });
});
