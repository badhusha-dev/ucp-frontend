// Which token a request carries. Tenant-scoped admin APIs need the token of the application they belong to (issued by
// /api/users/login/application); everything else (storefront, a shopper's own data, platform APIs) uses the platform
// login token. The route table lives in requestRoutes.ts.

import { readApplicationSession, type SessionStorageLike } from './applicationSession';
import { pickToken } from './requestRoutes';

export { applicationForRequest, requestPath } from './requestRoutes';

export function requestToken(
  url: string,
  session: SessionStorageLike = globalThis.sessionStorage,
  local: Pick<Storage, 'getItem'> = globalThis.localStorage,
): string | null {
  return pickToken(url, (application) => readApplicationSession(application, session)?.token, local);
}
