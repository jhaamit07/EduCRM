import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-4">
              The app hit an unexpected error. Try reloading the page.
            </p>
            <pre className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3 overflow-auto max-h-48">
              {this.state.error?.message ?? 'Unknown error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full py-2.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
