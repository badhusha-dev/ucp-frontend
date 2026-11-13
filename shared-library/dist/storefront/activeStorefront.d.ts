import type { SessionStorageLike } from '../auth/applicationSession';
export interface ActiveStorefront {
    slug: string;
    name: string;
}
/** Thrown when the storefront service cannot be reached, so a page can say so instead of showing another catalog. */
export declare class StorefrontLookupError extends Error {
    constructor(message?: string);
}
/** Hosts that can never be a storefront address: bare localhost and IP literals. */
export declare function isPlatformHost(hostname: string): boolean;
/** The slug named in the address (`?storefront=acme`), lower-cased, or null when absent or malformed. */
export declare function storefrontFromQuery(search: string): string | null;
export declare function readActiveStorefront(storage: SessionStorageLike): ActiveStorefront | null;
export declare function storeActiveStorefront(storefront: ActiveStorefront, storage: SessionStorageLike): void;
export declare function clearActiveStorefront(storage: SessionStorageLike): void;
/**
 * Works out the storefront for this visit and remembers it for the browser session:
 * 1. the address itself, when it is a verified custom domain or `<slug>.<platform storefront domain>`;
 * 2. otherwise a `?storefront=` parameter;
 * 3. otherwise the storefront remembered from earlier in the session.
 * A named storefront that is unknown or inactive is forgotten, and the shopper gets the platform's default
 * catalog (null). An unreachable storefront service throws StorefrontLookupError rather than guessing.
 */
export declare function resolveActiveStorefront(location: {
    hostname: string;
    search: string;
}, storage: SessionStorageLike, fetchImpl?: typeof fetch, apiBaseUrl?: string): Promise<ActiveStorefront | null>;
/** The `?storefront=` query a storefront-scoped API call needs, or an empty object for the default catalog. */
export declare function storefrontParams(storefront: ActiveStorefront | null): {
    storefront?: string;
};
