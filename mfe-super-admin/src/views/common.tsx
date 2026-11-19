import React from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField, Typography,
} from '@mui/material';
import { statusTone } from '../adminModel';

export const cardSx = { border: '1px solid #E4EAF2' } as const;

export function StatusChip({ status, label }: { status: string | null | undefined; label?: string }) {
  return <Chip size="small" label={label ?? (status || '—')} color={statusTone(status)} variant={statusTone(status) === 'default' ? 'outlined' : 'filled'} sx={{ fontWeight: 700 }} />;
}

export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}>
      <Box>
        <Typography variant="overline" color="primary" fontWeight={800}>Super Admin</Typography>
        <Typography variant="h3" component="h1" fontWeight={800} sx={{ letterSpacing: '-.04em', color: '#15243B' }}>{title}</Typography>
        <Typography color="text.secondary" sx={{ mt: .75 }}>{subtitle}</Typography>
      </Box>
      {actions && <Stack direction="row" spacing={1} alignItems="center">{actions}</Stack>}
    </Stack>
  );
}

export function Metric({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'success' | 'warning' | 'error' }) {
  const color = tone === 'error' ? '#B42318' : tone === 'warning' ? '#B54708' : tone === 'success' ? '#067647' : '#15243B';
  return (
    <Box sx={{ ...cardSx, borderRadius: 3, bgcolor: '#fff', p: 2, minWidth: 150, flex: 1 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
    </Box>
  );
}

export interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  /** Ask for an optional reason that is stored in the audit log. */
  withReason?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
}

export function ConfirmDialog({ state, busy, onClose }: { state: ConfirmState | null; busy: boolean; onClose: () => void }) {
  const [reason, setReason] = React.useState('');
  React.useEffect(() => { setReason(''); }, [state]);
  return (
    <Dialog open={Boolean(state)} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="confirm-dialog-title">
      <DialogTitle id="confirm-dialog-title">{state?.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{state?.message}</DialogContentText>
        {state?.withReason && <TextField label="Reason (kept in the audit log)" value={reason} onChange={(event) => setReason(event.target.value)} fullWidth multiline minRows={2} sx={{ mt: 2 }} inputProps={{ maxLength: 240 }} />}
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" color={state?.danger ? 'error' : 'primary'} disabled={busy} onClick={() => state && void state.onConfirm(reason)} sx={{ textTransform: 'none' }}>{state?.confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function errorText(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

/** Saves text as a download (CSV export). */
export function download(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
