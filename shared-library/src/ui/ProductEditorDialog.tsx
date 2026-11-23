// Add / edit a product: photos (upload, reorder, choose the main one), details, price and stock.
// Import by path ('@ecommerce/shared-library/src/ui/ProductCatalogManager') so it uses the screen's own MUI and theme.
import { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem,
  Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  AddPhotoAlternateOutlined, ChevronLeftRounded, ChevronRightRounded, CloseRounded, DeleteOutlineRounded, StarRounded,
} from '@mui/icons-material';
import {
  MAX_PRODUCT_IMAGES, emptyProductForm, formFromProduct, imageFileProblem, marginPercent, moveImage, productRequest, validateProductForm,
  type AdminProduct, type CatalogAdminApi, type CatalogCategory, type FormErrors, type ProductForm, type SaveResult,
} from './productCatalog';

interface Props {
  open: boolean;
  product: AdminProduct | null;
  api: CatalogAdminApi;
  categories: CatalogCategory[];
  canManageStock: boolean;
  onHand?: number;
  currency: string;
  onClose: () => void;
  onSaved: (result: SaveResult, created: boolean) => void;
}

function message(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

export function ProductEditorDialog({ open, product, api, categories, canManageStock, onHand, currency, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ProductForm>(emptyProductForm());
  const [loadedStock, setLoadedStock] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [failure, setFailure] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [uploadProblems, setUploadProblems] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFailure('');
    setUploadProblems([]);
    if (!product) {
      setForm(emptyProductForm());
      setLoadedStock('');
      return;
    }
    let active = true;
    const stockText = onHand === undefined ? '' : String(onHand);
    setForm(formFromProduct(product, [], onHand));
    setLoadedStock(stockText);
    setLoading(true);
    api.images(product.id)
      .then((images) => { if (active) setForm((current) => ({ ...current, images })); })
      .catch((cause: unknown) => { if (active) setFailure(message(cause, 'The photos could not be loaded.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, product, api, onHand]);

  const set = (field: keyof ProductForm) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const room = MAX_PRODUCT_IMAGES - form.images.length;
    const problems: string[] = [];
    if (list.length > room) problems.push(`A product can have ${MAX_PRODUCT_IMAGES} photos; ${list.length - Math.max(room, 0)} were not added.`);
    const accepted = list.slice(0, Math.max(room, 0)).filter((file) => {
      const problem = imageFileProblem(file);
      if (problem) problems.push(problem);
      return !problem;
    });
    setUploadProblems(problems);
    for (const file of accepted) {
      setUploading((n) => n + 1);
      try {
        const image = await api.uploadImage(file);
        setForm((current) => ({ ...current, images: [...current.images, image].slice(0, MAX_PRODUCT_IMAGES) }));
      } catch (cause) {
        setUploadProblems((current) => [...current, `${file.name}: ${message(cause, 'upload failed')}`]);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const save = async () => {
    const found = validateProductForm(form, { stock: canManageStock });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    setFailure('');
    try {
      const body = productRequest(form, { stock: canManageStock, loadedStock: product ? loadedStock : undefined });
      const result = product ? await api.update(product.id, body) : await api.create(body);
      onSaved(result, !product);
    } catch (cause) {
      setFailure(message(cause, 'The product could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const margin = marginPercent(form.price, form.costPrice);
  const busy = saving || uploading > 0;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md" aria-labelledby="product-editor-title">
      <DialogTitle id="product-editor-title" sx={{ pr: 7, fontWeight: 800 }}>
        {product ? `Edit ${product.name}` : 'Add product'}
        <IconButton aria-label="Close" onClick={onClose} disabled={busy} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '320px 1fr' } }}>
          {/* Photos */}
          <Box>
            <Typography fontWeight={800} sx={{ mb: 0.5 }}>Photos</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Up to {MAX_PRODUCT_IMAGES} PNG, JPEG or GIF images, 5 MB each. The first is the main photo on the storefront and the till.
            </Typography>
            <Box
              role="button" tabIndex={0} aria-label="Add photos"
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files); }}
              sx={{ border: '2px dashed', borderColor: dragging ? 'primary.main' : 'divider', bgcolor: dragging ? 'rgba(79,70,229,.06)' : '#F8FAFC',
                borderRadius: 3, p: 2.5, textAlign: 'center', cursor: 'pointer', transition: 'all .15s', '&:hover': { borderColor: 'primary.main' },
                opacity: form.images.length >= MAX_PRODUCT_IMAGES ? 0.5 : 1 }}>
              <AddPhotoAlternateOutlined color="primary" sx={{ fontSize: 34 }} />
              <Typography fontWeight={700}>Drop photos here or click to choose</Typography>
              <Typography variant="caption" color="text.secondary">{form.images.length} of {MAX_PRODUCT_IMAGES} added</Typography>
              <input ref={fileInput} type="file" hidden multiple accept="image/png,image/jpeg,image/gif"
                onChange={(e) => { if (e.target.files?.length) void addFiles(e.target.files); e.target.value = ''; }} />
            </Box>
            {uploadProblems.map((problem) => <Alert key={problem} severity="warning" sx={{ mt: 1, py: 0 }}>{problem}</Alert>)}
            <Box sx={{ mt: 1.5, display: 'grid', gap: 1, gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {form.images.map((image, index) => (
                <Box key={image.id} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '2px solid', aspectRatio: '1',
                  borderColor: index === 0 ? 'primary.main' : 'divider', bgcolor: '#fff' }}>
                  <Box component="img" src={image.url} alt={`Photo ${index + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {index === 0 && (
                    <Box sx={{ position: 'absolute', top: 4, left: 4, px: 0.75, borderRadius: 1, bgcolor: 'primary.main', color: '#fff', fontSize: 11, fontWeight: 800 }}>Main</Box>
                  )}
                  <Stack direction="row" justifyContent="space-between" sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, bgcolor: 'rgba(15,23,42,.62)' }}>
                    <Tooltip title="Move left"><span><IconButton size="small" sx={{ color: '#fff' }} disabled={index === 0} aria-label="Move photo left"
                      onClick={() => setForm((c) => ({ ...c, images: moveImage(c.images, index, index - 1) }))}><ChevronLeftRounded fontSize="small" /></IconButton></span></Tooltip>
                    {index !== 0 && (
                      <Tooltip title="Make main photo"><IconButton size="small" sx={{ color: '#FDE68A' }} aria-label="Make main photo"
                        onClick={() => setForm((c) => ({ ...c, images: moveImage(c.images, index, 0) }))}><StarRounded fontSize="small" /></IconButton></Tooltip>
                    )}
                    <Tooltip title="Remove"><IconButton size="small" sx={{ color: '#FCA5A5' }} aria-label="Remove photo"
                      onClick={() => setForm((c) => ({ ...c, images: c.images.filter((i) => i.id !== image.id) }))}><DeleteOutlineRounded fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Move right"><span><IconButton size="small" sx={{ color: '#fff' }} disabled={index === form.images.length - 1} aria-label="Move photo right"
                      onClick={() => setForm((c) => ({ ...c, images: moveImage(c.images, index, index + 1) }))}><ChevronRightRounded fontSize="small" /></IconButton></span></Tooltip>
                  </Stack>
                </Box>
              ))}
              {Array.from({ length: uploading }).map((_, i) => (
                <Box key={`up-${i}`} sx={{ aspectRatio: '1', borderRadius: 2, border: '1px dashed', borderColor: 'divider', display: 'grid', placeItems: 'center' }}>
                  <CircularProgress size={22} />
                </Box>
              ))}
            </Box>
            {loading && <Typography variant="caption" color="text.secondary">Loading photos…</Typography>}
            {form.images.length === 0 && (
              <TextField fullWidth size="small" sx={{ mt: 1.5 }} label="Or an image link (optional)" value={form.imageUrl} onChange={set('imageUrl')}
                error={!!errors.imageUrl} helperText={errors.imageUrl ?? ' '} placeholder="https://…" />
            )}
          </Box>

          {/* Details */}
          <Stack spacing={2}>
            <TextField label="Product name" required autoFocus value={form.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField label="SKU / barcode" value={form.sku} onChange={set('sku')} error={!!errors.sku}
                helperText={errors.sku ?? 'Scanned at the till; must be unique'} inputProps={{ maxLength: 64 }} />
              <TextField select label="Category" value={form.categoryId} onChange={set('categoryId')}
                SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
                <MenuItem value="">Uncategorized</MenuItem>
                {categories.map((category) => <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>)}
              </TextField>
            </Box>
            <TextField label="Description" multiline minRows={3} value={form.description} onChange={set('description')}
              error={!!errors.description} helperText={errors.description ?? 'Shown on the product page of the storefront'} />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField label="Selling price" required value={form.price} onChange={set('price')} inputMode="decimal" error={!!errors.price}
                helperText={errors.price ?? 'Before tax'} InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }} />
              <TextField label="Cost price" value={form.costPrice} onChange={set('costPrice')} inputMode="decimal" error={!!errors.costPrice}
                helperText={errors.costPrice ?? (margin === null ? 'Optional, for margin reports' : `Margin ${margin}%`)}
                InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }} />
            </Box>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField label={product ? 'Stock on hand' : 'Opening stock'} value={form.stockOnHand} onChange={set('stockOnHand')} inputMode="numeric"
                disabled={!canManageStock} error={!!errors.stockOnHand}
                helperText={errors.stockOnHand ?? (!canManageStock ? 'Your role cannot change stock' : product ? 'Changing it records a stock adjustment' : 'Units you have now (optional)')} />
              <TextField label="Low-stock alert at" value={form.reorderThreshold} onChange={set('reorderThreshold')} inputMode="numeric"
                error={!!errors.reorderThreshold} helperText={errors.reorderThreshold ?? 'Flag the product when stock falls to this'} />
            </Box>
            {failure && <Alert severity="error">{failure}</Alert>}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={() => void save()} disabled={busy} sx={{ minWidth: 160, fontWeight: 800 }}>
          {saving ? 'Saving…' : uploading > 0 ? 'Uploading photos…' : product ? 'Save changes' : 'Create product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
