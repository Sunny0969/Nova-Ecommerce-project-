import React from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    toast.error('Something went wrong. Try refreshing.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="container">
            <h1>Something went wrong</h1>
            <p>Page failed to load. <Link to="/">Go home</Link> or refresh.</p>
            <details>
              <summary>Details (click)</summary>
              <pre>{this.state.error?.message || 'Unknown error'}</pre>
            </details>
            <button onClick={() => window.location.reload()}>Reload page</button>
          </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
