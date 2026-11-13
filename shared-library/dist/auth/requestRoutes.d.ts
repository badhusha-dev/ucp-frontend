import type { ApplicationCode } from '../config/applicationRegistry';
/** The path part of a request URL (absolute or relative, with or without a query string). */
export declare function requestPath(url: string): string;
/** The application whose token a request needs, or undefined when the platform token applies. */
export declare function applicationForRequest(url: string): ApplicationCode | undefined;
/**
 * Picks the token: the application session's token for tenant-scoped admin APIs (null without a session, so the
 * request fails closed), otherwise the platform login token.
 */
export declare function pickToken(url: string, sessionToken: (application: ApplicationCode) => string | null | undefined, local: {
    getItem(key: string): string | null;
} | undefined): string | null;
