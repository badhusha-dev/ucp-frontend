import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { roleFromToken } from '../src/pages/roleOf.ts';

function jwt(claims: Record<string, unknown>) {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64(claims) + '.sig';
}

describe('roleFromToken', () => {
  it('normalises the role claim', () => {
    assert.equal(roleFromToken(jwt({ role: 'ROLE_admin' })), 'ADMIN');
    assert.equal(roleFromToken(jwt({ role: 'SUPER_ADMIN' })), 'SUPER_ADMIN');
  });

  it('falls back to USER for missing, roleless or malformed tokens', () => {
    assert.equal(roleFromToken(null), 'USER');
    assert.equal(roleFromToken(jwt({ sub: 'x' })), 'USER');
    assert.equal(roleFromToken('garbage'), 'USER');
    assert.equal(roleFromToken('a.!!!.c'), 'USER');
  });
});
