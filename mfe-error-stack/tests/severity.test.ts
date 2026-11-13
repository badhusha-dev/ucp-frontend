import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { severityColor, statusColors } from '../src/severity.ts';

describe('severityColor', () => {
  it('distinguishes each severity and falls back for unknown ones', () => {
    const colors = ['CRITICAL', 'ERROR', 'WARNING', 'INFO'].map(severityColor);
    assert.equal(new Set(colors).size, 4);
    assert.equal(severityColor('INFO'), severityColor('ANYTHING'));
  });
});

describe('statusColors', () => {
  it('gives every triage status its own colours', () => {
    const statuses = ['NEW', 'INVESTIGATING', 'RESOLVED', 'IGNORED'];
    assert.equal(new Set(statuses.map(s => statusColors(s).text)).size, statuses.length);
    assert.deepEqual(statusColors('UNKNOWN'), { bg: '#E2E8F0', text: '#475569' });
  });
});
