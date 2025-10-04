import React from 'react';
import ReactDOM from 'react-dom/client';
import { BookingWidget } from '../components/BookingWidget/BookingWidget';

interface WidgetConfig {
  config?: any;
  elementAttributes?: Record<string, string>;
}

// Error boundary component for comprehensive error handling
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; resetError: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; resetError: () => void }> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('Heiwa Widget Error Boundary caught an error:', error, errorInfo);

    // Report to error tracking if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          component: 'heiwa-widget',
          version: '2.0.0',
        },
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || WidgetErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
function WidgetErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#dc2626',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      role="alert"
    >
      <div style={{ marginBottom: '12px' }}>
        <strong>Something went wrong with the booking widget</strong>
      </div>
      <div style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.8 }}>
        {error.message}
      </div>
      <button
        onClick={resetError}
        style={{
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        aria-label="Try again"
      >
        Try Again
      </button>
    </div>
  );
}

export function mountWidget(
  container: HTMLElement,
  props: WidgetConfig = {}
): ReactDOM.Root {
  const root = ReactDOM.createRoot(container);

  // Clear any existing loading state
  const existingLoading = container.querySelector('[data-heiwa-loading]');
  if (existingLoading) {
    existingLoading.remove();
  }

  // Merge configuration from multiple sources
  const widgetProps = createWidgetProps(props);

  root.render(
    <React.StrictMode>
      <WidgetErrorBoundary>
        <BookingWidget {...widgetProps} />
      </WidgetErrorBoundary>
    </React.StrictMode>
  );

  return root;
}

function createWidgetProps({ config, elementAttributes = {} }: WidgetConfig) {
  // Start with base configuration
  const baseConfig = {
    apiEndpoint: config?.settings?.apiEndpoint || 'http://localhost:3005/api',
    apiKey: config?.settings?.apiKey || '',
    position: 'right' as const,
    primaryColor: '#f97316',
    triggerText: 'Book Your Surf Trip',
    maxGuests: 10,
    ...config?.settings,
  };

  // Override with element attributes (higher priority)
  const finalConfig = {
    ...baseConfig,
    ...elementAttributes,
    // Convert string attributes to appropriate types
    maxGuests: elementAttributes.maxGuests
      ? parseInt(elementAttributes.maxGuests, 10)
      : baseConfig.maxGuests,
  };

  return {
    config: finalConfig,
    // Pass through any additional props that might be needed
    ...elementAttributes,
  };
}

// Utility function for unmounting (useful for cleanup)
export function unmountWidget(root: ReactDOM.Root): void {
  root.unmount();
}

// Error boundary component for the widget
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}


// Higher-order component that wraps BookingWidget with error boundary
export function createWidgetWithErrorBoundary() {
  return function WidgetWithErrorHandling(props: any) {
    const [error, setError] = React.useState<Error | null>(null);

    const resetError = React.useCallback(() => {
      setError(null);
    }, []);

    if (error) {
      return <WidgetErrorBoundary error={error} resetError={resetError} />;
    }

    try {
      return <BookingWidget {...props} />;
    } catch (err) {
      setError(err as Error);
      return <WidgetErrorBoundary error={err as Error} resetError={resetError} />;
    }
  };
}
