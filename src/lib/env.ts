/**
 * Environment Configuration
 * Type-safe environment variable handling with validation
 */

import { z } from 'zod';

// ============================================
// Schema Definition
// ============================================

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // App configuration
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Inner Circle Partners'),
  
  // Database (PlanetScale)
  DATABASE_URL: z.string().url().optional(),
  
  // Redis (Upstash)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Authentication
  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  
  // Or Auth0
  AUTH0_SECRET: z.string().optional(),
  AUTH0_BASE_URL: z.string().url().optional(),
  AUTH0_ISSUER_BASE_URL: z.string().url().optional(),
  AUTH0_CLIENT_ID: z.string().optional(),
  AUTH0_CLIENT_SECRET: z.string().optional(),
  
  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Payments (Stripe)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  
  // Development
  ENABLE_MOCK_AUTH: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  ENABLE_MOCK_DATA: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
});

// ============================================
// Type Exports
// ============================================

export type Env = z.infer<typeof envSchema>;

// ============================================
// Validation
// ============================================

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    
    // In production, throw to prevent startup
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration');
    }
    
    // In development, warn but continue with defaults
    console.warn('⚠️  Using default values for missing environment variables');
  }
  
  return parsed.success ? parsed.data : (envSchema.parse({}) as Env);
}

// ============================================
// Validated Environment
// ============================================

export const env = validateEnv();

// ============================================
// Feature Flags
// ============================================

export const features = {
  /**
   * Is authentication configured?
   */
  hasAuth: Boolean(
    (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY) ||
    (env.AUTH0_CLIENT_ID && env.AUTH0_CLIENT_SECRET)
  ),
  
  /**
   * Is database configured?
   */
  hasDatabase: Boolean(env.DATABASE_URL),
  
  /**
   * Is Redis configured?
   */
  hasRedis: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
  
  /**
   * Is email configured?
   */
  hasEmail: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
  
  /**
   * Is Stripe configured?
   */
  hasPayments: Boolean(env.STRIPE_SECRET_KEY),
  
  /**
   * Is analytics configured?
   */
  hasAnalytics: Boolean(env.NEXT_PUBLIC_POSTHOG_KEY),
  
  /**
   * Is error monitoring configured?
   */
  hasMonitoring: Boolean(env.SENTRY_DSN),
  
  /**
   * Is mock auth enabled (development only)?
   */
  useMockAuth: env.ENABLE_MOCK_AUTH === true && env.NODE_ENV === 'development',
  
  /**
   * Is mock data enabled (development only)?
   */
  useMockData: env.ENABLE_MOCK_DATA === true || env.NODE_ENV === 'development',
};

// ============================================
// Runtime Checks
// ============================================

/**
 * Check if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

// ============================================
// Configuration Getters
// ============================================

/**
 * Get the app URL
 */
export function getAppUrl(): string {
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }
  
  // Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Default to localhost in development
  return 'http://localhost:3000';
}

/**
 * Get database connection string
 * Throws if not configured in production
 */
export function getDatabaseUrl(): string {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }
  
  if (isProduction()) {
    throw new Error('DATABASE_URL is required in production');
  }
  
  // Return empty string for development (will use mock data)
  return '';
}

// ============================================
// Logging
// ============================================

if (isDevelopment()) {
  console.log('🔧 Environment Configuration:');
  console.log(`   NODE_ENV: ${env.NODE_ENV}`);
  console.log(`   Auth: ${features.hasAuth ? '✅' : '❌ (mock available)'}`);
  console.log(`   Database: ${features.hasDatabase ? '✅' : '❌ (mock data)'}`);
  console.log(`   Redis: ${features.hasRedis ? '✅' : '❌ (in-memory)'}`);
  console.log(`   Email: ${features.hasEmail ? '✅' : '❌'}`);
  console.log(`   Payments: ${features.hasPayments ? '✅' : '❌'}`);
  console.log(`   Analytics: ${features.hasAnalytics ? '✅' : '❌'}`);
}
