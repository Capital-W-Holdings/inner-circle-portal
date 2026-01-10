/**
 * Sentry Client Configuration
 * Initializes error monitoring for the browser
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environment configuration
    environment: process.env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay (captures user sessions for debugging)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',
    
    // Filter out non-critical errors
    ignoreErrors: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      
      // Network errors that users can't control
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'AbortError',
      
      // User navigation
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      
      // Third-party scripts
      /^Script error\.?$/,
    ],
    
    // Redact sensitive data
    beforeSend(event) {
      // Remove email addresses from error messages
      if (event.message) {
        event.message = event.message.replace(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
          '[REDACTED_EMAIL]'
        );
      }
      
      // Remove tokens from URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(
          /token=[^&]+/g,
          'token=[REDACTED]'
        );
      }
      
      return event;
    },
    
    // Add custom tags
    initialScope: {
      tags: {
        app: 'inner-circle-portal',
        component: 'client',
      },
    },
  });
}
