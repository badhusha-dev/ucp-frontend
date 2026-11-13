import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { passwordProblem, tokenFromHash } from '../src/pages/passwordModel.ts';

describe('tokenFromHash', () => {
  it('reads the token from the fragment', () => {
    assert.equal(tokenFromHash('#token=abcDEF0123456789_-xyzABC'), 'abcDEF0123456789_-xyzABC');
  });
  it('rejects missing, short and unexpected tokens', () => {
    assert.equal(tokenFromHash(''), '');
    assert.equal(tokenFromHash('#token=short'), '');
    assert.equal(tokenFromHash('#token=<script>alert(1)</script>xxxxxxxx'), '');
  });
});

describe('passwordProblem', () => {
  it('enforces length, email name and confirmation', () => {
    assert.match(passwordProblem('short', 'short')!, /12 to 128/);
    assert.match(passwordProblem('x'.repeat(129), 'x'.repeat(129))!, /12 to 128/);
    assert.match(passwordProblem('my-jordan-password', 'my-jordan-password', 'jordan@example.test')!, /email name/);
    assert.match(passwordProblem('Correct-Horse-Battery', 'Correct-Horse-Batter')!, /do not match/);
    assert.equal(passwordProblem('Correct-Horse-Battery', 'Correct-Horse-Battery', 'jordan@example.test'), null);
  });
});
