import { Box, Divider, Stack, Typography } from '@mui/material';
import type { Sale } from '../api';
import { PAYMENT_LABELS } from '../posModel';
import { dateTime, money } from '../format';

const row = { display: 'flex', justifyContent: 'space-between', gap: 2 } as const;

/** A till receipt. The same markup is printed (see printReceipt), so it stays narrow and plain. */
export function ReceiptView({ sale }: { sale: Sale }) {
  const m = (value: number) => money(value, sale.currency);
  return (
    <Box className="pos-receipt" sx={{ fontFamily: '"Roboto Mono", ui-monospace, Menlo, Consolas, monospace', fontSize: 13, color: '#0F172A',
      maxWidth: 380, mx: 'auto', bgcolor: '#fff', p: 2.5, borderRadius: 2, border: '1px dashed #CBD5E1' }}>
      <Typography align="center" sx={{ fontFamily: 'inherit', fontWeight: 800, fontSize: 16, whiteSpace: 'pre-line' }}>
        {sale.receiptHeader || 'Receipt'}
      </Typography>
      <Stack spacing={0.25} sx={{ mt: 1, mb: 1.5, color: '#475569' }}>
        <Box sx={row}><span>Receipt</span><strong>{sale.receiptNumber}</strong></Box>
        <Box sx={row}><span>Date</span><span>{dateTime(sale.createdAt)}</span></Box>
        <Box sx={row}><span>Register</span><span>{sale.registerName}</span></Box>
        {sale.cashierEmail && <Box sx={row}><span>Cashier</span><span>{sale.cashierEmail.split('@')[0]}</span></Box>}
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Stack spacing={1} sx={{ my: 1.5 }}>
        {sale.lines.map((line) => (
          <Box key={line.id}>
            <Box sx={row}><span style={{ fontWeight: 600 }}>{line.name}</span><span>{m(line.lineTotal)}</span></Box>
            <Box sx={{ ...row, color: '#64748B', fontSize: 12 }}>
              <span>{line.quantity} × {m(line.unitPrice)}{line.sku ? ` · ${line.sku}` : ''}</span>
              {line.lineDiscount > 0 && <span>−{m(line.lineDiscount)}</span>}
            </Box>
            {line.refundedQuantity > 0 && (
              <Box sx={{ ...row, color: '#B45309', fontSize: 12 }}><span>Refunded {line.refundedQuantity}</span><span>−{m(line.refundedAmount)}</span></Box>
            )}
          </Box>
        ))}
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Stack spacing={0.25} sx={{ my: 1.5 }}>
        <Box sx={row}><span>Subtotal</span><span>{m(sale.subtotal)}</span></Box>
        {sale.discountTotal > 0 && <Box sx={row}><span>Discounts</span><span>−{m(sale.discountTotal)}</span></Box>}
        <Box sx={row}><span>Tax ({Number(sale.taxRatePercent)}%)</span><span>{m(sale.taxTotal)}</span></Box>
        <Box sx={{ ...row, fontSize: 18, fontWeight: 800, mt: 0.5 }}><span>Total</span><span>{m(sale.total)}</span></Box>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Stack spacing={0.25} sx={{ my: 1.5 }}>
        {sale.payments.map((payment, index) => (
          <Box key={index} sx={row}><span>{PAYMENT_LABELS[payment.method]}{payment.reference ? ` (${payment.reference})` : ''}</span><span>{m(payment.amount)}</span></Box>
        ))}
        {sale.changeDue > 0 && <Box sx={{ ...row, fontWeight: 700 }}><span>Change</span><span>{m(sale.changeDue)}</span></Box>}
      </Stack>
      {sale.refunds.length > 0 && (
        <>
          <Divider sx={{ borderStyle: 'dashed' }} />
          <Stack spacing={0.25} sx={{ my: 1.5, color: '#B45309' }}>
            {sale.refunds.map((refund) => (
              <Box key={refund.id} sx={row}><span>{refund.refundNumber} · {PAYMENT_LABELS[refund.method]}</span><span>−{m(refund.amount)}</span></Box>
            ))}
          </Stack>
        </>
      )}
      {sale.customerNote && <Typography sx={{ fontFamily: 'inherit', fontSize: 12, color: '#475569', mb: 1 }}>Note: {sale.customerNote}</Typography>}
      <Typography align="center" sx={{ fontFamily: 'inherit', fontSize: 12, color: '#64748B', whiteSpace: 'pre-line', mt: 1 }}>
        {sale.receiptFooter || 'Thank you for shopping with us!'}
      </Typography>
    </Box>
  );
}

const PRINT_STYLE_ID = 'pos-receipt-print-style';

/** Prints only the open receipt or report (the rest of the page is hidden while printing). */
export function printReceipt() {
  if (!document.getElementById(PRINT_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = PRINT_STYLE_ID;
    style.textContent = `@media print {
  body * { visibility: hidden !important; }
  .pos-receipt, .pos-receipt * { visibility: visible !important; }
  .pos-print-area, .pos-print-area * { visibility: visible !important; }
  .pos-receipt { position: absolute !important; left: 0; top: 0; width: 80mm; max-width: 80mm !important; border: 0 !important; padding: 0 !important; }
  .pos-print-area { position: absolute !important; left: 0; top: 0; width: 100%; }
}`;
    document.head.appendChild(style);
  }
  window.print();
}
