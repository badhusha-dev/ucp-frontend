// Guest cart session token, kept per storefront so carts from different storefronts never mix.

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STOREFRONT_KEY = 'ucp.storefront';
// Same slug rule as shared-library activeStorefront and product-service.
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function activeStorefrontSlug(session: StorageLike): string {
  try {
    const raw = session.getItem(STOREFRONT_KEY);
    const value = raw ? JSON.parse(raw) : null;
    if (value && typeof value.slug === 'string' && SLUG_PATTERN.test(value.slug)) return value.slug;
  } catch {
    // Malformed entry: fall back to the default catalog's cart.
  }
  return 'default';
}

export function cartSessionToken(
  session: StorageLike,
  local: StorageLike,
  random: () => number = Math.random,
): string {
  const key = `cart_session_token_${activeStorefrontSlug(session)}`;
  let token = local.getItem(key);
  if (!token) {
    token = 'sess_' + random().toString(36).substring(2, 12);
    local.setItem(key, token);
  }
  return token;
}
