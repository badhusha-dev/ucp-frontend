import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission, partnerNext, titleCase } from '../src/deliveryRules.ts';

describe('partnerNext', () => {
  it('follows the partner workflow one step at a time', () => {
    assert.deepEqual(partnerNext('ASSIGNED'), ['ARRIVED_AT_PICKUP']);
    assert.deepEqual(partnerNext('ARRIVED_AT_PICKUP'), ['PICKED_UP', 'PICKUP_FAILED']);
    assert.deepEqual(partnerNext('ARRIVED_AT_DROPOFF'), ['DELIVERED', 'DELIVERY_FAILED']);
  });

  it('offers nothing for terminal or unassigned deliveries', () => {
    for (const s of ['DELIVERED', 'CANCELLED', 'RETURNED', 'CREATED', 'READY_FOR_DISPATCH', 'nonsense']) assert.deepEqual(partnerNext(s), [], s);
  });
});

describe('hasPermission', () => {
  it('requires the exact permission or the wildcard', () => {
    assert.equal(hasPermission(['delivery:dispatch'], 'delivery:dispatch'), true);
    assert.equal(hasPermission(['delivery:read'], 'delivery:dispatch'), false);
    assert.equal(hasPermission(['*'], 'delivery:config'), true);
    assert.equal(hasPermission(undefined, 'delivery:read'), false);
    assert.equal(hasPermission('delivery:read', 'delivery:read'), false);
  });
});

describe('titleCase', () => {
  it('turns enum names into labels', () => {
    assert.equal(titleCase('ARRIVED_AT_DROPOFF'), 'Arrived At Dropoff');
    assert.equal(titleCase(null), '');
  });
});
