/**
 * Error Page
 * Displays error UI and reports to Sentry
 */

'use client';

import React, { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps): React.ReactElement {
  useEffect(() => {
    // Report error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorType: 'page_error',
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
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

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            We encountered an unexpected error. Our team has been notified
            and is working to fix it.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left mb-6 bg-gray-100 rounded-lg p-4">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-600 overflow-auto whitespace-pre-wrap">
                {error.message}
                {error.digest && `\n\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Go Home
            </a>
          </div>

          {/* Support Link */}
          <p className="mt-6 text-sm text-gray-500">
            If this problem persists, please{' '}
            <a
              href="mailto:support@innercircle.co"
              className="text-primary-600 hover:underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
