import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled application error', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: 'var(--canvas, #f4f1e8)',
          color: 'var(--ink, #16241f)',
        }}
      >
        <section
          style={{
            width: 'min(100%, 520px)',
            padding: '32px',
            border: '1px solid var(--border, #d8d4c9)',
            borderRadius: 12,
            background: 'var(--surface, #ffffff)',
            boxShadow: 'var(--shadow-md, 0 14px 36px rgba(22, 36, 31, 0.12))',
          }}
        >
          <p style={{ margin: '0 0 8px', color: 'var(--ink-soft, #44524b)', fontSize: 13 }}>
            MediFlow encountered an unexpected error
          </p>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(24px, 5vw, 34px)' }}>
            Something went wrong.
          </h1>
          <p style={{ margin: '0 0 24px', color: 'var(--ink-soft, #44524b)', lineHeight: 1.6 }}>
            Your information is safe. Try loading this screen again to continue.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              border: 0,
              borderRadius: 8,
              padding: '11px 18px',
              background: 'var(--accent, #0e6e5c)',
              color: '#ffffff',
              font: 'inherit',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
