import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authHeaders, txColor } from '../src/loyaltyModel.ts';

describe('authHeaders', () => {
  it('sends the bearer token only when signed in', () => {
    assert.deepEqual(authHeaders('abc'), { Authorization: 'Bearer abc' });
    assert.deepEqual(authHeaders(null), {});
    assert.deepEqual(authHeaders(''), {});
  });
});

describe('txColor', () => {
  it('colours gains, spends and the rest', () => {
    assert.equal(txColor('EARN'), txColor('BONUS'));
    assert.notEqual(txColor('EARN'), txColor('REDEEM'));
    assert.equal(txColor('EXPIRE'), txColor('ADJUST'));
    assert.notEqual(txColor('EXPIRE'), txColor('EARN'));
  });
});
