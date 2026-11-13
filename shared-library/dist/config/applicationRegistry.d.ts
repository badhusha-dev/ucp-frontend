export declare const APPLICATION_CODES: readonly ["SUPER_ADMIN", "ECOMMERCE_ADMIN", "STOREFRONT", "INVENTORY", "ACCOUNTING", "DELIVERY_OPS", "VENDOR_PORTAL", "CRM", "QUALITY_CENTER", "CUSTOMER_SUPPORT"];
export type ApplicationCode = (typeof APPLICATION_CODES)[number];
export type ApplicationStatus = 'ACTIVE' | 'PLANNED';
export interface ApplicationDefinition {
    code: ApplicationCode;
    displayName: string;
    status: ApplicationStatus;
    /** Public origin, e.g. https://inventory.example.com. Empty while PLANNED. */
    origin: string;
    /** Path of the application's own login page. */
    loginPath: string;
}
export declare const APPLICATION_REGISTRY: Readonly<Record<ApplicationCode, ApplicationDefinition>>;
export declare function isApplicationCode(value: unknown): value is ApplicationCode;
/**
 * Builds the registry from runtime-supplied origins. Only ACTIVE applications
 * need an origin; a missing or non-HTTPS origin for an ACTIVE application
 * (outside localhost) is rejected so misconfiguration fails at startup.
 */
export declare function buildApplicationRegistry(origins: Partial<Record<ApplicationCode, string>>): Readonly<Record<ApplicationCode, ApplicationDefinition>>;
/** Returns the origin (scheme://host[:port]) when it is HTTPS or localhost HTTP, otherwise null. */
export declare function normalizeOrigin(value: string): string | null;
/**
 * Accepts a post-login redirect only when it points at the registered origin of
 * the application, or is a relative path on the current application. Anything
 * else returns null so the caller falls back to the application home page.
 */
export declare function resolveSafeRedirect(target: string | null | undefined, applicationCode: ApplicationCode, registry: Readonly<Record<ApplicationCode, ApplicationDefinition>>): string | null;
