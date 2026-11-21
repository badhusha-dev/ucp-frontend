import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, IconButton, InputAdornment, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { AddRounded, EditOutlined, SaveRounded } from '@mui/icons-material';
import { ErrorState, LoadingState } from '@ecommerce/shared-library/src/ui/StateViews';
import { posApi, type AuditEntry, type Me, type Register, type Settings } from '../api';
import { parseAmount } from '../posModel';
import { dateTime } from '../format';

interface Props { me: Me; onSaved: () => void }

/** Store set-up for managers: currency, tax, receipt text, cashier discount limit, registers and the audit trail. */
export function SettingsScreen({ me, onSaved }: Props) {
  const [form, setForm] = useState({ currency: me.settings.currency, tax: String(me.settings.taxRatePercent), header: me.settings.receiptHeader ?? '',
    footer: me.settings.receiptFooter ?? '', limit: String(me.settings.maxCashierDiscountPercent) });
  const [registers, setRegisters] = useState<Register[]>(me.registers);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [newRegister, setNewRegister] = useState({ name: '', location: '' });
  const [editing, setEditing] = useState<{ id: string; name: string; location: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [regs, log] = await Promise.all([posApi.registers(), posApi.audit()]);
      setRegisters(regs);
      setAudit(log);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Settings could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const tax = parseAmount(form.tax);
  const limit = parseAmount(form.limit);
  const valid = /^[A-Za-z]{3}$/.test(form.currency.trim()) && tax >= 0 && tax <= 100 && limit >= 0 && limit <= 100;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const saved: Settings = await posApi.saveSettings({ currency: form.currency.trim().toUpperCase(), taxRatePercent: tax, receiptHeader: form.header.trim() || null,
        receiptFooter: form.footer.trim() || null, maxCashierDiscountPercent: limit });
      setForm({ currency: saved.currency, tax: String(saved.taxRatePercent), header: saved.receiptHeader ?? '', footer: saved.receiptFooter ?? '', limit: String(saved.maxCashierDiscountPercent) });
      setNotice('Store settings saved. New sales use them straight away.');
      onSaved();
      void load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const run = async (action: () => Promise<unknown>, message: string) => {
    setError('');
    try { await action(); setNotice(message); onSaved(); void load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'That did not work.'); }
  };

  return (
    <Stack spacing={2}>
      {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, alignItems: 'start' }}>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800}>Store</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Prices in the catalog are before tax; the till adds this tax rate on every sale.</Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '130px 1fr 1fr' } }}>
              <TextField label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase().slice(0, 3) })}
                helperText="e.g. INR, USD" error={!/^[A-Za-z]{3}$/.test(form.currency.trim())} />
              <TextField label="Tax rate" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} inputMode="decimal"
                error={!(tax >= 0 && tax <= 100)} helperText="Added to every sale" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} fullWidth />
              <TextField label="Cashier discount limit" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} inputMode="decimal"
                error={!(limit >= 0 && limit <= 100)} helperText="Above this a manager is needed" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} fullWidth />
            </Box>
            <TextField label="Receipt header" value={form.header} onChange={(e) => setForm({ ...form, header: e.target.value })} multiline minRows={2}
              inputProps={{ maxLength: 200 }} placeholder={'Store name\nAddress · Phone · Tax number'} />
            <TextField label="Receipt footer" value={form.footer} onChange={(e) => setForm({ ...form, footer: e.target.value })} multiline minRows={2}
              inputProps={{ maxLength: 300 }} placeholder="Returns within 30 days with this receipt. Thank you!" />
            <Box><Button variant="contained" startIcon={<SaveRounded />} disabled={!valid || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save settings'}</Button></Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={800}>Registers</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Each till or counter. One cashier shift can be open on each register.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
            <TextField size="small" label="New register" value={newRegister.name} onChange={(e) => setNewRegister({ ...newRegister, name: e.target.value })} fullWidth inputProps={{ maxLength: 80 }} />
            <TextField size="small" label="Location (optional)" value={newRegister.location} onChange={(e) => setNewRegister({ ...newRegister, location: e.target.value })} fullWidth inputProps={{ maxLength: 120 }} />
            <Button variant="outlined" startIcon={<AddRounded />} disabled={!newRegister.name.trim()} sx={{ flexShrink: 0 }}
              onClick={() => void run(async () => { await posApi.createRegister(newRegister.name.trim(), newRegister.location.trim()); setNewRegister({ name: '', location: '' }); }, 'Register added.')}>
              Add
            </Button>
          </Stack>
          {loading && registers.length === 0 ? <LoadingState layout="lines" rows={3} /> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Register</TableCell><TableCell>Status</TableCell><TableCell align="right">On</TableCell><TableCell /></TableRow></TableHead>
              <TableBody>
                {registers.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell sx={{ minWidth: 150 }}>
                      {editing?.id === r.id ? (
                        <Stack spacing={1}>
                          <TextField size="small" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
                          <TextField size="small" value={editing.location} placeholder="Location" onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="contained" disabled={!editing.name.trim()}
                              onClick={() => void run(async () => { await posApi.updateRegister(r.id, { name: editing.name.trim(), location: editing.location.trim() }); setEditing(null); }, 'Register updated.')}>Save</Button>
                            <Button size="small" onClick={() => setEditing(null)}>Cancel</Button>
                          </Stack>
                        </Stack>
                      ) : (
                        <><Typography fontWeight={700}>{r.name}</Typography>{r.location && <Typography variant="caption" color="text.secondary">{r.location}</Typography>}</>
                      )}
                    </TableCell>
                    <TableCell>{r.openShiftId ? <Chip size="small" color="success" label={`Open · ${r.openShiftBy ?? ''}`} /> : <Chip size="small" label={r.active ? 'Idle' : 'Off'} />}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={r.openShiftId ? 'Close the open shift first' : r.active ? 'Turn off' : 'Turn on'}>
                        <span><Switch checked={r.active} disabled={!!r.openShiftId && r.active}
                          onChange={(e) => void run(() => posApi.updateRegister(r.id, { active: e.target.checked }), e.target.checked ? 'Register turned on.' : 'Register turned off.')} /></span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" aria-label={`Rename ${r.name}`} onClick={() => setEditing({ id: r.id, name: r.name, location: r.location ?? '' })}><EditOutlined fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, overflowX: 'auto' }}>
        <Typography variant="h6" fontWeight={800}>Activity log</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Shifts, cash movements, sales, refunds and setting changes, newest first.</Typography>
        {loading && audit.length === 0 && <LoadingState layout="table" rows={5} />}
        {!loading && error && audit.length === 0 && <ErrorState message={error} onRetry={() => void load()} />}
        {audit.length > 0 && (
          <Table size="small">
            <TableHead><TableRow><TableCell>When</TableCell><TableCell>Who</TableCell><TableCell>What</TableCell><TableCell>Details</TableCell></TableRow></TableHead>
            <TableBody>
              {audit.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateTime(entry.createdAt)}</TableCell>
                  <TableCell>{entry.actorEmail ?? '—'}</TableCell>
                  <TableCell><Chip size="small" variant="outlined" label={entry.action.replaceAll('_', ' ').toLowerCase()} /></TableCell>
                  <TableCell sx={{ maxWidth: 480 }}>{entry.detail ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
