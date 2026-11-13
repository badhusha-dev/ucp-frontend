import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { activeStorefrontSlug, cartSessionToken } from '../src/cartSession.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

const storefront = (slug: unknown) => memoryStorage({ 'ucp.storefront': JSON.stringify({ slug, name: 'x' }) });

describe('activeStorefrontSlug', () => {
  it('returns the remembered storefront slug', () => {
    assert.equal(activeStorefrontSlug(storefront('acme')), 'acme');
  });

  it('falls back to default when nothing is remembered', () => {
    assert.equal(activeStorefrontSlug(memoryStorage()), 'default');
  });

  it('falls back to default for malformed JSON', () => {
    assert.equal(activeStorefrontSlug(memoryStorage({ 'ucp.storefront': '{not json' })), 'default');
  });

  it('rejects slugs that break the storefront slug rule', () => {
    for (const slug of ['../admin', 'Acme', '', '-acme', 42, null]) {
      assert.equal(activeStorefrontSlug(storefront(slug)), 'default', `slug ${String(slug)}`);
    }
  });
});

describe('cartSessionToken', () => {
  it('creates and persists one token per storefront', () => {
    const local = memoryStorage();
    const a1 = cartSessionToken(storefront('store-a'), local, () => 0.111);
    const a2 = cartSessionToken(storefront('store-a'), local, () => 0.999);
    assert.equal(a1, a2);
    assert.equal(local.values.get('cart_session_token_store-a'), a1);
  });

  it('keeps carts of different storefronts apart', () => {
    const local = memoryStorage();
    const a = cartSessionToken(storefront('store-a'), local, () => 0.111);
    const b = cartSessionToken(storefront('store-b'), local, () => 0.222);
    assert.notEqual(a, b);
    assert.equal(local.values.size, 2);
  });

  it('uses the default cart when no storefront is active', () => {
    const local = memoryStorage();
    const token = cartSessionToken(memoryStorage(), local, () => 0.5);
    assert.match(token, /^sess_[a-z0-9]+$/);
    assert.equal(local.values.get('cart_session_token_default'), token);
  });
});
