// Product catalog administration: search, filter, add, edit (photos, price, stock), archive and restore.
// Shared by Catalog Management (E-commerce Admin) and the POS Products screen; each passes its own API adapter.
// Import by path ('@ecommerce/shared-library/src/ui/ProductCatalogManager') so it uses the screen's own MUI and theme.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, LinearProgress, Menu, MenuItem, Paper,
  Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography,
} from '@mui/material';
import {
  AddRounded, ArchiveOutlined, CategoryOutlined, DownloadRounded, EditOutlined, ImageOutlined, RefreshRounded, RestoreRounded, SearchRounded, UploadFileRounded,
} from '@mui/icons-material';
import { formatAmount } from './format';
import { EmptyState, ErrorState, LoadingState } from './StateViews';
import { ProductEditorDialog } from './ProductEditorDialog';
import { CategoryManagerDialog } from './CategoryManagerDialog';
import {
  BULK_ACTIONS, bulkChange, bulkProblem, bulkSummary, importFileProblem, importHeadline, importRowsForReview, stockTone,
  type AdminProduct, type BulkAction, type CatalogAdminApi, type CatalogCategory, type DownloadedFile, type FileFormat, type ImportReport,
  type ProductStatus, type SaveResult,
} from './productCatalog';
import { businessCurrency } from './money';

export type { CatalogAdminApi } from './productCatalog';

interface Props {
  api: CatalogAdminApi;
  canManage: boolean;
  canManageStock: boolean;
  currency?: string;
  title?: string;
  subtitle?: string;
}

const STATUS_LABELS: Record<ProductStatus, string> = { active: 'Active', archived: 'Archived', all: 'All' };

function errorText(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

/** Saves a downloaded file in the browser. */
export function saveFile(file: DownloadedFile) {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000); // revoking at once can cancel the download
}

const ACTION_LABELS: Record<string, { label: string; color: 'success' | 'info' | 'default' | 'error' }> = {
  CREATE: { label: 'New', color: 'success' }, UPDATE: { label: 'Update', color: 'info' }, UNCHANGED: { label: 'No change', color: 'default' },
  VARIANT: { label: 'Variant', color: 'default' }, ERROR: { label: 'Problem', color: 'error' },
};

/** Import: choose a CSV or Excel file, see what would change (nothing is saved), then import it all at once. */
function CatalogImportDialog({ api, open, onClose, onImported }: { api: CatalogAdminApi; open: boolean; onClose: () => void; onImported: (report: ImportReport) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setFile(null); setReport(null); setFailure(''); } }, [open]);

  const check = async (chosen: File) => {
    const problem = importFileProblem(chosen);
    setFile(chosen);
    setReport(null);
    setFailure(problem ?? '');
    if (problem || !api.importCatalog) return;
    setBusy(true);
    try { setReport(await api.importCatalog(chosen, true)); } catch (cause) { setFailure(errorText(cause, 'The file could not be checked.')); } finally { setBusy(false); }
  };

  const commit = async () => {
    if (!file || !api.importCatalog) return;
    setBusy(true);
    setFailure('');
    try {
      const result = await api.importCatalog(file, false);
      if (result.committed) onImported(result);
      else setReport(result);
    } catch (cause) {
      setFailure(errorText(cause, 'The file could not be imported.'));
    } finally {
      setBusy(false);
    }
  };

  const template = async (format: FileFormat) => {
    if (!api.importTemplate) return;
    try { saveFile(await api.importTemplate(format)); } catch (cause) { setFailure(errorText(cause, 'The template could not be downloaded.')); }
  };

  const rows = report ? importRowsForReview(report) : [];
  const changes = report ? report.created + report.updated : 0;
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md" aria-labelledby="catalog-import-title">
      <DialogTitle id="catalog-import-title" sx={{ fontWeight: 800 }}>Import products</DialogTitle>
      <DialogContent dividers>
        <Typography color="text.secondary" sx={{ mb: 1.5 }}>
          Upload a CSV or Excel (.xlsx) file with one row per product. Rows are matched by <b>id</b> (from an export) or <b>sku</b>: matching products are updated,
          others are added. Empty cells keep the current value. For variants, add rows with <b>parent_sku</b> set to the product's SKU; they replace that product's variants.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button size="small" startIcon={<DownloadRounded />} onClick={() => void template('xlsx')}>Excel template</Button>
          <Button size="small" startIcon={<DownloadRounded />} onClick={() => void template('csv')}>CSV template</Button>
        </Stack>
        <Box role="button" tabIndex={0} aria-label="Choose a file to import" onClick={() => input.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void check(f); }}
          sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 3, p: 2.5, textAlign: 'center', cursor: 'pointer', bgcolor: '#F8FAFC', '&:hover': { borderColor: 'primary.main' } }}>
          <UploadFileRounded color="primary" sx={{ fontSize: 32 }} />
          <Typography fontWeight={700}>{file ? file.name : 'Drop a file here or click to choose'}</Typography>
          <Typography variant="caption" color="text.secondary">CSV or .xlsx, up to 5 MB and 5,000 rows. Choosing a file only checks it.</Typography>
          <input ref={input} type="file" hidden accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void check(f); e.target.value = ''; }} />
        </Box>
        {busy && <LinearProgress sx={{ mt: 2 }} />}
        {failure && <Alert severity="error" sx={{ mt: 2 }}>{failure}</Alert>}
        {report && (
          <Box sx={{ mt: 2 }}>
            <Alert severity={report.errorRows > 0 ? 'error' : changes === 0 ? 'info' : 'success'} sx={{ mb: 1.5 }}>{importHeadline(report)}</Alert>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
              <Chip size="small" color="success" label={`${report.created} new`} />
              <Chip size="small" color="info" label={`${report.updated} updated`} />
              <Chip size="small" label={`${report.unchanged} unchanged`} />
              {report.variantRows > 0 && <Chip size="small" label={`${report.variantRows} variant rows`} />}
              {report.errorRows > 0 && <Chip size="small" color="error" label={`${report.errorRows} with problems`} />}
            </Stack>
            {report.warnings.map((w) => <Alert key={w} severity="warning" sx={{ mb: 1, py: 0 }}>{w}</Alert>)}
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 340 }}>
              <Table size="small" stickyHeader aria-label="Rows in the file">
                <TableHead><TableRow><TableCell>Line</TableCell><TableCell>SKU</TableCell><TableCell>Product</TableCell><TableCell>Result</TableCell><TableCell>Problem</TableCell></TableRow></TableHead>
                <TableBody>
                  {rows.slice(0, 300).map((row) => (
                    <TableRow key={`${row.line}-${row.sku}`}>
                      <TableCell>{row.line}</TableCell>
                      <TableCell>{row.sku || '—'}{row.parentSku && <Typography variant="caption" display="block" color="text.secondary">of {row.parentSku}</Typography>}</TableCell>
                      <TableCell>{row.name || '—'}</TableCell>
                      <TableCell><Chip size="small" label={ACTION_LABELS[row.action]?.label ?? row.action} color={ACTION_LABELS[row.action]?.color ?? 'default'} /></TableCell>
                      <TableCell sx={{ color: 'error.main' }}>{row.errors.join(' ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {rows.length > 300 && <Typography variant="caption" color="text.secondary">Showing the first 300 of {rows.length} rows (problems first).</Typography>}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>Close</Button>
        <Button variant="contained" disabled={busy || !report || report.errorRows > 0 || changes === 0} onClick={() => void commit()} sx={{ fontWeight: 800 }}>
          {busy && report ? 'Importing…' : `Import ${changes} product${changes === 1 ? '' : 's'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ProductCatalogManager({ api, canManage, canManageStock, currency = businessCurrency(), title = 'Products', subtitle }: Props) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [stock, setStock] = useState<Record<number, number>>({});
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState('');
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [confirm, setConfirm] = useState<AdminProduct | null>(null);
  const [notice, setNotice] = useState<{ text: string; severity: 'success' | 'warning' | 'error' } | null>(null);
  // Bulk edit and import / export, when the screen's API offers them.
  const canBulk = canManage && typeof api.bulkUpdate === 'function';
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction | ''>('');
  const [bulkValue, setBulkValue] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportMenu, setExportMenu] = useState<HTMLElement | null>(null);

  useEffect(() => { const t = window.setTimeout(() => { setDebounced(query.trim()); setPage(0); }, 300); return () => window.clearTimeout(t); }, [query]);
  const loadCategories = useCallback(() => { api.categories().then(setCategories).catch(() => setCategories([])); }, [api]);
  useEffect(() => { loadCategories(); }, [loadCategories]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure('');
    try {
      const result = await api.list({ query: debounced, status, page, size });
      setItems(result.items);
      setTotal(result.total);
      if (result.items.length) {
        api.stock(result.items.map((p) => p.id)).then(setStock).catch(() => setStock({}));
      }
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : 'Products could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [api, debounced, status, page, size]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setSelected(new Set()); }, [debounced, status, page, size]);

  const toggle = (id: number) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const pageIds = items.map((p) => p.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = pageIds.some((id) => selected.has(id));
  const bulkSpec = BULK_ACTIONS.find((a) => a.value === bulkAction);
  const bulkIssue = bulkProblem(bulkAction, bulkValue, selected.size);
  const categoryName = categories.find((c) => String(c.id) === bulkCategory)?.name ?? '';

  const applyBulk = async () => {
    if (!api.bulkUpdate || !bulkAction) return;
    setBulkBusy(true);
    try {
      const result = await api.bulkUpdate(bulkChange([...selected], bulkAction, bulkValue, bulkCategory));
      setBulkConfirm(false);
      setSelected(new Set());
      setBulkValue('');
      setNotice(result.warning
        ? { text: result.warning, severity: 'warning' }
        : { text: `${result.updated} product${result.updated === 1 ? '' : 's'} updated${result.unchanged ? `, ${result.unchanged} already matched` : ''}.`, severity: 'success' });
      void load();
    } catch (cause) {
      setBulkConfirm(false);
      setNotice({ text: errorText(cause, 'The change was not applied.'), severity: 'error' });
    } finally {
      setBulkBusy(false);
    }
  };

  const exportAs = async (format: FileFormat) => {
    setExportMenu(null);
    if (!api.exportCatalog) return;
    try { saveFile(await api.exportCatalog(format, status)); } catch (cause) { setNotice({ text: errorText(cause, 'The export failed.'), severity: 'error' }); }
  };

  const money = (value: number | null | undefined) => formatAmount(value, currency);
  const openEditor = (product: AdminProduct | null) => { setEditing(product); setEditorOpen(true); };

  const saved = (result: SaveResult, created: boolean) => {
    setEditorOpen(false);
    setNotice(result.warning
      ? { text: result.warning, severity: 'warning' }
      : { text: created ? `${result.product.name} added. It is now on the storefront and the till.` : `${result.product.name} saved.`, severity: 'success' });
    void load();
  };

  const archiveOrRestore = async (product: AdminProduct) => {
    setConfirm(null);
    try {
      if (product.active) await api.archive(product.id);
      else await api.restore(product.id);
      setNotice({ text: product.active ? `${product.name} archived. It no longer shows on the storefront or the till.` : `${product.name} restored.`, severity: 'success' });
      void load();
    } catch (cause) {
      setNotice({ text: cause instanceof Error ? cause.message : 'That did not work.', severity: 'error' });
    }
  };

  const counts = useMemo(() => ({ shown: items.length }), [items]);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={850}>{title}</Typography>
          {subtitle && <Typography color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {api.createCategory && <Button variant="outlined" startIcon={<CategoryOutlined />} onClick={() => setCategoriesOpen(true)}>Categories</Button>}
          {api.exportCatalog && <Button variant="outlined" startIcon={<DownloadRounded />} onClick={(e) => setExportMenu(e.currentTarget)}>Export</Button>}
          {canManage && api.importCatalog && <Button variant="outlined" startIcon={<UploadFileRounded />} onClick={() => setImportOpen(true)}>Import</Button>}
          {canManage && <Button variant="contained" startIcon={<AddRounded />} onClick={() => openEditor(null)} sx={{ fontWeight: 800 }}>Add product</Button>}
        </Stack>
        <Menu anchorEl={exportMenu} open={!!exportMenu} onClose={() => setExportMenu(null)}>
          <MenuItem onClick={() => void exportAs('xlsx')}>Excel (.xlsx) — {STATUS_LABELS[status].toLowerCase()} products</MenuItem>
          <MenuItem onClick={() => void exportAs('csv')}>CSV — {STATUS_LABELS[status].toLowerCase()} products</MenuItem>
        </Menu>
      </Stack>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ md: 'center' }}>
          <TextField size="small" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or SKU" sx={{ flexGrow: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }} inputProps={{ 'aria-label': 'Search products' }} />
          <ToggleButtonGroup size="small" exclusive value={status} onChange={(_, v: ProductStatus | null) => { if (v) { setStatus(v); setPage(0); } }} aria-label="Product status">
            {(Object.keys(STATUS_LABELS) as ProductStatus[]).map((key) => <ToggleButton key={key} value={key} sx={{ px: 2 }}>{STATUS_LABELS[key]}</ToggleButton>)}
          </ToggleButtonGroup>
          <Tooltip title="Refresh"><IconButton onClick={() => void load()} aria-label="Refresh products"><RefreshRounded /></IconButton></Tooltip>
        </Stack>
      </Paper>

      {canBulk && selected.size > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 3, borderColor: 'primary.main', bgcolor: 'rgba(79,70,229,.04)' }} aria-label="Bulk edit">
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ md: 'center' }}>
            <Typography fontWeight={800} sx={{ minWidth: 110 }}>{selected.size} selected</Typography>
            <TextField select size="small" label="Change" value={bulkAction} onChange={(e) => { setBulkAction(e.target.value as BulkAction); setBulkValue(''); }} sx={{ minWidth: 220 }}>
              {BULK_ACTIONS.filter((a) => !a.stock || canManageStock).map((a) => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
            </TextField>
            {bulkSpec && ['money', 'percent', 'whole'].includes(bulkSpec.input) && (
              <TextField size="small" label={bulkSpec.input === 'percent' ? 'Percent' : bulkSpec.input === 'whole' ? 'Number' : 'Amount'} value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)} inputMode="decimal" sx={{ width: 160 }}
                placeholder={bulkAction === 'PRICE_PERCENT' ? '10 or -5' : bulkAction === 'COST_SET' ? 'empty clears it' : ''}
                InputProps={bulkSpec.input === 'money' ? { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }
                  : bulkSpec.input === 'percent' ? { endAdornment: <InputAdornment position="end">%</InputAdornment> } : undefined} />
            )}
            {bulkSpec?.input === 'category' && (
              <TextField select size="small" label="Category" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} sx={{ minWidth: 200 }}
                SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
                <MenuItem value="">Uncategorized</MenuItem>
                {categories.filter((c) => c.active !== false).map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
              </TextField>
            )}
            <Stack direction="row" spacing={1}>
              <Button variant="contained" disabled={!!bulkIssue} onClick={() => setBulkConfirm(true)}>Apply</Button>
              <Button onClick={() => setSelected(new Set())}>Clear selection</Button>
            </Stack>
            {bulkAction && bulkIssue && bulkIssue !== 'Choose what to change.' && <Typography variant="caption" color="error">{bulkIssue}</Typography>}
          </Stack>
        </Paper>
      )}

      {loading && items.length === 0 && <LoadingState layout="table" rows={6} label="Loading products" />}
      {failure && <ErrorState message={failure} onRetry={() => void load()} />}
      {!loading && !failure && items.length === 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 3 }}>
          <EmptyState title={debounced ? `No products match "${debounced}"` : status === 'archived' ? 'No archived products' : 'No products yet'}
            hint={canManage && !debounced && status !== 'archived' ? 'Add your first product with a photo and price; it appears on the storefront and the till.' : undefined}
            action={canManage && !debounced && status !== 'archived' ? { label: 'Add product', onClick: () => openEditor(null) } : undefined} />
        </Paper>
      )}

      {items.length > 0 && !failure && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table size="small" aria-label="Products">
            <TableHead>
              <TableRow>
                {canBulk && (
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={allOnPage} indeterminate={someOnPage && !allOnPage} inputProps={{ 'aria-label': 'Select all products on this page' }}
                      onChange={() => setSelected((current) => { const next = new Set(current); pageIds.forEach((id) => (allOnPage ? next.delete(id) : next.add(id))); return next; })} />
                  </TableCell>
                )}
                <TableCell>Product</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((product) => {
                const onHand = stock[product.id];
                const tone = stockTone(onHand, product.reorderThreshold);
                return (
                  <TableRow key={product.id} hover sx={{ cursor: canManage ? 'pointer' : 'default', opacity: product.active ? 1 : 0.65 }}
                    onClick={() => canManage && openEditor(product)} selected={selected.has(product.id)}>
                    {canBulk && (
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox size="small" checked={selected.has(product.id)} onChange={() => toggle(product.id)} inputProps={{ 'aria-label': `Select ${product.name}` }} />
                      </TableCell>
                    )}
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 52, height: 52, flexShrink: 0, borderRadius: 2, overflow: 'hidden', bgcolor: '#F1F5F9', display: 'grid', placeItems: 'center',
                          border: '1px solid', borderColor: 'divider' }}>
                          {product.imageUrl
                            ? <Box component="img" src={product.imageUrl} alt="" loading="lazy" sx={{ width: 52, height: 52, objectFit: 'cover', display: 'block' }} />
                            : <ImageOutlined sx={{ color: '#94A3B8' }} />}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={750} noWrap title={product.name}>{product.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{product.sku || `#${product.id}`}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{product.category?.name ?? <Typography variant="body2" color="text.secondary">Uncategorized</Typography>}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={700}>{money(product.price)}</Typography>
                      {product.costPrice !== null && product.costPrice !== undefined && <Typography variant="caption" color="text.secondary">cost {money(product.costPrice)}</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      {tone === 'unknown' ? <Typography variant="body2" color="text.secondary">—</Typography> : (
                        <Chip size="small" label={tone === 'out' ? 'Out of stock' : `${onHand} on hand`}
                          color={tone === 'out' ? 'error' : tone === 'low' ? 'warning' : 'default'} variant={tone === 'ok' ? 'outlined' : 'filled'} />
                      )}
                    </TableCell>
                    <TableCell><Chip size="small" label={product.active ? 'Active' : 'Archived'} color={product.active ? 'success' : 'default'} /></TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      {canManage && (
                        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                          <Tooltip title="Edit"><IconButton size="small" aria-label={`Edit ${product.name}`} onClick={() => openEditor(product)}><EditOutlined fontSize="small" /></IconButton></Tooltip>
                          {product.active
                            ? <Tooltip title="Archive"><IconButton size="small" color="warning" aria-label={`Archive ${product.name}`} onClick={() => setConfirm(product)}><ArchiveOutlined fontSize="small" /></IconButton></Tooltip>
                            : <Tooltip title="Restore"><IconButton size="small" color="success" aria-label={`Restore ${product.name}`} onClick={() => void archiveOrRestore(product)}><RestoreRounded fontSize="small" /></IconButton></Tooltip>}
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination component="div" count={total} page={page} rowsPerPage={size} rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, next) => setPage(next)} onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count}`} />
        </TableContainer>
      )}
      {counts.shown > 0 && !canManage && <Alert severity="info" sx={{ mt: 2 }}>Your role can view products but not change them.</Alert>}

      <ProductEditorDialog open={editorOpen} product={editing} api={api} categories={categories} canManageStock={canManageStock}
        onHand={editing ? stock[editing.id] : undefined} currency={currency} onClose={() => setEditorOpen(false)} onSaved={saved} />

      {api.createCategory && (
        <CategoryManagerDialog api={api} open={categoriesOpen} canManage={canManage}
          onClose={(changed) => { setCategoriesOpen(false); if (changed) { loadCategories(); void load(); } }} />
      )}

      {api.importCatalog && (
        <CatalogImportDialog api={api} open={importOpen} onClose={() => setImportOpen(false)}
          onImported={(report) => { setImportOpen(false); setNotice({ text: importHeadline(report), severity: report.warnings.length ? 'warning' : 'success' }); void load(); }} />
      )}

      <Dialog open={bulkConfirm} onClose={bulkBusy ? undefined : () => setBulkConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Apply to {selected.size} product{selected.size === 1 ? '' : 's'}?</DialogTitle>
        <DialogContent>
          <Typography>{bulkAction ? bulkSummary(bulkAction, bulkValue, selected.size, categoryName, currency) : ''}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>All of them change, or none do if one cannot. Each change is recorded in the product's history.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkConfirm(false)} disabled={bulkBusy}>Cancel</Button>
          <Button variant="contained" color={bulkAction === 'ARCHIVE' ? 'warning' : 'primary'} disabled={bulkBusy} onClick={() => void applyBulk()}>{bulkBusy ? 'Applying…' : 'Apply'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Archive {confirm?.name}?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">It disappears from the storefront and the till. Past orders and receipts keep it, and you can restore it at any time.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Keep it</Button>
          <Button color="warning" variant="contained" onClick={() => confirm && void archiveOrRestore(confirm)}>Archive</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!notice} autoHideDuration={notice?.severity === 'warning' ? 8000 : 4000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)} variant="filled" sx={{ width: '100%' }}>{notice.text}</Alert> : <span />}
      </Snackbar>
    </Box>
  );
}
