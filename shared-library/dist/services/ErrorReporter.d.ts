export interface Breadcrumb {
    timestamp: string;
    category: string;
    message: string;
    level?: string;
    data?: Record<string, any>;
}
export interface ClientErrorReport {
    serviceName: string;
    environment?: string;
    version?: string;
    releaseTag?: string;
    errorType: string;
    message: string;
    stackTrace?: string;
    exceptionChain?: string;
    requestMethod?: string;
    requestUri?: string;
    responseStatus?: number;
    traceId?: string;
    correlationId?: string;
    userId?: number;
    userRole?: string;
    browser?: string;
    os?: string;
    frontendRoute?: string;
    severity?: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
    metadata?: Record<string, any>;
    breadcrumbs?: Breadcrumb[];
}
export declare function addBreadcrumb(category: string, message: string, data?: Record<string, any>): void;
export declare function reportClientError(report: Partial<ClientErrorReport>): Promise<void>;
export declare function initGlobalErrorHandlers(serviceName?: string): void;
