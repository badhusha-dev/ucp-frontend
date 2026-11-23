// Till rules the screens share. No runtime imports, so it is unit-tested directly (node --test).
// The server re-prices every sale from the catalog; these helpers only keep the till responsive and explain problems early.

export type PaymentMethod = 'CASH' | 'CARD' | 'OTHER';
export const PAYMENT_METHODS: readonly PaymentMethod[] = ['CASH', 'CARD', 'OTHER'];
export const PAYMENT_LABELS: Record<PaymentMethod, string> = { CASH: 'Cash', CARD: 'Card', OTHER: 'Other' };

export interface CatalogItem {
  id: number;
  sku: string | null;
  name: string;
  price: number | string;
  imageUrl?: string | null;
  category?: string | null;
  available?: number | null;
}

export interface CartLine {
  productId: number;
  sku: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  lineDiscount: number;
  available: number | null;
}

export interface TenderLine { method: PaymentMethod; amount: number; reference?: string }

export type ScreenKey = 'sell' | 'receipts' | 'shift' | 'products' | 'reports' | 'settings';

export const MAX_QUANTITY = 9999;

/** Rounds to cents the way the server does (half up). */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** A number typed by a person ("1,250.5", " 20 "), or NaN. */
export function parseAmount(text: string | number | null | undefined): number {
  if (typeof text === 'number') return text;
  if (text === null || text === undefined) return Number.NaN;
  const clean = String(text).replace(/[,\s]/g, '');
  if (clean === '' || !/^-?\d*(\.\d*)?$/.test(clean)) return Number.NaN;
  return Number(clean);
}

export function addToCart(cart: CartLine[], item: CatalogItem, quantity = 1): CartLine[] {
  const price = round2(Number(item.price));
  const existing = cart.findIndex((line) => line.productId === item.id);
  if (existing >= 0) {
    return cart.map((line, index) => index === existing
      ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + quantity), unitPrice: price, available: item.available ?? line.available }
      : line);
  }
  return [...cart, { productId: item.id, sku: item.sku, name: item.name, unitPrice: price, quantity: Math.min(MAX_QUANTITY, quantity), lineDiscount: 0,
    available: item.available ?? null }];
}

export function setQuantity(cart: CartLine[], productId: number, quantity: number): CartLine[] {
  if (!Number.isFinite(quantity) || quantity <= 0) return cart.filter((line) => line.productId !== productId);
  const whole = Math.min(MAX_QUANTITY, Math.floor(quantity));
  return cart.map((line) => line.productId === productId
    ? { ...line, quantity: whole, lineDiscount: Math.min(line.lineDiscount, round2(line.unitPrice * whole)) }
    : line);
}

export function setLineDiscount(cart: CartLine[], productId: number, discount: number): CartLine[] {
  return cart.map((line) => {
    if (line.productId !== productId) return line;
    const max = round2(line.unitPrice * line.quantity);
    const value = Number.isFinite(discount) ? Math.max(0, Math.min(round2(discount), max)) : 0;
    return { ...line, lineDiscount: value };
  });
}

export function itemCount(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

/** Before tax and cart discount: what the lines add up to while the server quote is on its way. */
export function linesSubtotal(cart: CartLine[]): number {
  return round2(cart.reduce((sum, line) => sum + line.unitPrice * line.quantity - line.lineDiscount, 0));
}

/** Lines asking for more than stock-service last reported on hand. */
export function stockWarnings(cart: CartLine[]): CartLine[] {
  return cart.filter((line) => line.available !== null && line.available !== undefined && line.quantity > line.available);
}

/** The amounts a customer is likely to hand over: exact, then the next round notes. At most five, ascending. */
export function quickCashAmounts(due: number): number[] {
  const exact = round2(due);
  if (exact <= 0) return [];
  const amounts = new Set<number>([exact]);
  for (const step of [1, 5, 10, 20, 50, 100, 500, 1000, 2000]) {
    const next = Math.ceil(exact / step) * step;
    if (next > exact) amounts.add(round2(next));
    if (amounts.size >= 5) break;
  }
  return [...amounts].sort((a, b) => a - b).slice(0, 5);
}

export interface PaymentState {
  paid: number;
  remaining: number;
  change: number;
  nonCash: number;
  canComplete: boolean;
  problem: string | null;
}

/** Mirrors the server: card and other cannot exceed the total (no change from a card); cash over the total is change. */
export function paymentState(due: number, tenders: TenderLine[]): PaymentState {
  const total = round2(due);
  const cash = round2(tenders.filter((t) => t.method === 'CASH').reduce((s, t) => s + t.amount, 0));
  const nonCash = round2(tenders.filter((t) => t.method !== 'CASH').reduce((s, t) => s + t.amount, 0));
  const paid = round2(cash + nonCash);
  const remaining = round2(Math.max(0, total - paid));
  const change = round2(Math.max(0, paid - total));
  let problem: string | null = null;
  if (tenders.some((t) => !(t.amount > 0))) problem = 'Every payment must be above zero.';
  else if (nonCash > total) problem = 'Card and other payments cannot be more than the total.';
  else if (tenders.length === 0 && total > 0) problem = 'Add a payment.';
  else if (remaining > 0) problem = null;
  const canComplete = problem === null && remaining === 0 && (tenders.length > 0 || total === 0);
  return { paid, remaining, change, nonCash, canComplete, problem };
}

/** What the next tender should default to: the amount still owed. */
export function suggestedTender(due: number, tenders: TenderLine[]): number {
  return paymentState(due, tenders).remaining;
}

/** The server's refund rule: a share of the line, and the last units take whatever is left. */
export function refundPreview(lineTotal: number, quantity: number, refundedQuantity: number, refundedAmount: number, refundQuantity: number): number {
  if (refundQuantity <= 0) return 0;
  if (refundedQuantity + refundQuantity >= quantity) return round2(lineTotal - refundedAmount);
  return round2((lineTotal * refundQuantity) / quantity);
}

export function cashVariance(expected: number, counted: number): number {
  return round2(counted - expected);
}

/** Which screens this person sees, from their POS permissions. */
export function screensFor(permissions: readonly string[]): ScreenKey[] {
  const has = (p: string) => permissions.includes(p) || permissions.includes('*');
  const screens: ScreenKey[] = [];
  if (has('pos:sell')) screens.push('sell');
  screens.push('receipts');
  if (has('pos:shift') || has('pos:manage')) screens.push('shift');
  if (has('pos:manage')) screens.push('products');
  if (has('pos:report') || has('pos:manage')) screens.push('reports');
  if (has('pos:manage')) screens.push('settings');
  return screens;
}

export const SCREEN_LABELS: Record<ScreenKey, string> = {
  sell: 'Sell', receipts: 'Receipts', shift: 'Shift', products: 'Products', reports: 'Reports', settings: 'Store settings',
};

/** True for input that looks like a scanned barcode or SKU rather than a name to search for. */
export function looksLikeCode(text: string): boolean {
  const value = text.trim();
  if (value.length < 3 || /\s/.test(value)) return false;
  return /^\d{4,}$/.test(value) || (/\d/.test(value) && /^[A-Za-z0-9._-]+$/.test(value) && value === value.toUpperCase());
}

/** yyyy-mm-dd for a date in the person's own time zone. */
export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type RangeKey = 'today' | 'yesterday' | 'last7' | 'last30';
export const RANGE_LABELS: Record<RangeKey, string> = { today: 'Today', yesterday: 'Yesterday', last7: 'Last 7 days', last30: 'Last 30 days' };

export function dateRange(key: RangeKey, now: Date = new Date()): { from: string; to: string } {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minus = (n: number) => { const d = new Date(day); d.setDate(d.getDate() - n); return d; };
  switch (key) {
    case 'yesterday': return { from: isoDate(minus(1)), to: isoDate(minus(1)) };
    case 'last7': return { from: isoDate(minus(6)), to: isoDate(day) };
    case 'last30': return { from: isoDate(minus(29)), to: isoDate(day) };
    default: return { from: isoDate(day), to: isoDate(day) };
  }
}

/** A short, human message for an API failure. */
export function problemMessage(status: number, body: unknown): string {
  const text = body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string'
    ? (body as { error: string }).error : typeof body === 'string' && body.trim() && body.length < 300 ? body.trim() : '';
  if (status === 401) return 'Your Point of Sale session has ended. Use "Switch workspace" to sign in again.';
  if (status === 403) return text || 'You do not have permission to do that.';
  if (status === 503 || status === 502 || status === 504) return text || 'Point of Sale is not reachable right now. Try again in a moment.';
  if (status === 0) return 'No connection. Check the network and try again.';
  return text || `Something went wrong (${status}).`;
}

export interface Shortage { productId: number; name: string; requested: number; available: number }

/** The details of an OUT_OF_STOCK answer, or null for any other problem. */
export function stockShortage(body: unknown): { items: Shortage[]; canOverride: boolean } | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as { code?: unknown; items?: unknown; canOverride?: unknown };
  if (value.code !== 'OUT_OF_STOCK' || !Array.isArray(value.items)) return null;
  return { items: value.items as Shortage[], canOverride: value.canOverride === true };
}
