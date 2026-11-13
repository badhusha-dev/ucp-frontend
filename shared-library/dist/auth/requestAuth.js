// Which token a request carries. Tenant-scoped admin APIs need the token of the application they belong to (issued by
// /api/users/login/application); everything else (storefront, a shopper's own data, platform APIs) uses the platform
// login token. The route table lives in requestRoutes.ts.
import { readApplicationSession } from './applicationSession';
import { pickToken } from './requestRoutes';
export { applicationForRequest, requestPath } from './requestRoutes';
export function requestToken(url, session = globalThis.sessionStorage, local = globalThis.localStorage) {
    return pickToken(url, (application) => readApplicationSession(application, session)?.token, local);
}
