import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Collapse, IconButton, MenuItem, Stack, Table, TableBody,
  TableCell, TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import { DownloadRounded, ExpandLessRounded, ExpandMoreRounded, SearchRounded } from '@mui/icons-material';
import { request } from '../platformRequest';
import { describeChange, formatDateTime, humanize, prettyJson, queryString, toCsv } from '../adminModel';
import { cardSx, download, errorText, SectionHeader } from './common';

type AuditEntry = {
  id: string; source: 'ACCESS' | 'TENANT' | 'SECURITY'; createdAt: string; actorUserId: number | null; actorEmail: string | null;
  action: string; targetType: string; targetId: string; tenant: string | null; ipAddress: string | null; before: unknown; after: unknown;
};
type AuditPage = { items: AuditEntry[]; page: number; size: number; total: number; actions: string[] };
export type AuditFilters = { q: string; source: string; action: string; actor: string; userId: string; from: string; to: string };

export const EMPTY_FILTERS: AuditFilters = { q: '', source: '', action: '', actor: '', userId: '', from: '', to: '' };

const SOURCE_LABELS: Record<string, string> = { ACCESS: 'Platform access', TENANT: 'Client access', SECURITY: 'Account security' };
const SOURCE_COLORS: Record<string, 'primary' | 'secondary' | 'default'> = { ACCESS: 'primary', TENANT: 'secondary', SECURITY: 'default' };
const EXPORT_COLUMNS = ['createdAt', 'source', 'action', 'actorEmail', 'actorUserId', 'targetType', 'targetId', 'tenant', 'ipAddress', 'before', 'after'];

export default function AuditLogView({ token, initialFilters }: { token: string; initialFilters?: Partial<AuditFilters> }) {
  const [filters, setFilters] = useState<AuditFilters>({ ...EMPTY_FILTERS, ...initialFilters });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(50);
  const [result, setResult] = useState<AuditPage | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const path = (applied: AuditFilters, nextPage: number, nextSize: number) => `/api/platform/audit${queryString({ ...applied, page: nextPage, size: nextSize })}`;

  const load = useCallback(async (applied: AuditFilters, nextPage: number, nextSize: number) => {
    setBusy(true); setError('');
    try { setResult(await request<AuditPage>(path(applied, nextPage, nextSize), token)); }
    catch (cause) { setError(errorText(cause, 'Could not load the audit log.')); }
    finally { setBusy(false); }
  }, [token]);

  useEffect(() => {
    const next = { ...EMPTY_FILTERS, ...initialFilters };
    setFilters(next); setPage(0); void load(next, 0, size);
  }, [initialFilters?.userId, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof AuditFilters) => (event: React.ChangeEvent<HTMLInputElement>) => setFilters((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event: React.FormEvent) => { event.preventDefault(); setPage(0); void load(filters, 0, size); };
  const clear = () => { setFilters(EMPTY_FILTERS); setPage(0); void load(EMPTY_FILTERS, 0, size); };

  const exportCsv = async () => {
    setBusy(true); setError('');
    try {
      const all = await request<AuditPage>(path(filters, 0, 500), token);
      download(`audit-log-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`, toCsv(all.items as unknown as Record<string, unknown>[], EXPORT_COLUMNS));
    } catch (cause) {
      setError(errorText(cause, 'Could not export the audit log.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={3}>
      <SectionHeader title="Audit log" subtitle="Who changed what across platform access, client access and account security, newest first."
        actions={<Button startIcon={<DownloadRounded />} variant="outlined" onClick={() => void exportCsv()} disabled={busy || !result?.total} sx={{ textTransform: 'none' }}>Export CSV</Button>} />
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      <Card sx={cardSx}><CardContent>
        <Stack component="form" onSubmit={submit} spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField label="Search actions, people, targets, details" value={filters.q} onChange={set('q')} fullWidth inputProps={{ 'aria-label': 'Search the audit log' }} />
            <TextField select label="Source" value={filters.source} onChange={set('source')} sx={{ minWidth: 190 }}>
              <MenuItem value="">All sources</MenuItem>
              {Object.entries(SOURCE_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </TextField>
            <TextField select label="Action" value={filters.action} onChange={set('action')} sx={{ minWidth: 230 }}>
              <MenuItem value="">All actions</MenuItem>
              {(result?.actions || []).map((action) => <MenuItem key={action} value={action}>{humanize(action)}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField label="Actor email" value={filters.actor} onChange={set('actor')} fullWidth />
            <TextField label="Account id" value={filters.userId} onChange={set('userId')} sx={{ minWidth: 140 }} inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} />
            <TextField label="From" type="date" value={filters.from} onChange={set('from')} InputLabelProps={{ shrink: true }} sx={{ minWidth: 170 }} />
            <TextField label="To" type="date" value={filters.to} onChange={set('to')} InputLabelProps={{ shrink: true }} sx={{ minWidth: 170 }} />
            <Button type="submit" variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <SearchRounded />} disabled={busy} sx={{ minWidth: 120, textTransform: 'none' }}>Apply</Button>
            <Button onClick={clear} disabled={busy} sx={{ textTransform: 'none' }}>Clear</Button>
          </Stack>
        </Stack>
      </CardContent></Card>
      <Card sx={cardSx}><CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{result ? `${result.total} entr${result.total === 1 ? 'y' : 'ies'}` : ''}</Typography>
        <Table size="small" aria-label="Audit entries">
          <TableHead><TableRow><TableCell /><TableCell>When</TableCell><TableCell>Source</TableCell><TableCell>Action</TableCell><TableCell>By</TableCell><TableCell>Target</TableCell><TableCell>Change</TableCell></TableRow></TableHead>
          <TableBody>
            {(result?.items || []).map((entry) => {
              const open = expanded === entry.id;
              const change = describeChange(entry.before, entry.after);
              return (
                <React.Fragment key={entry.id}>
                  <TableRow hover data-testid={`audit-${entry.id}`}>
                    <TableCell padding="checkbox"><IconButton size="small" aria-label={open ? 'Hide details' : 'Show details'} onClick={() => setExpanded(open ? null : entry.id)}>{open ? <ExpandLessRounded /> : <ExpandMoreRounded />}</IconButton></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(entry.createdAt)}</TableCell>
                    <TableCell><Chip size="small" label={SOURCE_LABELS[entry.source] || entry.source} color={SOURCE_COLORS[entry.source] || 'default'} variant="outlined" /></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={700}>{entry.action}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{entry.actorEmail || '—'}</Typography>{entry.ipAddress && <Typography variant="caption" color="text.secondary">{entry.ipAddress}</Typography>}</TableCell>
                    <TableCell><Typography variant="body2">{humanize(entry.targetType)} {entry.targetId}</Typography>{entry.tenant && <Typography variant="caption" color="text.secondary">{entry.tenant}</Typography>}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}><Typography variant="body2" color="text.secondary" noWrap title={change}>{change || '—'}</Typography></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
                      <Collapse in={open} unmountOnExit>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ py: 2 }}>
                          {(['before', 'after'] as const).map((key) => (
                            <Box key={key} sx={{ flex: 1 }}>
                              <Typography variant="caption" fontWeight={800} color="text.secondary">{key === 'before' ? 'Before' : 'After'}</Typography>
                              <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E4EAF2', borderRadius: 2, overflow: 'auto', fontSize: 12 }}>{prettyJson(entry[key]) || '—'}</Box>
                            </Box>
                          ))}
                        </Stack>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
            {result && !result.items.length && <TableRow><TableCell colSpan={7}><Typography color="text.secondary" align="center" sx={{ py: 3 }}>No audit entries match.</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
        {result && <TablePagination component="div" count={result.total} page={page} rowsPerPage={size} rowsPerPageOptions={[25, 50, 100, 200]}
          onPageChange={(_, next) => { setPage(next); void load(filters, next, size); }}
          onRowsPerPageChange={(event) => { const next = Number(event.target.value); setSize(next); setPage(0); void load(filters, 0, next); }} />}
      </CardContent></Card>
    </Stack>
  );
}
