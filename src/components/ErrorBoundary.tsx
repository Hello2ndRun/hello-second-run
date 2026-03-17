import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#ffffff] p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-50 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight mb-3">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-2">
              An unexpected error occurred. Please try reloading the page.
            </p>
            {this.state.error?.message && (
              <div className="bg-gray-50 border border-gray-200 p-3 mb-6 mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1">Error details</p>
                <p className="text-xs text-gray-600 font-mono break-all">{this.state.error.message}</p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-[#111113] text-white px-8 py-4 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#111113] transition-all"
            >
              <RefreshCw size={14} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
