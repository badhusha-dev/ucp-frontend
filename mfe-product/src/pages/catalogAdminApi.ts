// E-commerce Admin adapter for the shared product manager: /api/products/admin with the E-commerce Admin session token.
import { requestToken } from '@ecommerce/shared-library';
import axios, { AxiosError } from 'axios';
import type {
  AdminProduct, CatalogAdminApi, CatalogCategory, CatalogImage, ProductRequest, SaveResult,
} from '@ecommerce/shared-library/src/ui/productCatalog';

const ADMIN = '/api/products/admin';
const client = axios.create();
client.interceptors.request.use((config) => {
  const token = requestToken((config.baseURL || '') + (config.url || ''));
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function problem(cause: unknown, fallback: string): Error {
  const error = cause as AxiosError<{ message?: string; error?: string }>;
  const status = error.response?.status;
  const text = error.response?.data?.message || (status === 401 ? 'Your E-commerce Admin session has ended. Use "Switch workspace" to sign in again.'
    : status === 403 ? 'Your role cannot do that.' : status === 413 ? 'The image is larger than 5 MB.' : '');
  return new Error(text || error.message || fallback);
}

async function run<T>(request: () => Promise<T>, fallback: string): Promise<T> {
  try { return await request(); } catch (cause) { throw problem(cause, fallback); }
}

const saved = (response: { data: AdminProduct; headers: Record<string, unknown> }): SaveResult => ({
  product: response.data,
  warning: typeof response.headers['x-stock-warning'] === 'string' ? (response.headers['x-stock-warning'] as string) : null,
});

export const ecommerceCatalogApi: CatalogAdminApi = {
  list: ({ query, status, page, size }) => run(async () => {
    const active = status === 'all' ? undefined : status === 'active';
    const { data } = await client.get<{ content: AdminProduct[]; totalElements: number }>(ADMIN, { params: { q: query || undefined, active, page, size } });
    return { items: data.content ?? [], total: data.totalElements ?? 0 };
  }, 'Products could not be loaded.'),
  categories: () => run(async () => (await client.get<CatalogCategory[]>('/api/products/categories')).data, 'Categories could not be loaded.'),
  images: (id) => run(async () => (await client.get<CatalogImage[]>(`${ADMIN}/${id}/images`)).data, 'Photos could not be loaded.'),
  stock: (ids) => run(async () => {
    const { data } = await client.post<{ productId: number; stockQuantity: number }[]>('/api/stock/batch', ids);
    return Object.fromEntries(data.map((row) => [row.productId, row.stockQuantity ?? 0]));
  }, 'Stock could not be loaded.'),
  uploadImage: (file) => run(async () => {
    const form = new FormData();
    form.append('file', file);
    return (await client.post<CatalogImage>(`${ADMIN}/images`, form)).data;
  }, 'The photo could not be uploaded.'),
  create: (body: ProductRequest) => run(async () => saved(await client.post<AdminProduct>(ADMIN, body)), 'The product could not be created.'),
  update: (id, body) => run(async () => saved(await client.put<AdminProduct>(`${ADMIN}/${id}`, body)), 'The product could not be saved.'),
  archive: (id) => run(async () => { await client.delete(`${ADMIN}/${id}`); }, 'The product could not be archived.'),
  restore: (id) => run(async () => { await client.patch(`${ADMIN}/${id}/restore`); }, 'The product could not be restored.'),
};
