import { describe, it, expect } from 'vitest';
import {
  dollarsToCents,
  centsToDollars,
  formatCurrency,
  formatCurrencyCompact,
  slugify,
  truncate,
  generateRandomString,
  buildReferralLink,
  buildShareUrl,
  formatRelativeTime,
  formatDate,
  formatNumber,
  formatPercentage,
  calculatePercentageChange,
  successResponse,
  errorResponse,
  ErrorCodes,
  cn,
} from '@/lib/utils';

describe('Currency Helpers', () => {
  describe('dollarsToCents', () => {
    it('should convert whole dollars to cents', () => {
      expect(dollarsToCents(10)).toBe(1000);
      expect(dollarsToCents(100)).toBe(10000);
    });

    it('should handle decimal amounts', () => {
      expect(dollarsToCents(10.50)).toBe(1050);
      expect(dollarsToCents(99.99)).toBe(9999);
    });

    it('should round correctly for floating point issues', () => {
      expect(dollarsToCents(0.1 + 0.2)).toBe(30);
    });

    it('should handle zero', () => {
      expect(dollarsToCents(0)).toBe(0);
    });
  });

  describe('centsToDollars', () => {
    it('should convert cents to dollars', () => {
      expect(centsToDollars(1000)).toBe(10);
      expect(centsToDollars(1050)).toBe(10.5);
    });

    it('should handle zero', () => {
      expect(centsToDollars(0)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format cents as USD currency', () => {
      expect(formatCurrency(1000)).toBe('$10.00');
      expect(formatCurrency(1050)).toBe('$10.50');
      expect(formatCurrency(999999)).toBe('$9,999.99');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('formatCurrencyCompact', () => {
    it('should format small amounts normally', () => {
      expect(formatCurrencyCompact(1000)).toBe('$10.00');
      expect(formatCurrencyCompact(99900)).toBe('$999.00');
    });

    it('should compact thousands', () => {
      expect(formatCurrencyCompact(100000)).toBe('$1.0K');
      expect(formatCurrencyCompact(150000)).toBe('$1.5K');
    });

    it('should compact millions', () => {
      expect(formatCurrencyCompact(100000000)).toBe('$1.0M');
      expect(formatCurrencyCompact(250000000)).toBe('$2.5M');
    });
  });
});

describe('String Helpers', () => {
  describe('slugify', () => {
    it('should convert to lowercase and replace spaces', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello! World?')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Hello   World')).toBe('hello-world');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(slugify('  Hello World  ')).toBe('hello-world');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should truncate long strings with ellipsis', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of specified length', () => {
      const result = generateRandomString(10);
      expect(result).toHaveLength(10);
    });

    it('should only contain alphanumeric characters', () => {
      const result = generateRandomString(100);
      expect(result).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('should generate different strings', () => {
      const a = generateRandomString(10);
      const b = generateRandomString(10);
      expect(a).not.toBe(b);
    });
  });
});

describe('URL Helpers', () => {
  describe('buildReferralLink', () => {
    it('should build basic referral link', () => {
      const link = buildReferralLink('https://example.com', 'ABC123');
      expect(link).toBe('https://example.com/r/ABC123');
    });

    it('should include campaign parameter', () => {
      const link = buildReferralLink('https://example.com', 'ABC123', 'linkedin-q1');
      expect(link).toBe('https://example.com/r/ABC123?c=linkedin-q1');
    });
  });

  describe('buildShareUrl', () => {
    it('should build Twitter share URL', () => {
      const url = buildShareUrl('twitter', 'Check this out', 'https://example.com');
      expect(url).toContain('twitter.com/intent/tweet');
      expect(url).toContain('text=Check%20this%20out');
      expect(url).toContain('url=https%3A%2F%2Fexample.com');
    });

    it('should build LinkedIn share URL', () => {
      const url = buildShareUrl('linkedin', 'Check this out', 'https://example.com');
      expect(url).toContain('linkedin.com/sharing');
      expect(url).toContain('url=https%3A%2F%2Fexample.com');
    });

    it('should build WhatsApp share URL', () => {
      const url = buildShareUrl('whatsapp', 'Check this out', 'https://example.com');
      expect(url).toContain('wa.me');
    });

    it('should build email share URL', () => {
      const url = buildShareUrl('email', 'Check this out', 'https://example.com');
      expect(url).toContain('mailto:');
    });
  });
});

describe('Date/Time Helpers', () => {
  describe('formatRelativeTime', () => {
    it('should format recent times as "just now"', () => {
      const date = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      expect(formatRelativeTime(date)).toBe('just now');
    });

    it('should format minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      expect(formatRelativeTime(date)).toBe('5 minutes ago');
    });

    it('should format single minute', () => {
      const date = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago
      expect(formatRelativeTime(date)).toBe('1 minute ago');
    });

    it('should format hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      expect(formatRelativeTime(date)).toBe('3 hours ago');
    });

    it('should format days ago', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      expect(formatRelativeTime(date)).toBe('2 days ago');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2026-01-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2026');
    });
  });
});

describe('Number Helpers', () => {
  describe('formatNumber', () => {
    it('should add commas to large numbers', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(42)).toBe('42');
    });
  });

  describe('formatPercentage', () => {
    it('should format with default decimals', () => {
      expect(formatPercentage(42.567)).toBe('42.6%');
    });

    it('should format with custom decimals', () => {
      expect(formatPercentage(42.567, 2)).toBe('42.57%');
    });
  });

  describe('calculatePercentageChange', () => {
    it('should calculate positive change', () => {
      expect(calculatePercentageChange(100, 150)).toBe(50);
    });

    it('should calculate negative change', () => {
      expect(calculatePercentageChange(100, 75)).toBe(-25);
    });

    it('should handle zero base value', () => {
      expect(calculatePercentageChange(0, 100)).toBe(100);
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });
  });
});

describe('API Response Helpers', () => {
  describe('successResponse', () => {
    it('should create success response with data', () => {
      const response = successResponse({ foo: 'bar' });
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ foo: 'bar' });
      expect(response.error).toBeUndefined();
    });
  });

  describe('errorResponse', () => {
    it('should create error response', () => {
      const response = errorResponse('TEST_ERROR', 'Something went wrong');
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('TEST_ERROR');
      expect(response.error?.message).toBe('Something went wrong');
    });

    it('should include details if provided', () => {
      const response = errorResponse('TEST_ERROR', 'Error', { field: 'value' });
      expect(response.error?.details).toEqual({ field: 'value' });
    });
  });

  describe('ErrorCodes', () => {
    it('should have all standard error codes', () => {
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCodes.CONFLICT).toBe('CONFLICT');
    });
  });
});

describe('cn (classname helper)', () => {
  it('should join class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('should filter falsy values', () => {
    expect(cn('a', false, 'b', null, 'c', undefined)).toBe('a b c');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });
});
