/**
 * PostHog Analytics Provider
 * Wraps the application with PostHog analytics
 */

'use client';

import React, { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

// ============================================
// Types
// ============================================

interface PostHogProviderProps {
  children: React.ReactNode;
}

// ============================================
// Configuration
// ============================================

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Check if PostHog should be enabled
const isPostHogEnabled = Boolean(POSTHOG_KEY) && typeof window !== 'undefined';

// ============================================
// Initialize PostHog
// ============================================

if (isPostHogEnabled && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    
    // Capture pageviews automatically
    capture_pageview: true,
    
    // Capture page leaves
    capture_pageleave: true,
    
    // Session recording (optional, adjust as needed)
    disable_session_recording: process.env.NODE_ENV !== 'production',
    
    // Respect Do Not Track
    respect_dnt: true,
    
    // Disable in development (enable for testing)
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        // Enable debug mode in development
        posthog.debug();
      }
    },
    
    // Bootstrap with feature flags (if any)
    bootstrap: {
      // Can add feature flags here
    },
    
    // Auto-capture settings
    autocapture: {
      dom_event_allowlist: ['click', 'submit'],
      url_allowlist: ['.*'], // All URLs
      element_allowlist: ['a', 'button', 'form', 'input', 'select', 'textarea'],
      css_selector_allowlist: ['[data-ph-capture]'],
    },
    
    // Property sanitization
    sanitize_properties: (properties) => {
      // Remove sensitive data
      const sanitized = { ...properties };
      
      // Redact email if present in any property
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = sanitized[key].replace(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            '[REDACTED_EMAIL]'
          );
        }
      });
      
      return sanitized;
    },
  });
}

// ============================================
// Provider Component
// ============================================

export function PostHogProvider({ children }: PostHogProviderProps): React.ReactElement {
  // Track page views on route changes
  useEffect(() => {
    if (!isPostHogEnabled) return;
    
    // Capture initial pageview
    posthog.capture('$pageview');
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  if (!isPostHogEnabled) {
    return <>{children}</>;
  }
  
  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  );
}

// ============================================
// Analytics Hooks & Utilities
// ============================================

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!isPostHogEnabled) return;
  posthog.capture(eventName, properties);
}

/**
 * Identify a user
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): void {
  if (!isPostHogEnabled) return;
  posthog.identify(userId, properties);
}

/**
 * Reset user identity (on logout)
 */
export function resetUser(): void {
  if (!isPostHogEnabled) return;
  posthog.reset();
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!isPostHogEnabled) return;
  posthog.people.set(properties);
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (!isPostHogEnabled) return false;
  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Get feature flag value
 */
export function getFeatureFlag<T>(flagKey: string, defaultValue: T): T {
  if (!isPostHogEnabled) return defaultValue;
  return (posthog.getFeatureFlag(flagKey) as T) ?? defaultValue;
}

// ============================================
// Partner-Specific Events
// ============================================

export const PartnerAnalytics = {
  /**
   * Track when partner views dashboard
   */
  dashboardViewed: (partnerId: string, tier: string) => {
    trackEvent('partner_dashboard_viewed', { partnerId, tier });
  },
  
  /**
   * Track when partner shares referral link
   */
  linkShared: (partnerId: string, platform: string, campaignId?: string) => {
    trackEvent('referral_link_shared', { partnerId, platform, campaignId });
  },
  
  /**
   * Track when partner creates a campaign
   */
  campaignCreated: (partnerId: string, source: string) => {
    trackEvent('campaign_created', { partnerId, source });
  },
  
  /**
   * Track conversion
   */
  conversionTracked: (partnerId: string, campaignId?: string, amount?: number) => {
    trackEvent('conversion_tracked', { partnerId, campaignId, amount });
  },
  
  /**
   * Track payout requested
   */
  payoutRequested: (partnerId: string, amount: number) => {
    trackEvent('payout_requested', { partnerId, amount });
  },
  
  /**
   * Track milestone achieved
   */
  milestoneAchieved: (partnerId: string, milestoneType: string) => {
    trackEvent('milestone_achieved', { partnerId, milestoneType });
  },
  
  /**
   * Track QR code generated
   */
  qrCodeGenerated: (partnerId: string, campaignId?: string) => {
    trackEvent('qr_code_generated', { partnerId, campaignId });
  },
  
  /**
   * Track tier upgrade
   */
  tierUpgraded: (partnerId: string, fromTier: string, toTier: string) => {
    trackEvent('tier_upgraded', { partnerId, fromTier, toTier });
  },
};

export default posthog;
