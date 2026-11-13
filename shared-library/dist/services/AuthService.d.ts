export interface UserPayload {
    id: number;
    sub: string;
    email: string;
    name: string;
    role: string;
    permissions?: string[];
    exp: number;
}
export declare const AuthService: {
    login: (email: string, password: string) => Promise<string>;
    register: (email: string, name: string, password: string) => Promise<string>;
};
