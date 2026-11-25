import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Alert, Box, Button, Chip, Container, FormControlLabel, MenuItem, Paper, Radio, RadioGroup, Stack, Switch, TextField, Typography,
} from '@mui/material';
import {
  BUSINESS_CURRENCIES, currencyLocale, decodeTokenClaims, readApplicationSession, rememberBusinessCurrency, rememberDisplayRates, requestToken,
} from '@ecommerce/shared-library';

// Its own client: the settings API needs the client application token (E-commerce Admin session).
const api = axios.create();
api.interceptors.request.use((config) => {
  const token = requestToken((config.baseURL || '') + (config.url || ''));
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Exact amounts in a named currency, never converted to the viewer's display currency.
const plain = (value: number, code: string) => new Intl.NumberFormat(currencyLocale(code), { style: 'currency', currency: code }).format(value);

type Settings = { currency: string; mode: 'SINGLE' | 'MULTIPLE'; displayRates: Record<string, number>; supportedCurrencies: string[] };

const errorText = (e: unknown) => (axios.isAxiosError(e) ? (e.response?.data as { error?: string; message?: string } | undefined)?.error
  ?? (e.response?.data as { message?: string } | undefined)?.message ?? e.message : 'Something went wrong.');

/** Business administrators choose the business currency and whether people may switch screens to other currencies. */
export default function CurrencySettingsPage() {
  const session = readApplicationSession('ECOMMERCE_ADMIN', sessionStorage);
  const permissions = (decodeTokenClaims(session?.token ?? '')?.permissions as string[] | undefined) ?? [];
  const canManage = permissions.includes('tenant:settings.manage') || permissions.includes('*');
  const [saved, setSaved] = useState<Settings | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [mode, setMode] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');
  const [rates, setRates] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = (s: Settings) => {
    setSaved(s); setCurrency(s.currency); setMode(s.mode);
    setRates(Object.fromEntries(Object.entries(s.displayRates).map(([code, rate]) => [code, String(rate)])));
    // Every screen in this browser follows the new settings straight away.
    rememberBusinessCurrency(s.currency); rememberDisplayRates(s.displayRates);
  };
  useEffect(() => { api.get<Settings>('/api/tenant/settings/currency').then((r) => apply(r.data)).catch((e) => setError(errorText(e))); }, []);

  const choices = (saved?.supportedCurrencies ?? BUSINESS_CURRENCIES).filter((code) => code !== currency);
  const ratesProblem = mode === 'MULTIPLE' && (Object.keys(rates).length === 0 || Object.values(rates).some((v) => !(Number(v) > 0)));
  const currencyChanged = saved !== null && currency !== saved.currency;

  const save = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const body = { currency, mode, rates: mode === 'MULTIPLE' ? Object.fromEntries(Object.entries(rates).map(([c, v]) => [c, Number(v)])) : {} };
      const r = await api.put<Settings>('/api/tenant/settings/currency', body);
      apply(r.data);
      setNotice(r.data.mode === 'MULTIPLE'
        ? `Saved. Screens show ${r.data.currency}; people can switch to ${Object.keys(r.data.displayRates).join(', ')} from the header.`
        : `Saved. Every screen shows ${r.data.currency}.`);
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Currency settings</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        The currency your business works in, and whether people may view the screens in other currencies.
      </Typography>
      {!canManage && <Alert severity="info" sx={{ mb: 2 }}>You can view these settings. Ask a business administrator to change them.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Business currency</Typography>
        <TextField select label="Currency" value={currency} disabled={!canManage || !saved} onChange={(e) => setCurrency(e.target.value)}
          helperText="Prices, orders, payments and accounting are kept in this currency." sx={{ minWidth: 260 }}>
          {(saved?.supportedCurrencies ?? BUSINESS_CURRENCIES).map((code) => <MenuItem key={code} value={code}>{code} · {plain(1234.5, code)}</MenuItem>)}
        </TextField>
        {currencyChanged && <Alert severity="warning" sx={{ mt: 2 }}>
          Stored amounts are not converted: existing prices and records keep their numbers and are shown in {currency}. Display currencies are cleared because their rates were set against {saved?.currency}.
        </Alert>}
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Currency mode</Typography>
        <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as 'SINGLE' | 'MULTIPLE')}>
          <FormControlLabel value="SINGLE" disabled={!canManage} control={<Radio />} label={`Single currency: every screen shows ${currency}`} />
          <FormControlLabel value="MULTIPLE" disabled={!canManage} control={<Radio />} label="Multiple currencies: people can switch screens to other currencies from the header" />
        </RadioGroup>
        {mode === 'MULTIPLE' && <Stack spacing={1.5} sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">Switch on each currency and enter how much of it one {currency} buys. Amounts are converted for display only; the Point of Sale keeps its till currency.</Typography>
          {choices.map((code) => {
            const on = code in rates;
            return <Stack key={code} direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Switch checked={on} disabled={!canManage} onChange={(e) => setRates((current) => {
                const next = { ...current };
                if (e.target.checked) next[code] = ''; else delete next[code];
                return next;
              })} />
              <Typography sx={{ width: 48, fontWeight: 700 }}>{code}</Typography>
              {on && <TextField size="small" type="number" label={`1 ${currency} = ? ${code}`} value={rates[code]} disabled={!canManage}
                error={!(Number(rates[code]) > 0)} onChange={(e) => setRates((current) => ({ ...current, [code]: e.target.value }))} sx={{ width: 200 }} />}
              {on && Number(rates[code]) > 0 && <Typography variant="body2" color="text.secondary">{plain(100, currency)} = {plain(100 * Number(rates[code]), code)}</Typography>}
            </Stack>;
          })}
        </Stack>}
      </Paper>

      {saved && <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Now:</Typography>
        <Chip size="small" color="primary" label={`${saved.currency} (business)`} />
        {Object.keys(saved.displayRates).map((code) => <Chip key={code} size="small" variant="outlined" label={code} />)}
      </Stack>}
      {canManage && <Box><Button variant="contained" disabled={busy || !saved || ratesProblem} onClick={() => void save()}>Save currency settings</Button></Box>}
      {ratesProblem && canManage && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>Add at least one currency with a rate above 0, or choose single currency.</Typography>}
    </Container>
  );
}
