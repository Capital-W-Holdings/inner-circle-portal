/**
 * Monitoring Utilities
 * Centralized logging and error reporting
 */

import * as Sentry from '@sentry/nextjs';

// ============================================
// Types
// ============================================

interface LogContext {
  [key: string]: unknown;
}

interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
    partnerId?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  fingerprint?: string[];
}

// ============================================
// Configuration
// ============================================

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Check if Sentry is configured
const isSentryEnabled = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
);

// ============================================
// Logger
// ============================================

/**
 * Structured logger with context
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!IS_PRODUCTION) {
      console.debug(`[DEBUG] ${message}`, context ?? '');
    }
  },
  
  info(message: string, context?: LogContext): void {
    console.info(`[INFO] ${message}`, context ?? '');
    
    if (isSentryEnabled) {
      Sentry.addBreadcrumb({
        category: 'log',
        message,
        data: context,
        level: 'info',
      });
    }
  },
  
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context ?? '');
    
    if (isSentryEnabled) {
      Sentry.addBreadcrumb({
        category: 'log',
        message,
        data: context,
        level: 'warning',
      });
    }
  },
  
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, error, context ?? '');
    
    if (isSentryEnabled && error instanceof Error) {
      Sentry.captureException(error, {
        extra: { message, ...context },
      });
    }
  },
};

// ============================================
// Error Reporting
// ============================================

/**
 * Report an error to Sentry with context
 */
export function reportError(
  error: Error | string,
  context?: ErrorContext
): string | undefined {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  // Log to console
  console.error('[Reported Error]', errorObj, context);
  
  if (!isSentryEnabled) {
    return undefined;
  }
  
  // Set user context if provided
  if (context?.user) {
    Sentry.setUser({
      id: context.user.id,
      email: context.user.email,
      // Custom fields
      partnerId: context.user.partnerId,
    } as Sentry.User);
  }
  
  // Capture exception
  const eventId = Sentry.captureException(errorObj, {
    tags: context?.tags,
    extra: context?.extra,
    fingerprint: context?.fingerprint,
  });
  
  return eventId;
}

/**
 * Report a message (non-error) to Sentry
 */
export function reportMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: LogContext
): string | undefined {
  if (!isSentryEnabled) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return undefined;
  }
  
  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

// ============================================
// Performance Monitoring
// ============================================

/**
 * Create a performance span for tracking operations
 */
export function startSpan<T>(
  name: string,
  operation: string,
  callback: () => T
): T {
  if (!isSentryEnabled) {
    return callback();
  }
  
  return Sentry.startSpan(
    {
      name,
      op: operation,
    },
    callback
  );
}

/**
 * Track a specific metric
 */
export function trackMetric(
  name: string,
  value: number,
  unit?: 'second' | 'millisecond' | 'byte' | 'kilobyte' | 'megabyte' | 'none',
  tags?: Record<string, string>
): void {
  if (!isSentryEnabled) {
    logger.debug(`Metric: ${name}`, { value, unit, tags });
    return;
  }
  
  // Use Sentry's metrics API if available
  try {
    // Note: Tags are logged as breadcrumbs since not all Sentry versions support them in metrics
    if (tags) {
      Sentry.addBreadcrumb({
        category: 'metric',
        message: name,
        data: { value, unit, ...tags },
        level: 'info',
      });
    }
    
    Sentry.metrics.gauge(name, value, {
      unit: unit || 'none',
    });
  } catch {
    // Metrics API may not be available in all Sentry versions
    Sentry.addBreadcrumb({
      category: 'metric',
      message: name,
      data: { value, unit, tags },
      level: 'info',
    });
  }
}

// ============================================
// User Context
// ============================================

/**
 * Set the current user context for error reporting
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  name?: string;
  partnerId?: string;
  tier?: string;
} | null): void {
  if (!isSentryEnabled) return;
  
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
      // Custom fields (Sentry allows additional properties)
      partnerId: user.partnerId,
      tier: user.tier,
    } as Sentry.User);
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add additional context to all future events
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (!isSentryEnabled) return;
  Sentry.setContext(name, context);
}

/**
 * Add a tag to all future events
 */
export function setTag(key: string, value: string): void {
  if (!isSentryEnabled) return;
  Sentry.setTag(key, value);
}

// ============================================
// Breadcrumbs
// ============================================

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): void {
  if (!isSentryEnabled) return;
  
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

// ============================================
// API Request Tracking
// ============================================

/**
 * Track an API request for performance monitoring
 */
export async function trackApiRequest<T>(
  name: string,
  request: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await startSpan(name, 'http.client', request);
    
    const duration = performance.now() - startTime;
    trackMetric(`api.${name}.duration`, duration, 'millisecond');
    trackMetric(`api.${name}.success`, 1, 'none');
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    trackMetric(`api.${name}.duration`, duration, 'millisecond');
    trackMetric(`api.${name}.error`, 1, 'none');
    
    throw error;
  }
}

// ============================================
// Health Check Integration
// ============================================

/**
 * Report health check status
 */
export function reportHealthStatus(
  service: string,
  isHealthy: boolean,
  details?: Record<string, unknown>
): void {
  if (!isHealthy) {
    reportMessage(`Health check failed: ${service}`, 'warning', details);
  }
  
  trackMetric(`health.${service}`, isHealthy ? 1 : 0, 'none');
}

// ============================================
// Export singleton for convenience
// ============================================

export const monitoring = {
  logger,
  reportError,
  reportMessage,
  startSpan,
  trackMetric,
  setUserContext,
  setContext,
  setTag,
  addBreadcrumb,
  trackApiRequest,
  reportHealthStatus,
};

export default monitoring;
