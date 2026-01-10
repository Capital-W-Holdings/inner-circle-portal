/**
 * Rate Limiting Middleware
 * Uses Upstash Redis for distributed rate limiting
 * Falls back to in-memory limiting for development
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ============================================
// Types
// ============================================

export interface RateLimitConfig {
  requests: number;
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`;
  identifier: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// ============================================
// Rate Limit Configurations
// ============================================

export const RateLimitConfigs = {
  // General API calls: 100 requests per minute
  API_GENERAL: {
    requests: 100,
    window: '1 m' as const,
    identifier: 'api_general',
  },
  // Auth attempts: 5 per minute (brute force protection)
  AUTH: {
    requests: 5,
    window: '1 m' as const,
    identifier: 'auth',
  },
  // Share tracking: 30 per minute
  SHARE_TRACKING: {
    requests: 30,
    window: '1 m' as const,
    identifier: 'share',
  },
  // Campaign creation: 10 per hour
  CAMPAIGN_CREATE: {
    requests: 10,
    window: '1 h' as const,
    identifier: 'campaign_create',
  },
  // Payout requests: 5 per day
  PAYOUT_REQUEST: {
    requests: 5,
    window: '1 d' as const,
    identifier: 'payout',
  },
  // Export requests: 10 per hour
  DATA_EXPORT: {
    requests: 10,
    window: '1 h' as const,
    identifier: 'export',
  },
} as const;

// ============================================
// Redis Client (Lazy Initialization)
// ============================================

let redis: Redis | null = null;
let rateLimiters: Map<string, Ratelimit> = new Map();

function getRedisClient(): Redis | null {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn('[RateLimit] Upstash credentials not configured, using in-memory fallback');
    return null;
  }
  
  redis = new Redis({ url, token });
  return redis;
}

function getRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const key = `${config.identifier}_${config.requests}_${config.window}`;
  
  if (rateLimiters.has(key)) {
    return rateLimiters.get(key)!;
  }
  
  const redisClient = getRedisClient();
  if (!redisClient) return null;
  
  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `ratelimit:${config.identifier}`,
  });
  
  rateLimiters.set(key, limiter);
  return limiter;
}

// ============================================
// In-Memory Fallback (Development)
// ============================================

interface InMemoryEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, InMemoryEntry>();

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return 60000; // Default 1 minute
  
  const [, num, unit] = match;
  const value = parseInt(num!, 10);
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 60000;
  }
}

function checkInMemoryLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = parseWindow(config.window);
  const key = `${config.identifier}:${identifier}`;
  
  const entry = inMemoryStore.get(key);
  
  if (!entry || now >= entry.resetAt) {
    // New window
    inMemoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      reset: now + windowMs,
    };
  }
  
  if (entry.count >= config.requests) {
    // Rate limited
    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      reset: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  
  // Increment
  entry.count++;
  
  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - entry.count,
    reset: entry.resetAt,
  };
}

// ============================================
// Main Rate Limit Function
// ============================================

/**
 * Check rate limit for an identifier
 * Uses Upstash in production, in-memory in development
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(config);
  
  if (!limiter) {
    // Use in-memory fallback
    return checkInMemoryLimit(identifier, config);
  }
  
  try {
    const result = await limiter.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // Fail open in case of Redis errors
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Date.now() + parseWindow(config.window),
    };
  }
}

// ============================================
// Client Identifier Extraction
// ============================================

/**
 * Extract a unique identifier from the request
 * Uses IP address, falling back to a fingerprint
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0]?.trim();
    if (ip) return ip;
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  
  // Fallback to a fingerprint based on user agent
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  return `ua:${hashString(userAgent)}`;
}

/**
 * Simple string hash for fingerprinting
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================
// Response Helpers
// ============================================

/**
 * Create rate limit headers for the response
 */
export function rateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());
  
  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
  
  return headers;
}

/**
 * Check if rate limit should be enforced
 * Disabled in test environment
 */
export function shouldEnforceRateLimit(): boolean {
  return process.env.NODE_ENV !== 'test';
}
