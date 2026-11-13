import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyticsParams, deltaLabel, TONE_COLORS, trendTone } from '../src/pages/analyticsModel.ts';

describe('analyticsParams', () => {
  it('sends custom dates only when both ends are set', () => {
    assert.deepEqual(analyticsParams('LAST_30_DAYS'), { timeRange: 'LAST_30_DAYS' });
    assert.deepEqual(analyticsParams('CUSTOM', '2026-01-01', '2026-01-31'), { timeRange: 'CUSTOM', startDate: '2026-01-01', endDate: '2026-01-31' });
    assert.deepEqual(analyticsParams('CUSTOM', '2026-01-01', ''), { timeRange: 'CUSTOM' });
    assert.deepEqual(analyticsParams('LAST_7_DAYS', '2026-01-01', '2026-01-31'), { timeRange: 'LAST_7_DAYS' });
  });
});

describe('trendTone', () => {
  it('treats rising as good unless the metric is inverted', () => {
    assert.equal(trendTone('UP'), 'good');
    assert.equal(trendTone('DOWN'), 'bad');
    assert.equal(trendTone('UP', true), 'bad');
    assert.equal(trendTone('DOWN', true), 'good');
    assert.equal(trendTone('FLAT'), 'neutral');
    assert.equal(trendTone('FLAT', true), 'neutral');
  });

  it('has a colour for every tone', () => {
    for (const tone of ['good', 'bad', 'neutral'] as const) assert.ok(TONE_COLORS[tone].color && TONE_COLORS[tone].bg);
  });
});

describe('deltaLabel', () => {
  it('signs positive changes and rounds to one decimal', () => {
    assert.equal(deltaLabel(12.345), '+12.3%');
    assert.equal(deltaLabel(0), '+0.0%');
    assert.equal(deltaLabel(-4.06), '-4.1%');
  });
});
