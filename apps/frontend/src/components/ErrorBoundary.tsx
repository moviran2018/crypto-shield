import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, background: '#0A0A0A', color: '#F5F0E8', minHeight: '100vh' }}>
          <h1 style={{ color: '#ef4444', fontSize: 24 }}>⚠️ App Error</h1>
          <pre style={{ marginTop: 16, padding: 16, background: '#1a1a1a', borderRadius: 8, overflow: 'auto' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
