// The Retail POS API (pos-service, through the gateway). Every call carries the RETAIL_POS session token.
import { requestToken } from '@ecommerce/shared-library';
import type {
  AdminProduct, CatalogAdminApi, CatalogCategory, CatalogImage, SaveResult,
} from '@ecommerce/shared-library/src/ui/productCatalog';
import { problemMessage, type CatalogItem, type PaymentMethod } from './posModel';

export const POS_API = '/api/pos';

export class PosApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, body: unknown) {
    super(problemMessage(status, body));
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<{ body: T; headers: Headers }> {
  const url = POS_API + path;
  const token = requestToken(url);
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // A FormData body sets its own multipart content type (with the boundary).
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new PosApiError(0, null);
  }
  const text = await response.text();
  let body: unknown = text;
  if (text) {
    try { body = JSON.parse(text); } catch { /* plain text answer */ }
  }
  if (!response.ok) throw new PosApiError(response.status, body);
  return { body: (text ? body : undefined) as T, headers: response.headers };
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await request<T>(path, init)).body;
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });
const query = (params: Record<string, string | number | undefined | null>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : '';
};

export const zone = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
})();

// ---- Types (pos-service PosViews) -------------------------------------------------------------------------------

export interface Settings {
  currency: string;
  taxRatePercent: number;
  receiptHeader: string | null;
  receiptFooter: string | null;
  maxCashierDiscountPercent: number;
}

export interface Register { id: string; name: string; location: string | null; active: boolean; openShiftId: string | null; openShiftBy: string | null }

export interface Shift {
  id: string; registerId: string; registerName: string; status: 'OPEN' | 'CLOSED'; openedBy: number; openedByEmail: string | null;
  openedAt: string; openingFloat: number; closedAt: string | null; expectedCash: number | null; countedCash: number | null;
  cashVariance: number | null; closeNote: string | null;
}

export interface ShiftReport {
  shift: Shift; salesCount: number; grossSales: number; discounts: number; tax: number; refundsCount: number; refundsTotal: number;
  netSales: number; takings: Record<PaymentMethod, number>; cashSales: number; cashRefunds: number; cashIn: number; cashOut: number;
  expectedCash: number;
}

export interface Me {
  userId: number; email: string; role: string; tenantId: string; permissions: string[]; currentShift: Shift | null;
  settings: Settings; registers: Register[];
}

export interface SaleLine {
  id: string; lineNo: number; productId: number; sku: string | null; name: string; unitPrice: number; quantity: number;
  lineDiscount: number; lineTotal: number; refundedQuantity: number; refundedAmount: number;
}

export interface Payment { method: PaymentMethod; amount: number; reference: string | null }
export interface Refund { id: string; refundNumber: string; method: PaymentMethod; amount: number; reason: string; restocked: boolean; createdByEmail: string | null; createdAt: string }

export interface Sale {
  id: string; receiptNumber: string; status: 'COMPLETED' | 'PARTIALLY_REFUNDED' | 'REFUNDED'; createdAt: string; shiftId: string;
  registerId: string; registerName: string; cashierEmail: string | null; currency: string; subtotal: number; discountTotal: number;
  taxRatePercent: number; taxTotal: number; total: number; paidTotal: number; changeDue: number; refundedTotal: number;
  customerNote: string | null; lines: SaleLine[]; payments: Payment[]; refunds: Refund[]; receiptHeader: string | null; receiptFooter: string | null;
}

export interface SaleSummary { id: string; receiptNumber: string; status: Sale['status']; createdAt: string; cashierEmail: string | null; total: number; refundedTotal: number; itemCount: number }

export interface QuoteLine { input: { productId: number; quantity: number }; gross: number; lineDiscount: number; cartDiscountShare: number; taxShare: number; lineTotal: number }
export interface Quote {
  totals: { lines: QuoteLine[]; subtotal: number; lineDiscounts: number; cartDiscount: number; discountTotal: number; taxRatePercent: number; taxTotal: number; total: number };
  currency: string; needsDiscountPermission: boolean; needsManager: boolean;
}

export interface Summary {
  from: string; to: string; currency: string; salesCount: number; grossSales: number; refunds: number; netSales: number; tax: number;
  discounts: number; averageSale: number; takings: Record<PaymentMethod, number>; topProducts: { productId: number; name: string; quantity: number; amount: number }[];
  stockMovesPending: number; stockMovesRejected: number;
}

export interface StockMove { id: string; productId: number; delta: number; reference: string; status: 'PENDING' | 'DONE' | 'REJECTED'; attempts: number; lastError: string | null; createdAt: string }
export interface AuditEntry { id: string; actorEmail: string | null; action: string; targetType: string; targetId: string; detail: string | null; createdAt: string }

export interface SaleLineRequest { productId: number; quantity: number; lineDiscount?: number }
export interface CartPricing { lines: SaleLineRequest[]; cartDiscountType: 'PERCENT' | 'AMOUNT'; cartDiscountValue: number }

// ---- Calls --------------------------------------------------------------------------------------------------------

export const posApi = {
  me: () => call<Me>('/me'),
  registers: () => call<Register[]>('/registers'),
  currentShift: () => call<{ shift?: Shift; report?: ShiftReport }>('/shifts/current'),
  openShift: (registerId: string, openingFloat: number) => call<Shift>('/shifts', json('POST', { registerId, openingFloat })),
  cashMovement: (shiftId: string, type: 'CASH_IN' | 'CASH_OUT', amount: number, reason: string) =>
    call<ShiftReport>(`/shifts/${shiftId}/cash-movements`, json('POST', { type, amount, reason })),
  closeShift: (shiftId: string, countedCash: number, note: string) => call<ShiftReport>(`/shifts/${shiftId}/close`, json('POST', { countedCash, note })),
  shiftReport: (shiftId: string) => call<ShiftReport>(`/shifts/${shiftId}/report`),
  recentShifts: () => call<Shift[]>('/shifts?limit=30'),
  catalog: (search: string, size = 36) => call<CatalogItem[]>(`/catalog${query({ query: search.trim() || undefined, size })}`),
  lookup: (code: string) => call<CatalogItem>(`/catalog/lookup${query({ code: code.trim() })}`),
  quote: (pricing: CartPricing) => call<Quote>('/sales/quote', json('POST', pricing)),
  sell: (pricing: CartPricing & { payments: { method: PaymentMethod; amount: number; reference?: string }[]; customerNote?: string; idempotencyKey: string; allowOutOfStock?: boolean }) =>
    call<Sale>('/sales', json('POST', pricing)),
  sales: (params: { from?: string; to?: string; query?: string; shiftId?: string }) =>
    call<SaleSummary[]>(`/sales${query({ ...params, zone, limit: 200 })}`),
  sale: (id: string) => call<Sale>(`/sales/${id}`),
  saleByReceipt: (receipt: string) => call<Sale>(`/sales/by-receipt/${encodeURIComponent(receipt.trim())}`),
  refund: (saleId: string, body: { lines: { saleLineId: string; quantity: number }[]; method: PaymentMethod; reason: string; restock: boolean }) =>
    call<Sale>(`/sales/${saleId}/refunds`, json('POST', body)),
  summary: (from: string, to: string) => call<Summary>(`/reports/summary${query({ from, to, zone })}`),
  stockMoves: (status?: string) => call<StockMove[]>(`/stock-moves${query({ status, limit: 50 })}`),
  retryStockMoves: () => call<{ queued: number }>('/stock-moves/retry', json('POST', {})),
  settings: () => call<Settings>('/settings'),
  saveSettings: (settings: Settings) => call<Settings>('/settings', json('PUT', settings)),
  createRegister: (name: string, location: string) => call<Register>('/registers', json('POST', { name, location })),
  updateRegister: (id: string, patch: { name?: string; location?: string; active?: boolean }) => call<Register>(`/registers/${id}`, json('PUT', patch)),
  audit: () => call<AuditEntry[]>('/audit?limit=100'),
};

/** Products for store managers (pos:manage): the shared product manager, backed by /api/pos/products. */
export const posCatalogApi: CatalogAdminApi = {
  list: async ({ query: text, status, page, size }) => {
    const data = await call<{ content: AdminProduct[]; totalElements: number }>(`/products${query({ query: text || undefined, status, page, size })}`);
    return { items: data.content ?? [], total: data.totalElements ?? 0 };
  },
  categories: async () => {
    const response = await fetch('/api/products/categories');
    return response.ok ? ((await response.json()) as CatalogCategory[]) : [];
  },
  images: (id) => call<CatalogImage[]>(`/products/${id}/images`),
  stock: async (ids) => {
    const response = await fetch('/api/stock/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ids) });
    if (!response.ok) return {};
    const rows = (await response.json()) as { productId: number; stockQuantity: number }[];
    return Object.fromEntries(rows.map((row) => [row.productId, row.stockQuantity ?? 0]));
  },
  uploadImage: (file) => {
    const form = new FormData();
    form.append('file', file);
    return call<CatalogImage>('/products/images', { method: 'POST', body: form });
  },
  create: async (body) => saved(await request<AdminProduct>('/products', json('POST', body))),
  update: async (id, body) => saved(await request<AdminProduct>(`/products/${id}`, json('PUT', body))),
  archive: async (id) => { await call<void>(`/products/${id}`, { method: 'DELETE' }); },
  restore: async (id) => { await call<AdminProduct>(`/products/${id}/restore`, json('POST', {})); },
};

function saved(response: { body: AdminProduct; headers: Headers }): SaveResult {
  return { product: response.body, warning: response.headers.get('X-Stock-Warning') };
}

/** A key that makes a retried "Complete sale" save the sale only once. */
export function newIdempotencyKey(): string {
  try { return `pos-${crypto.randomUUID()}`; } catch { return `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}
