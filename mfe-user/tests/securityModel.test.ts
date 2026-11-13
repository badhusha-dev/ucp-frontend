import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deviceLabel, eventLabel, isWarningEvent, sessionLabel } from '../src/pages/securityModel.ts';

describe('security labels', () => {
  it('names known events and falls back to readable text', () => {
    assert.equal(eventLabel('SIGN_IN_FAILED'), 'Failed sign-in (wrong password)');
    assert.equal(eventLabel('SOMETHING_NEW'), 'something new');
  });
  it('flags failures and refusals', () => {
    assert.equal(isWarningEvent('SIGN_IN_FAILED'), true);
    assert.equal(isWarningEvent('APPLICATION_ACCESS_DENIED'), true);
    assert.equal(isWarningEvent('SIGN_IN'), false);
  });
  it('describes devices from the user agent', () => {
    assert.equal(deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'), 'Chrome on Windows');
    assert.equal(deviceLabel('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0'), 'Edge on Windows');
    assert.equal(deviceLabel('curl/8.4.0'), 'curl');
    assert.equal(deviceLabel(null), 'Unknown device');
  });
  it('labels account and application sessions', () => {
    assert.equal(sessionLabel({ kind: 'PLATFORM', applicationCode: null, tenant: null }), 'Account sign-in');
    assert.equal(sessionLabel({ kind: 'APPLICATION', applicationCode: 'ECOMMERCE_ADMIN', tenant: 'Client A' }), 'ECOMMERCE_ADMIN · Client A');
  });
});
