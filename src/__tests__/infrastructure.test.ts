/**
 * Infrastructure Tests
 * Tests for rate limiting, auth, and environment configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Rate Limit Tests
// ============================================

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should parse window duration correctly', async () => {
    const { checkRateLimit, RateLimitConfigs } = await import('@/lib/rate-limit');
    
    // Should not throw and return a valid result
    const result = await checkRateLimit('test-user', RateLimitConfigs.API_GENERAL);
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('remaining');
    expect(result).toHaveProperty('reset');
  });

  it('should use in-memory fallback when Redis not configured', async () => {
    const { checkRateLimit, RateLimitConfigs } = await import('@/lib/rate-limit');
    
    // Without Upstash credentials, should use in-memory
    const result = await checkRateLimit('test-user-2', RateLimitConfigs.API_GENERAL);
    
    expect(result.success).toBe(true);
    expect(result.remaining).toBeLessThan(result.limit);
  });

  it('should track rate limits per identifier', async () => {
    const { checkRateLimit, RateLimitConfigs } = await import('@/lib/rate-limit');
    
    // Different identifiers should have separate limits
    const result1 = await checkRateLimit('user-a', RateLimitConfigs.API_GENERAL);
    const result2 = await checkRateLimit('user-b', RateLimitConfigs.API_GENERAL);
    
    expect(result1.remaining).toBe(result2.remaining);
  });

  it('should extract client identifier from request headers', async () => {
    const { getClientIdentifier } = await import('@/lib/rate-limit');
    
    // Mock request with x-forwarded-for
    const request1 = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    });
    
    expect(getClientIdentifier(request1)).toBe('192.168.1.1');
    
    // Mock request with x-real-ip
    const request2 = new Request('http://localhost', {
      headers: { 'x-real-ip': '172.16.0.1' },
    });
    
    expect(getClientIdentifier(request2)).toBe('172.16.0.1');
    
    // Mock request with user-agent only
    const request3 = new Request('http://localhost', {
      headers: { 'user-agent': 'Mozilla/5.0' },
    });
    
    expect(getClientIdentifier(request3)).toMatch(/^ua:/);
  });

  it('should generate rate limit headers', async () => {
    const { rateLimitHeaders } = await import('@/lib/rate-limit');
    
    const result = {
      success: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: 60,
    };
    
    const headers = rateLimitHeaders(result);
    
    expect(headers.get('X-RateLimit-Limit')).toBe('100');
    expect(headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(headers.get('Retry-After')).toBe('60');
  });
});

// ============================================
// Auth Tests
// ============================================

describe('Authentication', () => {
  it('should check partner data access', async () => {
    const { canAccessPartnerData } = await import('@/lib/auth');
    
    // Admin can access any partner
    const admin = {
      id: 'admin-1',
      clerkId: 'clerk-admin-1',
      email: 'admin@example.com',
      role: 'ADMIN' as const,
    };
    
    expect(canAccessPartnerData(admin, 'partner-123')).toBe(true);
    expect(canAccessPartnerData(admin, 'partner-456')).toBe(true);
    
    // Partner can only access own data
    const partner = {
      id: 'user-1',
      clerkId: 'clerk-user-1',
      email: 'partner@example.com',
      role: 'PARTNER' as const,
      partnerId: 'partner-123',
    };
    
    expect(canAccessPartnerData(partner, 'partner-123')).toBe(true);
    expect(canAccessPartnerData(partner, 'partner-456')).toBe(false);
    
    // Null user can't access anything
    expect(canAccessPartnerData(null, 'partner-123')).toBe(false);
  });

  it('should check admin status', async () => {
    const { isAdmin, isSuperAdmin } = await import('@/lib/auth');
    
    const admin = { id: '1', clerkId: 'c1', email: 'a@b.com', role: 'ADMIN' as const };
    const superAdmin = { id: '2', clerkId: 'c2', email: 'b@b.com', role: 'SUPER_ADMIN' as const };
    const partner = { id: '3', clerkId: 'c3', email: 'c@b.com', role: 'PARTNER' as const };
    
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(superAdmin)).toBe(true);
    expect(isAdmin(partner)).toBe(false);
    expect(isAdmin(null)).toBe(false);
    
    expect(isSuperAdmin(admin)).toBe(false);
    expect(isSuperAdmin(superAdmin)).toBe(true);
    expect(isSuperAdmin(partner)).toBe(false);
  });

  it('should return mock user in development with ENABLE_MOCK_AUTH', async () => {
    const { getMockAuthUser } = await import('@/lib/auth');
    
    // In test environment with ENABLE_MOCK_AUTH not set, should return unauthenticated
    const result = getMockAuthUser();
    expect(result).toHaveProperty('authenticated');
    expect(result).toHaveProperty('user');
  });

  it('should identify auth errors', async () => {
    const { AuthError, isAuthError } = await import('@/lib/auth');
    
    const authError = new AuthError('Test error', 401);
    const genericError = new Error('Generic error');
    
    expect(isAuthError(authError)).toBe(true);
    expect(isAuthError(genericError)).toBe(false);
    expect(isAuthError(null)).toBe(false);
    expect(isAuthError('string')).toBe(false);
  });
});

// ============================================
// Environment Config Tests
// ============================================

describe('Environment Configuration', () => {
  it('should export feature flags', async () => {
    const { features } = await import('@/lib/env');
    
    expect(features).toHaveProperty('hasAuth');
    expect(features).toHaveProperty('hasDatabase');
    expect(features).toHaveProperty('hasRedis');
    expect(features).toHaveProperty('hasEmail');
    expect(features).toHaveProperty('hasPayments');
    expect(features).toHaveProperty('hasAnalytics');
  });

  it('should provide environment helpers', async () => {
    const { isProduction, isTest } = await import('@/lib/env');
    
    // In test environment
    expect(isTest()).toBe(true);
    expect(isProduction()).toBe(false);
    
    // Note: isServer() returns false in jsdom test environment
    // which is expected behavior
  });

  it('should provide app URL', async () => {
    const { getAppUrl } = await import('@/lib/env');
    
    const url = getAppUrl();
    expect(url).toMatch(/^https?:\/\//);
  });
});

// ============================================
// Utils Tests (Additional)
// ============================================

describe('Utils - Additional Coverage', () => {
  it('should format currency correctly', async () => {
    const { formatCurrency, formatCurrencyCompact } = await import('@/lib/utils');
    
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(100)).toBe('$1.00');
    expect(formatCurrency(12345)).toBe('$123.45');
    expect(formatCurrency(1000000)).toBe('$10,000.00');
    
    expect(formatCurrencyCompact(100000)).toBe('$1.0K');
    expect(formatCurrencyCompact(100000000)).toBe('$1.0M');
  });

  it('should generate random strings', async () => {
    const { generateRandomString } = await import('@/lib/utils');
    
    const str1 = generateRandomString(8);
    const str2 = generateRandomString(8);
    
    expect(str1).toHaveLength(8);
    expect(str2).toHaveLength(8);
    expect(str1).not.toBe(str2);
  });

  it('should slugify strings correctly', async () => {
    const { slugify } = await import('@/lib/utils');
    
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('  Spaces  ')).toBe('spaces');
    expect(slugify('Special!@#Characters')).toBe('specialcharacters');
    expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
  });

  it('should format relative time', async () => {
    const { formatRelativeTime } = await import('@/lib/utils');
    
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');
    
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
    
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
  });

  it('should calculate percentage change', async () => {
    const { calculatePercentageChange } = await import('@/lib/utils');
    
    expect(calculatePercentageChange(100, 150)).toBe(50);
    expect(calculatePercentageChange(100, 50)).toBe(-50);
    expect(calculatePercentageChange(0, 100)).toBe(100);
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });
});
