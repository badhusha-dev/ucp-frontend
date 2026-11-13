import axios from 'axios';
const breadcrumbRingBuffer = [];
const MAX_BREADCRUMBS = 25;
export function addBreadcrumb(category, message, data) {
    try {
        const item = {
            timestamp: new Date().toISOString(),
            category,
            message,
            data,
        };
        breadcrumbRingBuffer.push(item);
        if (breadcrumbRingBuffer.length > MAX_BREADCRUMBS) {
            breadcrumbRingBuffer.shift();
        }
    }
    catch {
        // silent
    }
}
function getBrowserInfo() {
    if (typeof window === 'undefined')
        return { browser: 'Node/SSR', os: 'Server' };
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    if (ua.includes('Edg/'))
        browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/'))
        browser = 'Google Chrome';
    else if (ua.includes('Safari/'))
        browser = 'Apple Safari';
    else if (ua.includes('Firefox/'))
        browser = 'Mozilla Firefox';
    let os = 'Unknown OS';
    if (ua.includes('Win'))
        os = 'Windows';
    else if (ua.includes('Mac'))
        os = 'macOS';
    else if (ua.includes('Linux'))
        os = 'Linux';
    else if (ua.includes('Android'))
        os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad'))
        os = 'iOS';
    return { browser, os };
}
export async function reportClientError(report) {
    try {
        const apiBase = ''; // Same origin: nginx (containers) and the Vite dev proxy forward /api to the gateway.
        const { browser, os } = getBrowserInfo();
        const currentRoute = typeof window !== 'undefined' ? window.location.pathname : undefined;
        let userId;
        let userRole;
        if (typeof window !== 'undefined') {
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                if (u.id)
                    userId = u.id;
                if (u.role)
                    userRole = u.role;
            }
            catch { }
        }
        const payload = {
            serviceName: report.serviceName || 'shell-app',
            environment: report.environment || 'production',
            version: report.version || '2.0.0',
            releaseTag: report.releaseTag || 'production-v2.0.0',
            errorType: report.errorType || 'ClientError',
            message: report.message || 'Unknown error occurred',
            stackTrace: report.stackTrace,
            requestMethod: report.requestMethod,
            requestUri: report.requestUri,
            responseStatus: report.responseStatus,
            traceId: report.traceId,
            userId: report.userId ?? userId,
            userRole: report.userRole ?? userRole,
            browser: report.browser || browser,
            os: report.os || os,
            frontendRoute: report.frontendRoute || currentRoute,
            severity: report.severity || 'ERROR',
            metadata: report.metadata,
            breadcrumbs: [...breadcrumbRingBuffer],
        };
        // Non-blocking fire-and-forget
        axios.post(`${apiBase}/api/errors/ingest`, payload).catch(() => { });
    }
    catch {
        // Never let an error-reporting failure hide or interrupt original app error
    }
}
let handlersInitialized = false;
export function initGlobalErrorHandlers(serviceName = 'shell-app') {
    if (typeof window === 'undefined' || handlersInitialized)
        return;
    handlersInitialized = true;
    window.addEventListener('error', (event) => {
        try {
            addBreadcrumb('window.error', event.message);
            reportClientError({
                serviceName,
                errorType: event.error?.name || 'UncaughtError',
                message: event.message || String(event.error),
                stackTrace: event.error?.stack,
                severity: 'CRITICAL',
            });
        }
        catch { }
    });
    window.addEventListener('unhandledrejection', (event) => {
        try {
            const reason = event.reason;
            const message = reason?.message || String(reason);
            addBreadcrumb('promise.rejection', message);
            reportClientError({
                serviceName,
                errorType: reason?.name || 'UnhandledPromiseRejection',
                message,
                stackTrace: reason?.stack,
                severity: 'ERROR',
            });
        }
        catch { }
    });
}
