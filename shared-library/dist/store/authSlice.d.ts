import type { UserPayload } from '../services/AuthService';
export interface AuthState {
    token: string | null;
    user: UserPayload | null;
    isAuthenticated: boolean;
}
export declare const loginSuccess: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "auth/loginSuccess">, logout: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/logout">;
declare const _default: import("redux").Reducer<AuthState>;
export default _default;
