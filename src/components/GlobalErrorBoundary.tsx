import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

// Generate a unique error ID for reference
const generateErrorId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `err_${timestamp}_${random}`;
};

export class GlobalErrorBoundary extends Component<Props, State> {
  private errorId: string | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.errorId = generateErrorId();
    
    // Always log errors, even in production
    const errorDetails = {
      errorId: this.errorId,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
    };

    // Log to console with full details
    console.error('[GlobalErrorBoundary] ===== APPLICATION ERROR =====');
    console.error('[GlobalErrorBoundary] Error ID:', this.errorId);
    console.error('[GlobalErrorBoundary] URL:', errorDetails.url);
    console.error('[GlobalErrorBoundary] Time:', errorDetails.timestamp);
    console.error('[GlobalErrorBoundary] Error:', error);
    console.error('[GlobalErrorBoundary] Component Stack:', errorInfo.componentStack);
    console.error('[GlobalErrorBoundary] Full Details:', JSON.stringify(errorDetails, null, 2));
    console.error('[GlobalErrorBoundary] =============================');

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    this.errorId = null;
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    this.errorId = null;
    window.location.href = '/';
  };

  handleCopyError = async () => {
    if (!this.state.error) return;
    
    const errorReport = [
      `Error ID: ${this.errorId}`,
      `Time: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `Error: ${this.state.error.name}: ${this.state.error.message}`,
      `Stack: ${this.state.error.stack || 'N/A'}`,
      `Component: ${this.state.errorInfo?.componentStack || 'N/A'}`,
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(errorReport);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (e) {
      console.error('[GlobalErrorBoundary] Failed to copy error:', e);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorName = this.state.error?.name || 'Error';
      const errorMessage = this.state.error?.message || 'Unknown error';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-muted-foreground mb-4">
                An unexpected error occurred. This has been logged and we'll look into it.
              </p>

              {/* Always show error ID for reference */}
              {this.errorId && (
                <p className="text-xs text-muted-foreground mb-4 font-mono">
                  Error ID: {this.errorId}
                </p>
              )}

              {/* Show condensed error info in production, full details in dev */}
              <details className="text-left mb-4 p-3 bg-muted rounded text-xs">
                <summary className="cursor-pointer font-medium">Error details</summary>
                <div className="mt-2 space-y-2">
                  <p><strong>Type:</strong> {errorName}</p>
                  <p><strong>Message:</strong> {errorMessage}</p>
                  {import.meta.env.DEV && this.state.error?.stack && (
                    <pre className="overflow-auto whitespace-pre-wrap text-[10px] mt-2 p-2 bg-background rounded">
                      {this.state.error.stack}
                    </pre>
                  )}
                  {import.meta.env.DEV && this.state.errorInfo?.componentStack && (
                    <pre className="overflow-auto whitespace-pre-wrap text-[10px] mt-2 p-2 bg-background rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>

              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={this.handleReset} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
                <Button onClick={this.handleCopyError} variant="ghost" size="sm" className="gap-2">
                  {this.state.copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {this.state.copied ? 'Copied!' : 'Copy Error'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
