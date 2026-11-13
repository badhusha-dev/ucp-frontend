import { Component, type ErrorInfo, type ReactNode } from 'react';
interface Props {
    children: ReactNode;
    serviceName?: string;
    fallback?: ReactNode;
}
interface State {
    hasError: boolean;
    error: Error | null;
}
export declare class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    handleRetry: () => void;
    render(): ReactNode;
}
export {};
