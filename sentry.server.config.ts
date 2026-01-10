/**
 * Sentry Server Configuration
 * Initializes error monitoring for server-side code
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environment configuration
    environment: process.env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',
    
    // Filter out non-critical errors
    ignoreErrors: [
      // Expected errors
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
      
      // Rate limiting
      'Rate limit exceeded',
      
      // Auth errors (expected behavior)
      'Unauthorized',
      'Authentication required',
    ],
    
    // Redact sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }
      
      // Redact email addresses
      if (event.message) {
        event.message = event.message.replace(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
          '[REDACTED_EMAIL]'
        );
      }
      
      return event;
    },
    
    // Add custom tags
    initialScope: {
      tags: {
        app: 'inner-circle-portal',
        component: 'server',
      },
    },
  });
}
