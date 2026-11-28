import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Search, Trash2 } from 'lucide-react';
import { safeStorage } from '../../lib/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[TripzoBox ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
    this.setState({ errorInfo });

    // Auto-heal storage quota errors
    if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
      safeStorage.clearAppCache();
    }
  }

  public handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleReload = (): void => {
    window.location.reload();
  };

  public handleClearCacheAndReload = (): void => {
    safeStorage.clearAppCache();
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isQuotaError =
        this.state.error?.name === 'QuotaExceededError' ||
        Boolean(this.state.error?.message?.includes('quota'));

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6 bg-[#F5FBF8]">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-emerald-100 shadow-xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center mb-5 shadow-xs">
              <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900 tracking-tight mb-2">
              Something went unexpected
            </h2>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              We encountered a display issue while rendering this section. Your account, bookings, and data are safe.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-emerald-700 select-none">
                  View technical error details
                </summary>
                <div className="mt-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-mono overflow-auto max-h-48 whitespace-pre-wrap">
                  <p className="font-bold">{this.state.error.toString()}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="text-[10px] mt-2 text-red-600">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {isQuotaError ? (
                <button
                  type="button"
                  onClick={this.handleClearCacheAndReload}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cache & Reload
                </button>
              ) : (
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
              )}

              <a
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 hover:border-emerald-300 bg-white text-gray-700 font-semibold text-sm transition-all active:scale-95"
              >
                <Home className="w-4 h-4" />
                Return Home
              </a>

              <a
                href="/trips"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 hover:border-emerald-300 bg-white text-emerald-800 font-semibold text-sm transition-all active:scale-95"
              >
                <Search className="w-4 h-4" />
                Browse Trips
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
