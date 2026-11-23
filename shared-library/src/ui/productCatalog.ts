// Product catalog administration shared by the E-commerce Admin (Catalog Management) and the Point of Sale
// (Products screen). Pure rules here, so they are unit-tested directly; ProductCatalogManager.tsx renders them.

export interface CatalogCategory { id: number; name: string }
export interface CatalogImage { id: string; url: string; width?: number; height?: number }
export interface AdminProduct {
  id: number;
  sku?: string | null;
  name: string;
  description?: string | null;
  price: number;
  costPrice?: number | null;
  reorderThreshold?: number | null;
  imageUrl?: string | null;
  active: boolean;
  category?: CatalogCategory | null;
}

export type ProductStatus = 'active' | 'archived' | 'all';

export interface ProductRequest {
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  costPrice: number | null;
  reorderThreshold: number;
  categoryId: number | null;
  imageIds: string[];
  imageUrl: string | null;
  stockOnHand?: number;
}

export interface SaveResult { product: AdminProduct; warning?: string | null }

/** What each screen supplies: the E-commerce Admin calls /api/products/admin, the POS calls /api/pos/products. */
export interface CatalogAdminApi {
  list(params: { query: string; status: ProductStatus; page: number; size: number }): Promise<{ items: AdminProduct[]; total: number }>;
  categories(): Promise<CatalogCategory[]>;
  images(productId: number): Promise<CatalogImage[]>;
  /** Units on hand per product id (missing ids are untracked). */
  stock(productIds: number[]): Promise<Record<number, number>>;
  uploadImage(file: File): Promise<CatalogImage>;
  create(body: ProductRequest): Promise<SaveResult>;
  update(id: number, body: ProductRequest): Promise<SaveResult>;
  archive(id: number): Promise<void>;
  restore(id: number): Promise<void>;
}

export interface ProductForm {
  name: string;
  sku: string;
  description: string;
  price: string;
  costPrice: string;
  reorderThreshold: string;
  categoryId: string;
  stockOnHand: string;
  images: CatalogImage[];
  /** An external image address kept from older products that have no uploaded photo. */
  imageUrl: string;
}

export const MAX_PRODUCT_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif'];
export const UPLOADED_IMAGE_PREFIX = '/api/products/images/';
const SKU = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export function emptyProductForm(): ProductForm {
  return { name: '', sku: '', description: '', price: '', costPrice: '', reorderThreshold: '10', categoryId: '', stockOnHand: '', images: [], imageUrl: '' };
}

export function formFromProduct(product: AdminProduct, images: CatalogImage[], onHand?: number | null): ProductForm {
  const external = product.imageUrl && !product.imageUrl.startsWith(UPLOADED_IMAGE_PREFIX) ? product.imageUrl : '';
  return {
    name: product.name ?? '',
    sku: product.sku ?? '',
    description: product.description ?? '',
    price: product.price === null || product.price === undefined ? '' : String(product.price),
    costPrice: product.costPrice === null || product.costPrice === undefined ? '' : String(product.costPrice),
    reorderThreshold: String(product.reorderThreshold ?? 10),
    categoryId: product.category?.id ? String(product.category.id) : '',
    stockOnHand: onHand === null || onHand === undefined ? '' : String(onHand),
    images,
    imageUrl: external,
  };
}

function number(text: string): number {
  const clean = text.replace(/[,\s]/g, '');
  return clean === '' || !/^-?\d*(\.\d*)?$/.test(clean) ? Number.NaN : Number(clean);
}

export type FormErrors = Partial<Record<'name' | 'sku' | 'price' | 'costPrice' | 'reorderThreshold' | 'stockOnHand' | 'imageUrl' | 'description', string>>;

export function validateProductForm(form: ProductForm, options: { stock: boolean }): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Enter the product name.';
  else if (form.name.trim().length > 255) errors.name = 'Keep the name under 255 characters.';
  if (form.sku.trim() && !SKU.test(form.sku.trim())) errors.sku = 'Letters, digits, "." "_" and "-" only (up to 64).';
  const price = number(form.price);
  if (form.price.trim() === '') errors.price = 'Enter the selling price.';
  else if (!Number.isFinite(price) || price < 0) errors.price = 'The price must be 0 or more.';
  if (form.costPrice.trim() !== '') {
    const cost = number(form.costPrice);
    if (!Number.isFinite(cost) || cost < 0) errors.costPrice = 'The cost must be 0 or more.';
  }
  const threshold = number(form.reorderThreshold || '0');
  if (!Number.isInteger(threshold) || threshold < 0) errors.reorderThreshold = 'Use a whole number, 0 or more.';
  if (options.stock && form.stockOnHand.trim() !== '') {
    const stock = number(form.stockOnHand);
    if (!Number.isInteger(stock) || stock < 0) errors.stockOnHand = 'Use a whole number, 0 or more.';
  }
  if (form.imageUrl.trim() && !/^https?:\/\//i.test(form.imageUrl.trim())) errors.imageUrl = 'Use an http(s) link, or upload a photo instead.';
  if (form.description.length > 4000) errors.description = 'Keep the description under 4,000 characters.';
  return errors;
}

/**
 * The request body for saving. Stock is sent only when the person may change it and the field differs from what
 * was loaded (on a new product: when filled in), so saving other details never moves stock.
 */
export function productRequest(form: ProductForm, options: { stock: boolean; loadedStock?: string }): ProductRequest {
  const body: ProductRequest = {
    name: form.name.trim(),
    sku: form.sku.trim() || null,
    description: form.description.trim() || null,
    price: number(form.price),
    costPrice: form.costPrice.trim() === '' ? null : number(form.costPrice),
    reorderThreshold: form.reorderThreshold.trim() === '' ? 10 : number(form.reorderThreshold),
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    imageIds: form.images.map((image) => image.id),
    imageUrl: form.images.length === 0 && form.imageUrl.trim() ? form.imageUrl.trim() : null,
  };
  const stock = form.stockOnHand.trim();
  if (options.stock && stock !== '' && stock !== (options.loadedStock ?? '').trim()) body.stockOnHand = number(stock);
  return body;
}

/** Gross margin as a percentage of the price, or null when it cannot be worked out. */
export function marginPercent(price: string, cost: string): number | null {
  const p = number(price);
  const c = number(cost);
  if (!Number.isFinite(p) || !Number.isFinite(c) || p <= 0 || cost.trim() === '') return null;
  return Math.round(((p - c) / p) * 1000) / 10;
}

/** Why a chosen file cannot be uploaded, or null when it can. */
export function imageFileProblem(file: { type: string; size: number; name?: string }): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return `${file.name ?? 'This file'} is not a PNG, JPEG or GIF image.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name ?? 'This image'} is larger than 5 MB.`;
  if (file.size === 0) return `${file.name ?? 'This file'} is empty.`;
  return null;
}

/** Moves an image to a new position (index 0 is the main image). */
export function moveImage(images: CatalogImage[], from: number, to: number): CatalogImage[] {
  if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return images;
  const next = [...images];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export type StockTone = 'out' | 'low' | 'ok' | 'unknown';

export function stockTone(onHand: number | undefined, reorderThreshold: number | null | undefined): StockTone {
  if (onHand === undefined) return 'unknown';
  if (onHand <= 0) return 'out';
  if (onHand <= (reorderThreshold ?? 10)) return 'low';
  return 'ok';
}
