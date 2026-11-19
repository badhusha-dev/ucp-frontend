import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  describeChange, holds, humanize, isAccountId, prettyJson, queryString, relativeTime, sectionsFor, statusTone, toCsv, truncate,
} from '../src/adminModel.ts';

describe('sectionsFor', () => {
  it('shows every section to the Super Admin wildcard', () => {
    assert.deepEqual(sectionsFor(['*']).map((s) => s.key), ['clients', 'health', 'users', 'notifications', 'audit']);
  });

  it('shows delegated roles only what their permissions open', () => {
    const agent = ['platform:tenants.read', 'platform:users.read', 'platform:users.manage'];
    assert.deepEqual(sectionsFor(agent).map((s) => s.key), ['clients', 'users']);
    const auditor = ['platform:tenants.read', 'platform:audit.read', 'platform:system.read', 'platform:users.read'];
    assert.deepEqual(sectionsFor(auditor).map((s) => s.key), ['clients', 'health', 'users', 'audit']);
    assert.deepEqual(sectionsFor(undefined), []);
  });

  it('holds checks a permission or the wildcard', () => {
    assert.equal(holds(['a'], 'a'), true);
    assert.equal(holds(['*'], 'anything'), true);
    assert.equal(holds(['a'], 'b'), false);
    assert.equal(holds(undefined, 'a'), false);
  });
});

describe('statusTone and humanize', () => {
  it('colours health, account and dead-letter states', () => {
    assert.equal(statusTone('UP'), 'success');
    assert.equal(statusTone('active'), 'success');
    assert.equal(statusTone('DEGRADED'), 'warning');
    assert.equal(statusTone('LOCKED'), 'warning');
    assert.equal(statusTone('MISSING'), 'error');
    assert.equal(statusTone('FAILED'), 'error');
    assert.equal(statusTone('UNKNOWN'), 'info');
    assert.equal(statusTone(undefined), 'default');
  });

  it('turns codes into words', () => {
    assert.equal(humanize('SIGN_IN_FAILED'), 'Sign in failed');
    assert.equal(humanize('platform:users.manage'), 'Platform:users manage');
    assert.equal(humanize(null), '');
  });
});

describe('relativeTime', () => {
  const now = Date.parse('2026-11-19T12:00:00Z');
  it('describes past and future times', () => {
    assert.equal(relativeTime('2026-11-19T11:59:50Z', now), 'just now');
    assert.equal(relativeTime('2026-11-19T11:55:00Z', now), '5 min ago');
    assert.equal(relativeTime('2026-11-19T09:00:00Z', now), '3 h ago');
    assert.equal(relativeTime('2026-11-17T12:00:00Z', now), '2 d ago');
    assert.equal(relativeTime('2026-11-19T12:15:00Z', now), 'in 15 min');
    assert.equal(relativeTime(null, now), '—');
    assert.equal(relativeTime('not a date', now), 'not a date');
  });
});

describe('queryString and isAccountId', () => {
  it('drops empty values and encodes the rest', () => {
    assert.equal(queryString({ q: ' ann@x.test ', status: '', role: undefined, page: 0, size: 25 }), '?q=ann%40x.test&page=0&size=25');
    assert.equal(queryString({ a: null, b: '  ' }), '');
  });

  it('recognises numeric ids', () => {
    assert.equal(isAccountId(' 42 '), true);
    assert.equal(isAccountId('ann@x.test'), false);
    assert.equal(isAccountId('12a'), false);
  });
});

describe('payload helpers', () => {
  it('pretty-prints JSON text and values, and leaves other text alone', () => {
    assert.equal(prettyJson('{"a":1}'), '{\n  "a": 1\n}');
    assert.equal(prettyJson({ b: true }), '{\n  "b": true\n}');
    assert.equal(prettyJson('plain text'), 'plain text');
    assert.equal(prettyJson(null), '');
  });

  it('summarises what an audit entry changed', () => {
    assert.equal(describeChange({ active: true }, { active: false, reason: 'left' }), 'active: true → false, reason: left');
    assert.equal(describeChange(null, { reason: null, minutes: 15 }), 'minutes: 15');
    assert.equal(describeChange({ lockedUntil: '2026-01-01T00:00:00Z' }, { lockedUntil: null }), 'lockedUntil: 2026-01-01T00:00:00Z → —');
    assert.equal(describeChange({ role: 'USER' }, { role: 'USER' }), '');
  });

  it('writes CSV that spreadsheets read back', () => {
    const csv = toCsv([{ a: 'x', b: 'has, comma', c: { k: 1 } }, { a: 'say "hi"', b: null }], ['a', 'b', 'c']);
    assert.equal(csv, 'a,b,c\r\nx,"has, comma","{""k"":1}"\r\n"say ""hi""",,\r\n');
  });

  it('truncates long single-line previews', () => {
    assert.equal(truncate('a\n  b', 10), 'a b');
    assert.equal(truncate('abcdefghijkl', 5), 'abcd…');
    assert.equal(truncate(undefined), '');
  });
});
