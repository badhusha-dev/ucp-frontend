import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import { reportClientError, addBreadcrumb } from '../services/ErrorReporter';
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.handleRetry = () => {
            this.setState({ hasError: false, error: null });
        };
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        addBreadcrumb('react.error_boundary', error.message, { componentStack: errorInfo.componentStack });
        reportClientError({
            serviceName: this.props.serviceName || 'shell-app',
            errorType: error.name || 'ReactErrorBoundaryException',
            message: error.message,
            stackTrace: (error.stack || '') + '\nComponent Stack:' + (errorInfo.componentStack || ''),
            severity: 'CRITICAL',
        });
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsx("div", { style: { padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }, children: _jsxs("div", { style: { padding: '32px', maxWidth: '500px', backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '12px', textAlign: 'center', color: '#F8FAFC' }, children: [_jsx("h3", { style: { margin: '0 0 8px 0', color: '#EF4444', fontWeight: 800 }, children: "Something went wrong" }), _jsx("p", { style: { margin: '0 0 24px 0', color: '#94A3B8', fontSize: '14px' }, children: "An unexpected application error has been safely captured by the Error Stack service for diagnosis." }), _jsx("button", { onClick: this.handleRetry, style: {
                                backgroundColor: '#4F46E5',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }, children: "Try Again" })] }) }));
        }
        return this.props.children;
    }
}
