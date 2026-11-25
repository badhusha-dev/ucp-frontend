// The Operations menu: its items, their groups and which permissions open them. Kept free of runtime imports so it can
// be unit-tested directly; App.tsx renders it (grouped columns on desktop, a grouped list on small screens).

export type OperationsGroup = 'Orders' | 'Catalog & pricing' | 'Inventory & supply' | 'Finance & customers' | 'Insights & quality' | 'Administration';

/** Group order in the menu. */
export const OPERATIONS_GROUPS: readonly OperationsGroup[] = [
  'Orders', 'Catalog & pricing', 'Inventory & supply', 'Finance & customers', 'Insights & quality', 'Administration',
];

export interface OperationsItem { path: string; label: string; group: OperationsGroup; permissions: readonly string[] }

/**
 * One entry per Operations screen: the item shows when the user has any of its permissions. The Operations button
 * itself shows when at least one item would, so a role that only manages orders, returns, pricing, the storefront or
 * the catalog still gets its screens (the backend re-checks every call).
 */
export const OPERATIONS_ITEMS: readonly OperationsItem[] = [
  { path: '/pos', label: 'Point of Sale', group: 'Orders', permissions: ['pos:sell', 'pos:report', 'pos:manage'] },
  { path: '/orders/control', label: 'Order Management', group: 'Orders', permissions: ['order:view'] },
  { path: '/orders/returns', label: 'Returns & Refunds', group: 'Orders', permissions: ['return:view'] },
  { path: '/orders/admin', label: 'Admin Orders', group: 'Orders', permissions: ['orders:manage'] },
  { path: '/cart/admin/abandoned', label: 'Abandoned Carts', group: 'Orders', permissions: ['orders:manage'] },
  { path: '/products/manage', label: 'Catalog Management', group: 'Catalog & pricing', permissions: ['catalog:manage'] },
  { path: '/products/pricing', label: 'Pricing & Promotions', group: 'Catalog & pricing', permissions: ['pricing:read'] },
  { path: '/products/storefront', label: 'Storefront Management', group: 'Catalog & pricing', permissions: ['storefront:read'] },
  { path: '/inventory', label: 'Inventory & Procurement', group: 'Inventory & supply', permissions: ['inventory:read', 'inventory:view'] },
  { path: '/stock', label: 'Stock', group: 'Inventory & supply', permissions: ['stock:read'] },
  { path: '/procurement', label: 'Suppliers & Procurement', group: 'Inventory & supply', permissions: ['procurement:manage'] },
  { path: '/accounting', label: 'Accounting', group: 'Finance & customers', permissions: ['accounting:read'] },
  { path: '/crm', label: 'Advanced CRM', group: 'Finance & customers', permissions: ['crm:read'] },
  { path: '/analytics', label: 'Analytics', group: 'Insights & quality', permissions: ['analytics:read'] },
  { path: '/admin/quality-center', label: 'Quality Center', group: 'Insights & quality', permissions: ['qa:read'] },
  { path: '/error-stack', label: 'Error Stack', group: 'Insights & quality', permissions: ['errors:manage'] },
  { path: '/profile/admin', label: 'User Admin', group: 'Administration', permissions: ['roles:manage'] },
  { path: '/profile/team', label: 'Client Team', group: 'Administration', permissions: ['tenant:users.read'] },
  { path: '/profile/currency', label: 'Currency Settings', group: 'Administration', permissions: ['tenant:settings.manage'] },
];

/** The groups that hold at least one item this user may open, in menu order, each with its visible items. */
export function visibleOperations(hasPermission: (permission: string) => boolean): Array<{ group: OperationsGroup; items: OperationsItem[] }> {
  return OPERATIONS_GROUPS
    .map((group) => ({ group, items: OPERATIONS_ITEMS.filter((item) => item.group === group && item.permissions.some(hasPermission)) }))
    .filter((entry) => entry.items.length > 0);
}

/** True when the Operations menu would hold at least one item for a user with these permissions. */
export function canViewOperations(hasPermission: (permission: string) => boolean): boolean {
  return OPERATIONS_ITEMS.some((item) => item.permissions.some(hasPermission));
}
