import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallbackPath?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ListingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ListingErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoBack = () => {
    const path = this.props.fallbackPath || '/sell';
    window.location.href = path;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                <p className="text-sm text-muted-foreground">
                  There was an error loading this page. This could be due to a network issue or a temporary problem.
                </p>
              </div>
              
              {this.state.error && (
                <details className="text-left text-xs bg-muted p-3 rounded-lg">
                  <summary className="cursor-pointer text-muted-foreground">Error details</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={this.handleGoBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>
                <Button onClick={this.handleRetry} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
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