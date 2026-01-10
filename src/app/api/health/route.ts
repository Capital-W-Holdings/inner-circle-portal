/**
 * Health Check API Endpoint
 * GET /api/health
 * 
 * Returns system health status for monitoring and load balancers
 */

import { NextResponse } from 'next/server';
import { features, env } from '@/lib/env';

// ============================================
// Types
// ============================================

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: CheckResult;
    redis: CheckResult;
    auth: CheckResult;
    email: CheckResult;
    payments: CheckResult;
  };
}

interface CheckResult {
  status: 'pass' | 'fail' | 'skip';
  latency?: number;
  message?: string;
}

// ============================================
// Start Time for Uptime Calculation
// ============================================

const startTime = Date.now();

// ============================================
// Health Checks
// ============================================

async function checkDatabase(): Promise<CheckResult> {
  if (!features.hasDatabase) {
    return { status: 'skip', message: 'Database not configured' };
  }
  
  const start = Date.now();
  
  try {
    // Dynamic import to avoid errors when DB isn't configured
    const { checkDatabaseHealth } = await import('@/lib/db');
    const result = await checkDatabaseHealth();
    
    if (result.connected) {
      return { 
        status: 'pass', 
        latency: result.latency,
      };
    }
    
    return { 
      status: 'fail', 
      message: result.error,
      latency: Date.now() - start,
    };
  } catch (error) {
    return { 
      status: 'fail', 
      message: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - start,
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  if (!features.hasRedis) {
    return { status: 'skip', message: 'Redis not configured' };
  }
  
  const start = Date.now();
  
  try {
    // Simple connectivity check via rate limiter
    const { checkRateLimit, RateLimitConfigs } = await import('@/lib/rate-limit');
    await checkRateLimit('health-check', RateLimitConfigs.API_GENERAL);
    
    return { 
      status: 'pass', 
      latency: Date.now() - start,
    };
  } catch (error) {
    return { 
      status: 'fail', 
      message: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - start,
    };
  }
}

function checkAuth(): CheckResult {
  if (!features.hasAuth) {
    return { status: 'skip', message: 'Auth not configured' };
  }
  
  // Auth is configured, assume working
  return { status: 'pass' };
}

async function checkEmail(): Promise<CheckResult> {
  try {
    const { checkEmailHealth, isEmailConfigured } = await import('@/lib/email');
    
    if (!isEmailConfigured && !features.hasEmail) {
      return { status: 'skip', message: 'Email not configured' };
    }
    
    const result = await checkEmailHealth();
    
    if (result.operational) {
      return { status: 'pass' };
    }
    
    return { 
      status: 'fail', 
      message: result.error,
    };
  } catch (error) {
    return { 
      status: 'fail', 
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkPayments(): Promise<CheckResult> {
  try {
    const { checkStripeHealth, isStripeConfigured } = await import('@/lib/stripe');
    
    if (!isStripeConfigured) {
      return { status: 'skip', message: 'Stripe not configured' };
    }
    
    const result = await checkStripeHealth();
    
    if (result.operational) {
      return { status: 'pass' };
    }
    
    return { 
      status: 'fail', 
      message: result.error,
    };
  } catch (error) {
    return { 
      status: 'fail', 
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Handler
// ============================================

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const [database, redis, email, payments] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkEmail(),
    checkPayments(),
  ]);
  
  const auth = checkAuth();
  
  // Determine overall status
  const checks = { database, redis, auth, email, payments };
  const failedChecks = Object.values(checks).filter(c => c.status === 'fail');
  const skippedChecks = Object.values(checks).filter(c => c.status === 'skip');
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (failedChecks.length === 0) {
    status = 'healthy';
  } else if (failedChecks.length < Object.keys(checks).length - skippedChecks.length) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }
  
  const response: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    environment: env.NODE_ENV,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };
  
  // Return appropriate HTTP status
  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
  
  return NextResponse.json(response, { 
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// ============================================
// Minimal Liveness Check
// ============================================

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}
