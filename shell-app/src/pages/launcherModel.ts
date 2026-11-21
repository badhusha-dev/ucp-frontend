// Where each application opens from the launcher. Kept free of runtime imports so it can be unit-tested directly.

export type LaunchTarget =
  | { kind: 'shell'; path: string }        // a screen inside this shell; opened with the client session (token exchange)
  | { kind: 'external'; url: string }      // a separately deployed site; it asks for its own sign-in
  | { kind: 'unavailable'; reason: string };

const SHELL_PATHS: Record<string, string> = {
  ECOMMERCE_ADMIN: '/orders/control',
  ACCOUNTING: '/accounting/admin',
  INVENTORY: '/inventory',
  QUALITY_CENTER: '/admin/quality-center',
  RETAIL_POS: '/pos',
};

export interface ExternalOrigins {
  SUPER_ADMIN?: string;
  DELIVERY_OPS?: string;
}

/**
 * Super Admin and Delivery are separate sites. Their origins come from build configuration
 * (VITE_SUPER_ADMIN_URL, VITE_DELIVERY_URL); without it the local Compose ports are used on the current host.
 */
export function externalOrigins(env: Record<string, string | undefined>, location: { protocol: string; hostname: string }): ExternalOrigins {
  const local = (port: number) => `${location.protocol}//${location.hostname}:${port}`;
  return {
    SUPER_ADMIN: env.VITE_SUPER_ADMIN_URL || local(3013),
    DELIVERY_OPS: env.VITE_DELIVERY_URL || local(3014),
  };
}

export function launchTarget(applicationCode: string, origins: ExternalOrigins): LaunchTarget {
  const path = SHELL_PATHS[applicationCode];
  if (path) return { kind: 'shell', path };
  const origin = origins[applicationCode as keyof ExternalOrigins];
  if (origin) return { kind: 'external', url: origin };
  return { kind: 'unavailable', reason: 'This application has no screen in this installation yet.' };
}
