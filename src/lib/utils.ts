/**
 * Utility Functions
 * All functions are type-safe and handle edge cases
 */

import { z } from 'zod';
import type {
  SharePlatform,
  ApiResponse,
} from '@/types';

// ============================================
// Validation Schemas
// ============================================

export const campaignNameSchema = z
  .string()
  .min(3, 'Campaign name must be at least 3 characters')
  .max(50, 'Campaign name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Campaign name can only contain letters, numbers, spaces, hyphens, and underscores');

export const campaignSourceSchema = z.enum([
  'LINKEDIN',
  'TWITTER',
  'FACEBOOK',
  'EMAIL',
  'SMS',
  'WHATSAPP',
  'WEBSITE',
  'OTHER',
]);

export const createCampaignSchema = z.object({
  name: campaignNameSchema,
  source: campaignSourceSchema,
});

export const partnerIdSchema = z.string().min(1, 'Partner ID is required');

// ============================================
// Currency Helpers (Integer Cents)
// ============================================

/**
 * Convert dollars to cents (integer arithmetic)
 * Prevents floating-point precision errors
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as currency string
 */
export function formatCurrency(cents: number): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Format cents as compact currency (e.g., $1.2K)
 */
export function formatCurrencyCompact(cents: number): string {
  const dollars = centsToDollars(cents);
  if (dollars >= 1000000) {
    return `$${(dollars / 1000000).toFixed(1)}M`;
  }
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}K`;
  }
  return formatCurrency(cents);
}

// ============================================
// String Helpers
// ============================================

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a random alphanumeric string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i];
    if (randomIndex !== undefined) {
      result += chars[randomIndex % chars.length];
    }
  }
  return result;
}

// ============================================
// URL Helpers
// ============================================

/**
 * Build a referral link with optional campaign tracking
 */
export function buildReferralLink(
  baseUrl: string,
  referralCode: string,
  campaignId?: string
): string {
  const url = new URL(`/r/${referralCode}`, baseUrl);
  if (campaignId) {
    url.searchParams.set('c', campaignId);
  }
  return url.toString();
}

/**
 * Build a share URL for a specific platform
 */
export function buildShareUrl(
  platform: SharePlatform,
  text: string,
  url: string
): string {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case 'email':
      return `mailto:?subject=${encodeURIComponent('Check this out!')}&body=${encodedText}%20${encodedUrl}`;
    case 'sms':
      return `sms:?body=${encodedText}%20${encodedUrl}`;
    default:
      return url;
  }
}

// ============================================
// Date/Time Helpers
// ============================================

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format a date for display
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options ?? defaultOptions);
}

// ============================================
// Number Helpers
// ============================================

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// ============================================
// API Response Helpers
// ============================================

/**
 * Create a success API response
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFLICT: 'CONFLICT',
} as const;

// ============================================
// Browser/Environment Detection
// ============================================

/**
 * Check if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if the Web Share API is available
 */
export function canUseWebShare(): boolean {
  return isBrowser() && typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Check if the clipboard API is available
 */
export function canUseClipboard(): boolean {
  return isBrowser() && typeof navigator !== 'undefined' && !!navigator.clipboard;
}

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  if (!isBrowser()) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// ============================================
// Class Name Helpers
// ============================================

/**
 * Conditionally join class names
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
