/**
 * Global Error Page
 * Catches errors in the root layout
 */

'use client';

import React, { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps): React.ReactElement {
  useEffect(() => {
    // Report error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorType: 'global_error',
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
          }}>
            {/* Error Icon */}
            <div style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1.5rem',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg
                style={{ width: '2rem', height: '2rem', color: '#dc2626' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '0.5rem',
            }}>
              Critical Error
            </h1>
            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem',
            }}>
              The application encountered a critical error and needs to reload.
            </p>

            {/* Action Button */}
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
