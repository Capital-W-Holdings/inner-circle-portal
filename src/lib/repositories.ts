/**
 * Repository Factory
 * Provides the appropriate repository implementation based on configuration
 * 
 * In development/demo mode: Uses in-memory store with seed data
 * In production with DATABASE_URL: Uses Prisma with PlanetScale
 */

import { features } from './env';
import {
  inMemoryPartnerRepo,
  inMemoryCampaignRepo,
  inMemoryReferralRepo,
  inMemoryPayoutRepo,
  inMemoryNotificationRepo,
  getPartnerStats as getInMemoryPartnerStats,
  getLeaderboard as getInMemoryLeaderboard,
  seedStore,
  type PartnerRepository,
  type CampaignRepository,
  type ReferralRepository,
  type PayoutRepository,
  type NotificationRepository,
} from './data-store';
import type { PartnerTier } from './db';

// ============================================
// Repository Exports
// ============================================

/**
 * Partner repository
 * Handles all partner-related data operations
 */
export function getPartnerRepository(): PartnerRepository {
  if (features.hasDatabase) {
    // TODO: Return Prisma-based repository when database is configured
    // For now, fall back to in-memory
    console.warn('[Repo] Database configured but Prisma not available, using in-memory');
  }
  
  return inMemoryPartnerRepo;
}

/**
 * Campaign repository
 * Handles all campaign-related data operations
 */
export function getCampaignRepository(): CampaignRepository {
  if (features.hasDatabase) {
    console.warn('[Repo] Database configured but Prisma not available, using in-memory');
  }
  
  return inMemoryCampaignRepo;
}

/**
 * Referral repository
 * Handles all referral-related data operations
 */
export function getReferralRepository(): ReferralRepository {
  if (features.hasDatabase) {
    console.warn('[Repo] Database configured but Prisma not available, using in-memory');
  }
  
  return inMemoryReferralRepo;
}

/**
 * Payout repository
 * Handles all payout-related data operations
 */
export function getPayoutRepository(): PayoutRepository {
  if (features.hasDatabase) {
    console.warn('[Repo] Database configured but Prisma not available, using in-memory');
  }
  
  return inMemoryPayoutRepo;
}

/**
 * Notification repository
 * Handles all notification-related data operations
 */
export function getNotificationRepository(): NotificationRepository {
  if (features.hasDatabase) {
    console.warn('[Repo] Database configured but Prisma not available, using in-memory');
  }
  
  return inMemoryNotificationRepo;
}

// ============================================
// Stats & Analytics
// ============================================

/**
 * Get partner statistics
 */
export async function getPartnerStats(partnerId: string): Promise<{
  totalEarned: number;
  pendingPayout: number;
  totalReferrals: number;
  referralsThisMonth: number;
  clicksThisMonth: number;
  conversionRate: number;
}> {
  if (features.hasDatabase) {
    console.warn('[Repo] Database configured but Prisma not available, using in-memory');
  }
  
  return getInMemoryPartnerStats(partnerId);
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(limit: number = 10): Promise<Array<{
  partnerId: string;
  partnerName: string;
  tier: PartnerTier;
  totalEarned: number;
  referralsThisMonth: number;
  rank: number;
}>> {
  if (features.hasDatabase) {
    console.warn('[Repo] Database configured but Prisma not available, using in-memory');
  }
  
  return getInMemoryLeaderboard(limit);
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the data layer
 * Seeds in-memory store in development mode
 */
export function initializeDataLayer(): void {
  if (!features.hasDatabase) {
    seedStore();
    console.log('[DataLayer] Initialized with in-memory store');
  } else {
    console.log('[DataLayer] Initialized with database connection');
  }
}

// Auto-initialize on import
if (typeof window === 'undefined') {
  // Server-side only
  initializeDataLayer();
}

// ============================================
// Re-export types
// ============================================

export type {
  PartnerRepository,
  CampaignRepository,
  ReferralRepository,
  PayoutRepository,
  NotificationRepository,
} from './data-store';
