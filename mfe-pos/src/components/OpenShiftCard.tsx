import { useState } from 'react';
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { LockOpenRounded } from '@mui/icons-material';
import { posApi, type Register, type Shift } from '../api';
import { parseAmount } from '../posModel';

/** Start of the day: pick a register and count the float into the drawer. */
export function OpenShiftCard({ registers, canOpen, currency, onOpened }: {
  registers: Register[]; canOpen: boolean; currency: string; onOpened: (shift: Shift) => void;
}) {
  const free = registers.filter((r) => r.active && !r.openShiftId);
  const [registerId, setRegisterId] = useState(free[0]?.id ?? '');
  const [float, setFloat] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const amount = parseAmount(float);

  const open = async () => {
    setBusy(true);
    setError('');
    try {
      onOpened(await posApi.openShift(registerId, amount));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The shift could not be opened.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: { xs: 4, md: 8 }, px: 2 }}>
      <Paper variant="outlined" sx={{ width: 'min(100%, 460px)', p: { xs: 3, md: 4 }, borderRadius: 4 }}>
        <Stack spacing={2.5}>
          <Box sx={{ width: 56, height: 56, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: 'rgba(79,70,229,.1)', color: 'primary.main' }}>
            <LockOpenRounded fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>Open your shift</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Choose your register and enter the cash you are starting with. You can then ring up sales.
            </Typography>
          </Box>
          {!canOpen && <Alert severity="info">Your role cannot open a shift. Ask a cashier or store manager to open one.</Alert>}
          {canOpen && free.length === 0 && (
            <Alert severity="warning">Every register already has an open shift. Ask a store manager to add a register or close a shift.</Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField select label="Register" value={registerId} onChange={(e) => setRegisterId(e.target.value)} disabled={!canOpen || free.length === 0}>
            {registers.filter((r) => r.active).map((r) => (
              <MenuItem key={r.id} value={r.id} disabled={!!r.openShiftId}>
                {r.name}{r.location ? ` · ${r.location}` : ''}{r.openShiftId ? ` — in use by ${r.openShiftBy ?? 'another cashier'}` : ''}
              </MenuItem>
            ))}
          </TextField>
          <TextField label={`Opening float (${currency})`} value={float} onChange={(e) => setFloat(e.target.value)} inputMode="decimal"
            error={Number.isNaN(amount) || amount < 0} helperText={Number.isNaN(amount) || amount < 0 ? 'Enter the cash in the drawer, 0 or more.' : 'Count the notes and coins in the drawer.'}
            disabled={!canOpen} onKeyDown={(e) => { if (e.key === 'Enter' && registerId && amount >= 0) void open(); }} />
          <Button variant="contained" size="large" onClick={() => void open()} sx={{ minHeight: 52, fontWeight: 800 }}
            disabled={!canOpen || busy || !registerId || Number.isNaN(amount) || amount < 0}>
            {busy ? 'Opening…' : 'Open shift'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
