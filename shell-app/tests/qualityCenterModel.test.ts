import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { activeStatuses, messageOf, pretty, statusColor } from '../src/pages/qualityCenterModel.ts';

describe('statusColor', () => {
  it('maps outcomes to severity colours', () => {
    assert.equal(statusColor('PASSED'), 'success');
    assert.equal(statusColor('ASSERTION_FAILED'), 'error');
    assert.equal(statusColor('INFRASTRUCTURE_FAILURE'), 'warning');
    assert.equal(statusColor('CANCELLED'), 'warning');
    assert.equal(statusColor('RUNNING'), 'info');
    assert.equal(statusColor(undefined), 'default');
    assert.equal(statusColor('SOMETHING_NEW'), 'default');
  });

  it('treats only in-flight states as active', () => {
    for (const s of ['QUEUED', 'PREFLIGHT', 'RUNNING', 'FINALIZING']) assert.ok(activeStatuses.has(s), s);
    for (const s of ['PASSED', 'FAILED', 'CANCELLED', 'BLOCKED']) assert.ok(!activeStatuses.has(s), s);
  });
});

describe('pretty', () => {
  it('title-cases enum names and shows a dash for empty values', () => {
    assert.equal(pretty('INFRASTRUCTURE_FAILURE'), 'Infrastructure Failure');
    assert.equal(pretty(null), '—');
    assert.equal(pretty(''), '—');
  });
});

describe('messageOf', () => {
  it('prefers the server detail, then message, then the client error', () => {
    assert.equal(messageOf({ response: { data: { detail: 'D', message: 'M' } }, message: 'E' }), 'D');
    assert.equal(messageOf({ response: { data: { message: 'M' } }, message: 'E' }), 'M');
    assert.equal(messageOf({ message: 'E' }), 'E');
    assert.equal(messageOf(undefined), 'Request failed');
  });
});
