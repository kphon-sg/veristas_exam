import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-100">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Something went wrong</h2>
            <p className="text-slate-600 text-sm mb-8 leading-relaxed">
              The application encountered an unexpected error. We've logged the issue and are working on it.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-8 text-left overflow-hidden border border-slate-200">
              <p className="text-[10px] font-mono text-rose-600 break-all uppercase tracking-widest mb-2 font-bold">Error Details</p>
              <p className="text-xs text-slate-700 font-mono line-clamp-3 leading-relaxed">
                {this.state.error?.message || 'Unknown runtime error'}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
