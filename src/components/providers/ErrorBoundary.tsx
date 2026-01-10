/**
 * Error Boundary Component
 * Catches React errors and reports them to Sentry
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

// ============================================
// Types
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

// ============================================
// Error Boundary Class Component
// ============================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Report to Sentry
    const eventId = Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
    
    this.setState({ eventId });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, eventId: null });
  };

  handleReportFeedback = (): void => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <div className="bg-red-50 rounded-xl p-6 border border-red-100">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Something went wrong
              </h2>
              
              <p className="text-sm text-gray-600 mb-4">
                We&apos;ve been notified and are working on a fix.
                Please try again or contact support if the problem persists.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-4 bg-gray-100 rounded p-3">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 overflow-auto">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Try Again
                </button>
                
                {this.state.eventId && (
                  <button
                    onClick={this.handleReportFeedback}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Report Feedback
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// HOC for wrapping components
// ============================================

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithErrorBoundary;
}

// ============================================
// Minimal Error Fallback for critical sections
// ============================================

export function MinimalErrorFallback(): React.ReactElement {
  return (
    <div className="p-4 text-center text-gray-500">
      <p>Unable to load this section</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 text-sm text-primary-600 hover:underline"
      >
        Reload page
      </button>
    </div>
  );
}

// ============================================
// API Error Fallback
// ============================================

interface ApiErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
}

export function ApiErrorFallback({ error, onRetry }: ApiErrorFallbackProps): React.ReactElement {
  return (
    <div className="p-6 text-center">
      <div className="w-10 h-10 mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        {error?.message || 'Failed to load data'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary-600 hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
