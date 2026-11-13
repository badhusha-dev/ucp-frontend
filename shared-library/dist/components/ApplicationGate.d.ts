import React from 'react';
import type { ApplicationCode } from '../config/applicationRegistry';
import { type ApplicationSession } from '../auth/applicationSession';
interface ApplicationGateProps {
    applicationCode: ApplicationCode;
    applicationName: string;
    children: React.ReactNode;
}
/**
 * Shows its children only with a valid session for this application (a tenant-scoped token from
 * /api/users/login/application); otherwise asks for the client workspace and credentials. The session lives in
 * sessionStorage, so every screen of the same application shares one sign-in until the browser session ends.
 */
export declare function ApplicationGate({ applicationCode, applicationName, children }: ApplicationGateProps): React.JSX.Element;
interface ApplicationSignInProps {
    applicationCode: ApplicationCode;
    applicationName: string;
    onAuthenticated: (session: ApplicationSession) => void;
}
export declare function ApplicationSignIn({ applicationCode, applicationName, onAuthenticated }: ApplicationSignInProps): React.JSX.Element;
export {};
