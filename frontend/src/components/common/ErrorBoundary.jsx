import { Component } from 'react';
import { Card, Button } from './ui';

/**
 * ErrorBoundary — catches uncaught errors in the component tree
 * and displays a fallback UI instead of a blank white screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 * Enterprise features:
 * - Logs error details to console (replace with Sentry in production)
 * - Provides "Try again" button to reset the error state
 * - Shows a user-friendly message, not a stack trace
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production, send to Sentry / DataDog / LogRocket
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
    if (typeof window !== 'undefined' && window.newrelic) {
      window.newrelic.noticeError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Allow custom fallback via props
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: 24, maxWidth: 480, margin: '40px auto' }}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--rose-pale)',
                  color: 'var(--rose)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  margin: '0 auto 16px',
                  fontWeight: 700,
                }}
              >
                !
              </div>
              <h3 style={{ marginBottom: 8 }}>Something went wrong</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 20, lineHeight: 1.5 }}>
                {this.props.message ||
                  'An unexpected error occurred. Our team has been notified. Please try again.'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details
                  style={{
                    marginBottom: 16,
                    textAlign: 'left',
                    fontSize: 12,
                    color: 'var(--rose)',
                    background: 'var(--rose-pale)',
                    padding: 12,
                    borderRadius: 6,
                  }}
                >
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Error details (dev only)</summary>
                  <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {this.state.error.stack || this.state.error.message}
                  </pre>
                </details>
              )}
              <Button variant="secondary" onClick={this.handleReset}>
                Try again
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

