import type { ApplicationCode } from '../config/applicationRegistry';
export interface ApplicationSession {
    token: string;
    applicationCode: ApplicationCode;
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    role: string;
}
export interface ApplicationSignInRequest {
    applicationCode: ApplicationCode;
    tenantSlug: string;
    email: string;
    password: string;
}
export interface SessionStorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export declare class ApplicationSignInError extends Error {
    readonly status: number;
    constructor(message: string, status: number);
}
export declare function sessionStorageKey(applicationCode: ApplicationCode): string;
/** Decodes a JWT payload without verifying it. Returns null for malformed tokens. */
export declare function decodeTokenClaims(token: string): Record<string, unknown> | null;
/**
 * True when the token claims this application and tenant and has not expired.
 * A token without an `exp` claim is treated as invalid.
 */
export declare function isUsableApplicationToken(token: string, applicationCode: ApplicationCode, tenantId: string, nowMs?: number): boolean;
/** Signs in to one application for one client workspace. Throws ApplicationSignInError on failure. */
export declare function signInToApplication(request: ApplicationSignInRequest, fetchImpl?: typeof fetch, apiBaseUrl?: string): Promise<ApplicationSession>;
export declare function storeApplicationSession(session: ApplicationSession, storage: SessionStorageLike): void;
/** Returns the stored session for this application, clearing it if it is malformed, foreign or expired. */
export declare function readApplicationSession(applicationCode: ApplicationCode, storage: SessionStorageLike, nowMs?: number): ApplicationSession | null;
export declare function clearApplicationSession(applicationCode: ApplicationCode, storage: SessionStorageLike): void;
export interface PlatformSession {
    token: string;
    email: string;
    role: string;
}
/** True when the token is an unexpired platform token (no tenant or application scope). */
export declare function isUsablePlatformToken(token: string, nowMs?: number): boolean;
/**
 * Signs in through the platform login. When requiredRole is given, a token for another role is
 * rejected with 403 so the portal can explain the restriction before making protected calls.
 */
export declare function signInToPlatform(request: {
    email: string;
    password: string;
}, requiredRole?: string, fetchImpl?: typeof fetch, apiBaseUrl?: string): Promise<PlatformSession>;
export declare function storePlatformSession(session: PlatformSession, storage: SessionStorageLike): void;
/** Returns the stored platform session, clearing it if it is malformed, tenant-scoped or expired. */
export declare function readPlatformSession(storage: SessionStorageLike, nowMs?: number): PlatformSession | null;
export declare function clearPlatformSession(storage: SessionStorageLike): void;
