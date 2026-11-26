import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, MenuItem, IconButton, InputAdornment, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { AddRounded, EditOutlined, SaveRounded } from '@mui/icons-material';
import { ErrorState, LoadingState } from '@ecommerce/shared-library/src/ui/StateViews';
import { posApi, type AuditEntry, type Me, type Register, type Settings } from '../api';
import { GST_STATES, gstinProblem, isUpiId, parseAmount } from '../posModel';
import { GstRatesPanel, TablesPanel } from './SettingsPanels';
import { dateTime } from '../format';
import { BUSINESS_CURRENCIES } from '@ecommerce/shared-library/src/ui/money';

interface Props { me: Me; onSaved: () => void }

/** Store set-up for managers: currency, tax, receipt text, cashier discount limit, registers and the audit trail. */
export function SettingsScreen({ me, onSaved }: Props) {
  const formOf = (st: Settings) => ({ currency: st.currency, tax: String(st.taxRatePercent), header: st.receiptHeader ?? '',
    footer: st.receiptFooter ?? '', limit: String(st.maxCashierDiscountPercent), upiVpa: st.upiVpa ?? '', upiName: st.upiPayeeName ?? '',
    gstEnabled: !!st.gstEnabled, gstin: st.gstin ?? '', legalName: st.legalName ?? '', address: st.storeAddress ?? '', stateCode: st.stateCode ?? '',
    restaurant: !!st.restaurantMode });
  const [form, setForm] = useState(() => formOf(me.settings));
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
  const upiProblem = form.upiVpa.trim() && !isUpiId(form.upiVpa) ? 'A UPI ID looks like storename@bank' : '';
  const gstinIssue = gstinProblem(form.gstin);
  const gstProblem = !form.gstEnabled ? '' : !form.gstin.trim() ? 'Enter the GSTIN to issue GST invoices.' : gstinIssue
    ? gstinIssue : !form.legalName.trim() ? 'Enter the legal name registered for the GSTIN.' : form.currency.trim().toUpperCase() !== 'INR'
      ? 'GST invoices are in rupees: set the currency to INR.' : '';
  const valid = /^[A-Za-z]{3}$/.test(form.currency.trim()) && tax >= 0 && tax <= 100 && limit >= 0 && limit <= 100 && !upiProblem && !gstProblem
    && !(form.gstin.trim() && gstinIssue);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      // Empty text clears a UPI or GST field (null would keep the saved value).
      const gstin = form.gstin.replace(/\s/g, '').toUpperCase();
      const saved: Settings = await posApi.saveSettings({ currency: form.currency.trim().toUpperCase(), taxRatePercent: tax, receiptHeader: form.header.trim() || null,
        receiptFooter: form.footer.trim() || null, maxCashierDiscountPercent: limit, upiVpa: form.upiVpa.trim(), upiPayeeName: form.upiName.trim(),
        gstEnabled: form.gstEnabled, gstin, legalName: form.legalName.trim(), storeAddress: form.address.trim(),
        stateCode: gstin ? gstin.slice(0, 2) : form.stateCode, restaurantMode: form.restaurant });
      setForm(formOf(saved));
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
              <TextField select label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                helperText="Prices, receipts and reports at the till use this currency">
                {Array.from(new Set([form.currency, ...BUSINESS_CURRENCIES])).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField label="Tax rate" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} inputMode="decimal"
                error={!(tax >= 0 && tax <= 100)} helperText="Added to every sale" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} fullWidth />
              <TextField label="Cashier discount limit" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} inputMode="decimal"
                error={!(limit >= 0 && limit <= 100)} helperText="Above this a manager is needed" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} fullWidth />
            </Box>
            <TextField label="Receipt header" value={form.header} onChange={(e) => setForm({ ...form, header: e.target.value })} multiline minRows={2}
              inputProps={{ maxLength: 200 }} placeholder={'Store name\nAddress · Phone · Tax number'} />
            <TextField label="Receipt footer" value={form.footer} onChange={(e) => setForm({ ...form, footer: e.target.value })} multiline minRows={2}
              inputProps={{ maxLength: 300 }} placeholder="Returns within 30 days with this receipt. Thank you!" />
            <Typography fontWeight={800} sx={{ pt: 1 }}>UPI payments</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField label="Store UPI ID" value={form.upiVpa} onChange={(e) => setForm({ ...form, upiVpa: e.target.value.trim() })}
                placeholder="cornerstore@okaxis" error={!!upiProblem} helperText={upiProblem || 'The till shows a QR code that pays this UPI ID'} />
              <TextField label="Name shown in UPI apps" value={form.upiName} onChange={(e) => setForm({ ...form, upiName: e.target.value })}
                inputProps={{ maxLength: 100 }} helperText="Usually the shop name" />
            </Box>

            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 1 }}>
              <Box>
                <Typography fontWeight={800}>GST tax invoices</Typography>
                <Typography variant="caption" color="text.secondary">Receipts print as tax invoices with HSN codes and CGST/SGST or IGST.</Typography>
              </Box>
              <Switch checked={form.gstEnabled} onChange={(e) => setForm({ ...form, gstEnabled: e.target.checked })} inputProps={{ 'aria-label': 'GST tax invoices' }} />
            </Stack>
            {form.gstEnabled && (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <TextField label="GSTIN" value={form.gstin} onChange={(e) => {
                  const gstin = e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 15);
                  setForm({ ...form, gstin, stateCode: gstin.length >= 2 ? gstin.slice(0, 2) : form.stateCode });
                }} error={!!gstinIssue} helperText={gstinIssue || '15 characters, e.g. 29ABCDE1234F1ZW'} />
                <TextField select label="State" value={form.stateCode} disabled helperText="From the first two digits of the GSTIN">
                  <MenuItem value="">—</MenuItem>
                  {GST_STATES.map((st) => <MenuItem key={st.code} value={st.code}>{st.code} · {st.name}</MenuItem>)}
                </TextField>
                <TextField label="Legal name" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} inputProps={{ maxLength: 150 }}
                  helperText="As registered for the GSTIN" />
                <TextField label="Store address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} inputProps={{ maxLength: 300 }} />
              </Box>
            )}
            {gstProblem && <Alert severity="warning" sx={{ py: 0 }}>{gstProblem}</Alert>}

            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 1 }}>
              <Box>
                <Typography fontWeight={800}>Restaurant mode</Typography>
                <Typography variant="caption" color="text.secondary">Adds Tables and Kitchen screens: table orders, kitchen order tickets (KOT) and bills.</Typography>
              </Box>
              <Switch checked={form.restaurant} onChange={(e) => setForm({ ...form, restaurant: e.target.checked })} inputProps={{ 'aria-label': 'Restaurant mode' }} />
            </Stack>

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

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: me.settings.restaurantMode ? '1fr 1fr' : '1fr' }, alignItems: 'start' }}>
        <GstRatesPanel me={me} onError={setError} onNotice={setNotice} />
        {me.settings.restaurantMode && <TablesPanel onError={setError} onNotice={setNotice} />}
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
