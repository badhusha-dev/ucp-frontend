// Purchase-order receiving and invoicing: which lines can still be received or billed, and the request bodies.

export type Row = Record<string, any>;

export type ReceiptLine = { productId: any; quantity: string; remaining: number; sku: any };
export type InvoiceLine = { productId: any; quantity: string; unitCost: string; sku: any };

/** Lines with quantity still outstanding, pre-filled with the outstanding quantity. */
export function remainingReceiptLines(order: Row): ReceiptLine[] {
  return (order.lines || [])
    .filter((line: Row) => Number(line.quantityOrdered) > Number(line.quantityReceived))
    .map((line: Row) => ({
      productId: line.productId,
      quantity: String(Number(line.quantityOrdered) - Number(line.quantityReceived)),
      remaining: Number(line.quantityOrdered) - Number(line.quantityReceived),
      sku: line.sku,
    }));
}

export function receiptBody(lines: Row[]) {
  return lines.filter(line => Number(line.quantity) > 0).map(line => ({ productId: Number(line.productId), quantity: Number(line.quantity) }));
}

/** Lines that have received stock, pre-filled with the received quantity at the ordered cost. */
export function billableInvoiceLines(order: Row): InvoiceLine[] {
  return (order.lines || [])
    .filter((line: Row) => Number(line.quantityReceived) > 0)
    .map((line: Row) => ({ productId: line.productId, quantity: String(line.quantityReceived), unitCost: String(line.unitCost), sku: line.sku }));
}

export function invoiceLinesBody(lines: Row[]) {
  return lines.filter(line => Number(line.quantity) > 0).map(line => ({ productId: Number(line.productId), quantity: Number(line.quantity), unitCost: Number(line.unitCost) }));
}

export type PurchaseOrderBody = { supplierId: number; expectedDate: string | null; note: string; lines: { supplierProductId: number; quantity: number }[] };

export function purchaseOrderBody(supplierId: string, expectedDate: string, note: string, lines: Row[]): PurchaseOrderBody {
  return {
    supplierId: Number(supplierId),
    expectedDate: expectedDate || null,
    note,
    lines: lines.filter(line => line.supplierProductId).map(line => ({ supplierProductId: Number(line.supplierProductId), quantity: Number(line.quantity) })),
  };
}

/** A draft needs a supplier and at least one line, all with positive quantities. */
export function purchaseOrderIsValid(body: PurchaseOrderBody): boolean {
  return Boolean(body.supplierId) && body.lines.length > 0 && !body.lines.some(line => line.quantity < 1);
}
