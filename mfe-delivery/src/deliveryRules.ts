// Delivery partner workflow and display rules (the server enforces the same transitions).

const PARTNER_NEXT: Record<string, string[]> = {
  ASSIGNED: ['ARRIVED_AT_PICKUP'],
  ARRIVED_AT_PICKUP: ['PICKED_UP', 'PICKUP_FAILED'],
  PICKED_UP: ['IN_TRANSIT', 'DELIVERY_FAILED'],
  IN_TRANSIT: ['ARRIVED_AT_DROPOFF', 'DELIVERY_FAILED'],
  ARRIVED_AT_DROPOFF: ['DELIVERED', 'DELIVERY_FAILED'],
};

/** The statuses a delivery partner may move a delivery to next; none once it is terminal. */
export function partnerNext(status: string): string[] {
  return PARTNER_NEXT[status] || [];
}

export const titleCase = (value: unknown) =>
  String(value || '').toLowerCase().replace(/(^|_)([a-z])/g, (_, a, b) => `${a ? ' ' : ''}${b.toUpperCase()}`);

export function hasPermission(permissions: unknown, permission: string): boolean {
  return Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(permission));
}
