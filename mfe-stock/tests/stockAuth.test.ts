import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authConfig } from '../src/api/stockAuth.ts';

describe('authConfig', () => {
  it('always sends JSON and the bearer token when present', () => {
    assert.deepEqual(authConfig('t1'), { headers: { Authorization: 'Bearer t1', 'Content-Type': 'application/json' } });
    assert.equal(authConfig(null).headers.Authorization, '');
  });
});
