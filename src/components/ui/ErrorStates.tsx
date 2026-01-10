/**
 * Error Handling Components
 * Error boundaries and error state displays
 */

'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Error Boundary
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <ErrorDisplay 
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// Error Display Component
// ============================================

interface ErrorDisplayProps {
  error?: Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorDisplayProps) {
  const displayMessage = message || error?.message || 'An unexpected error occurred. Please try again.';
  
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 max-w-md">{displayMessage}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </button>
      )}
      
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-6 text-left w-full max-w-lg">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Error Details (Development Only)
          </summary>
          <pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-xs">
            {error.stack || error.toString()}
          </pre>
        </details>
      )}
    </div>
  );
}

// ============================================
// API Error Display
// ============================================

interface ApiErrorProps {
  error: {
    code?: string;
    message?: string;
    status?: number;
  };
  onRetry?: () => void;
}

export function ApiError({ error, onRetry }: ApiErrorProps) {
  const getErrorInfo = () => {
    switch (error.status) {
      case 400:
        return {
          title: 'Invalid Request',
          message: error.message || 'The request was invalid. Please check your input and try again.',
        };
      case 401:
        return {
          title: 'Authentication Required',
          message: 'Please sign in to access this content.',
        };
      case 403:
        return {
          title: 'Access Denied',
          message: "You don't have permission to access this resource.",
        };
      case 404:
        return {
          title: 'Not Found',
          message: 'The requested resource could not be found.',
        };
      case 429:
        return {
          title: 'Too Many Requests',
          message: 'Please wait a moment before trying again.',
        };
      case 500:
        return {
          title: 'Server Error',
          message: 'An internal server error occurred. Our team has been notified.',
        };
      default:
        return {
          title: 'Error',
          message: error.message || 'An unexpected error occurred.',
        };
    }
  };

  const { title, message } = getErrorInfo();

  return (
    <div 
      className="bg-red-50 border border-red-200 rounded-lg p-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {error.code && (
            <p className="text-xs text-red-600 mt-1">Error code: {error.code}</p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm text-red-700 underline hover:text-red-800"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Empty State
// ============================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      {icon ? (
        <div className="mb-4">{icon}</div>
      ) : (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-4 max-w-sm">{description}</p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============================================
// Toast Notification
// ============================================

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export function Toast({ type, message, onClose }: ToastProps) {
  const styles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: (
        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: (
        <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const style = styles[type];

  return (
    <div 
      className={cn(
        'fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-up z-50',
        style.bg
      )}
      role="alert"
      aria-live="polite"
    >
      {style.icon}
      <p className={cn('text-sm font-medium', style.text)}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
