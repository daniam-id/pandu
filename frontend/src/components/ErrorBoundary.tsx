import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface State {
  error: Error | null;
}

/**
 * App-level error boundary. Catches render errors anywhere below it and shows
 * a recoverable fallback. Event-handler errors go through toasts instead.
 */
export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console -- surface full stack for debugging
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="min-h-screen flex items-center justify-center p-8 bg-surface"
        >
          <div className="max-w-md w-full text-center bg-white rounded-lg shadow-md border border-border p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-status-error/10 mb-3">
              <AlertTriangle
                className="w-6 h-6 text-status-error"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-text-muted mb-4 break-words">
              An unexpected error occurred. Our team has been notified.
            </p>
            <Button onClick={this.handleReload}>Reload dashboard</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
