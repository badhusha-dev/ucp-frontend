import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultForm, formFromRow, formToBody, singular, type Resource } from '../src/crmForms.ts';

const contacts: Resource = { key: 'contacts', label: 'Contacts', endpoint: '/api/crm/contacts', title: r => r.displayName,
  fields: [{ key: 'displayName', label: 'Name' }, { key: 'lifecycleStage', label: 'Stage' }, { key: 'tags', label: 'Tags' }, { key: 'companyId', label: 'Company' }] };
const segments: Resource = { key: 'segments', label: 'Segments', endpoint: '/api/crm/segments', title: r => r.name,
  fields: [{ key: 'name', label: 'Name' }, { key: 'lifecycleStage', label: 'Stage' }] };
const tasks: Resource = { key: 'tasks', label: 'Tasks', endpoint: '/api/crm/tasks', title: r => r.title,
  fields: [{ key: 'title', label: 'Title' }, { key: 'dueAt', label: 'Due', type: 'datetime-local' }, { key: 'priority', label: 'Priority' }] };

describe('defaultForm', () => {
  it('pre-fills the documented defaults', () => {
    assert.deepEqual(defaultForm(contacts), { displayName: '', lifecycleStage: 'LEAD', tags: '', companyId: '' });
    assert.equal(defaultForm(tasks).priority, 'NORMAL');
  });
});

describe('formFromRow', () => {
  it('joins tags from arrays, JSON strings and plain strings', () => {
    assert.equal(formFromRow(contacts, { tags: ['vip', 'b2b'] }).tags, 'vip, b2b');
    assert.equal(formFromRow(contacts, { tags: '["a","b"]' }).tags, 'a, b');
    assert.equal(formFromRow(contacts, { tags: 'x,y' }).tags, 'x, y');
  });

  it('reads a segment stage from its criteria and trims due dates to minutes', () => {
    assert.equal(formFromRow(segments, { criteria: '{"lifecycleStage":"PROSPECT"}' }).lifecycleStage, 'PROSPECT');
    assert.equal(formFromRow(segments, { criteria: 'broken' }).lifecycleStage, 'CUSTOMER');
    assert.equal(formFromRow(tasks, { dueAt: '2026-11-02T10:30:45' }).dueAt, '2026-11-02T10:30');
  });

  it('turns missing values into empty strings', () => {
    assert.equal(formFromRow(contacts, { displayName: null }).displayName, '');
  });
});

describe('formToBody', () => {
  it('converts ids and numbers, splits tags and blanks to null', () => {
    assert.deepEqual(formToBody(contacts, { displayName: ' Ann ', lifecycleStage: 'LEAD', tags: ' vip, ,b2b ', companyId: '12' }),
      { displayName: 'Ann', tags: ['vip', 'b2b'], companyId: 12 });
    assert.equal(formToBody(contacts, { displayName: '', lifecycleStage: '', tags: '', companyId: '' }).companyId, null);
  });

  it('moves a segment stage into criteria', () => {
    assert.deepEqual(formToBody(segments, { name: 'VIP', lifecycleStage: 'CUSTOMER' }), { name: 'VIP', criteria: { lifecycleStage: 'CUSTOMER' } });
    assert.deepEqual(formToBody(segments, { name: 'X', lifecycleStage: '' }).criteria, { lifecycleStage: 'CUSTOMER' });
  });
});

describe('singular', () => {
  it('names records for messages', () => {
    assert.equal(singular('opportunities'), 'opportunity');
    assert.equal(singular('unknown'), 'record');
  });
});
