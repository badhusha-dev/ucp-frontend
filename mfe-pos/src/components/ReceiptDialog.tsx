import { Box, Button, Dialog, DialogActions, DialogContent, Stack, Typography } from '@mui/material';
import { CheckCircleRounded, PrintRounded } from '@mui/icons-material';
import type { Sale } from '../api';
import { money } from '../format';
import { ReceiptView, printReceipt } from './ReceiptView';

/** Shown right after a sale: change to give, the receipt, print and start the next sale. */
export function ReceiptDialog({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  return (
    <Dialog open={!!sale} onClose={onClose} fullWidth maxWidth="xs" aria-label="Sale complete">
      {sale && (
        <>
          <DialogContent sx={{ bgcolor: '#F8FAFC' }}>
            <Stack alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
              <CheckCircleRounded sx={{ fontSize: 48, color: 'success.main' }} />
              <Typography variant="h6" fontWeight={800}>Sale complete</Typography>
              {sale.changeDue > 0
                ? <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#166534' }}>Give change {money(sale.changeDue, sale.currency)}</Typography>
                : <Typography color="text.secondary">{sale.receiptNumber}</Typography>}
            </Stack>
            <Box><ReceiptView sale={sale} /></Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
            <Button startIcon={<PrintRounded />} onClick={printReceipt}>Print receipt</Button>
            <Button variant="contained" onClick={onClose} autoFocus sx={{ fontWeight: 800, minWidth: 140 }}>New sale</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
