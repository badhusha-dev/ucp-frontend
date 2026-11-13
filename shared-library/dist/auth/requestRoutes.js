// Which token a request carries; see requestAuth.ts. Kept free of runtime imports so it can be unit-tested directly.
// First match wins. `null` means "platform token" for an admin path that is not tenant-scoped.
const RULES = [
    { pattern: /^\/api\/products\/admin\/analytics(\/|$)/, application: null },
    { pattern: /^\/api\/products\/admin(\/|$)/, application: 'ECOMMERCE_ADMIN' },
    { pattern: /^\/api\/orders\/admin(\/|$)/, application: 'ECOMMERCE_ADMIN' },
    { pattern: /^\/api\/stock\/admin(\/|$)/, application: 'ECOMMERCE_ADMIN' },
    { pattern: /^\/api\/crm(\/|$)/, application: 'ECOMMERCE_ADMIN' },
    { pattern: /^\/api\/errors\/admin(\/|$)/, application: 'ECOMMERCE_ADMIN' },
    { pattern: /^\/api\/loyalty\/admin(\/|$)/, application: 'ECOMMERCE_ADMIN' },
    { pattern: /^\/api\/loyalty\/\d+\/(bonus|earn)$/, application: 'ECOMMERCE_ADMIN' },
    { pattern: /^\/api\/procurement\/ucp(\/|$)/, application: 'INVENTORY' },
    { pattern: /^\/api\/procurement(\/|$)/, application: 'ECOMMERCE_ADMIN' },
    { pattern: /^\/api\/inventory(\/|$)/, application: 'INVENTORY' },
    { pattern: /^\/api\/accounting\/admin(\/|$)/, application: 'ACCOUNTING' },
    { pattern: /^\/api\/admin\/qa(\/|$)/, application: 'QUALITY_CENTER' },
    { pattern: /^\/api\/delivery(\/|$)/, application: 'DELIVERY_OPS' },
];
/** The path part of a request URL (absolute or relative, with or without a query string). */
export function requestPath(url) {
    let path = url.trim();
    const scheme = path.indexOf('://');
    if (scheme >= 0) {
        const slash = path.indexOf('/', scheme + 3);
        path = slash >= 0 ? path.slice(slash) : '/';
    }
    path = path.split(/[?#]/)[0];
    if (!path.startsWith('/'))
        path = '/' + path;
    return path.replace(/\/{2,}/g, '/');
}
/** The application whose token a request needs, or undefined when the platform token applies. */
export function applicationForRequest(url) {
    const path = requestPath(url);
    for (const rule of RULES) {
        if (rule.pattern.test(path))
            return rule.application ?? undefined;
    }
    return undefined;
}
/**
 * Picks the token: the application session's token for tenant-scoped admin APIs (null without a session, so the
 * request fails closed), otherwise the platform login token.
 */
export function pickToken(url, sessionToken, local) {
    const application = applicationForRequest(url);
    if (application)
        return sessionToken(application) ?? null;
    return local?.getItem('jwt_token') || local?.getItem('token') || null;
}
