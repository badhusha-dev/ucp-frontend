import { type SessionStorageLike } from './applicationSession';
export { applicationForRequest, requestPath } from './requestRoutes';
export declare function requestToken(url: string, session?: SessionStorageLike, local?: Pick<Storage, 'getItem'>): string | null;
