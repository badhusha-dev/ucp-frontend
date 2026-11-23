// Product catalog administration: search, filter, add, edit (photos, price, stock), archive and restore.
// Shared by Catalog Management (E-commerce Admin) and the POS Products screen; each passes its own API adapter.
// Import by path ('@ecommerce/shared-library/src/ui/ProductCatalogManager') so it uses the screen's own MUI and theme.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Paper, Snackbar, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography,
} from '@mui/material';
import {
  AddRounded, ArchiveOutlined, EditOutlined, ImageOutlined, RefreshRounded, RestoreRounded, SearchRounded,
} from '@mui/icons-material';
import { formatAmount } from './format';
import { EmptyState, ErrorState, LoadingState } from './StateViews';
import { ProductEditorDialog } from './ProductEditorDialog';
import { stockTone, type AdminProduct, type CatalogAdminApi, type CatalogCategory, type ProductStatus, type SaveResult } from './productCatalog';

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

export function ProductCatalogManager({ api, canManage, canManageStock, currency = 'USD', title = 'Products', subtitle }: Props) {
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

  useEffect(() => { const t = window.setTimeout(() => { setDebounced(query.trim()); setPage(0); }, 300); return () => window.clearTimeout(t); }, [query]);
  useEffect(() => { api.categories().then(setCategories).catch(() => setCategories([])); }, [api]);

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
        {canManage && <Button variant="contained" startIcon={<AddRounded />} onClick={() => openEditor(null)} sx={{ fontWeight: 800 }}>Add product</Button>}
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
                    onClick={() => canManage && openEditor(product)}>
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
