/**
 * Sentry Edge Configuration
 * Initializes error monitoring for edge runtime (middleware)
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environment configuration
    environment: process.env.NODE_ENV,
    
    // Performance Monitoring (lower sample rate for edge)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,
    
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',
    
    // Add custom tags
    initialScope: {
      tags: {
        app: 'inner-circle-portal',
        component: 'edge',
      },
    },
  });
}
