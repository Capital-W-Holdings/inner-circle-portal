/**
 * In-Memory Data Store
 * Provides persistent-like storage for development and demo mode
 * Falls back to this when DATABASE_URL is not configured
 */

import type {
  Partner,
  Campaign,
  Referral,
  Payout,
  Milestone,
  Notification,
  Experiment,
  PartnerStatus,
  PartnerTier,
  ReferralStatus,
  PayoutStatus,
} from './db';
import { generateRandomString } from './utils';

// ============================================
// Store Types
// ============================================

interface DataStore {
  partners: Map<string, Partner>;
  campaigns: Map<string, Campaign>;
  referrals: Map<string, Referral>;
  payouts: Map<string, Payout>;
  milestones: Map<string, Milestone>;
  notifications: Map<string, Notification>;
  experiments: Map<string, Experiment>;
}

// ============================================
// In-Memory Store (Singleton)
// ============================================

const store: DataStore = {
  partners: new Map(),
  campaigns: new Map(),
  referrals: new Map(),
  payouts: new Map(),
  milestones: new Map(),
  notifications: new Map(),
  experiments: new Map(),
};

// ============================================
// Seed Data
// ============================================

const DEMO_PARTNERS: Omit<Partner, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'partner-demo-123',
    email: 'demo@innercircle.co',
    name: 'Alex Morgan',
    referralCode: 'ALEX2024',
    status: 'ACTIVE',
    tier: 'GOLD',
    phone: '+1-555-0123',
    company: 'Morgan Consulting',
    website: 'https://morganconsulting.co',
    bio: 'Fintech advisor helping startups scale',
    avatarUrl: null,
    emailDigest: true,
    timezone: 'America/New_York',
  },
  {
    id: 'partner-demo-456',
    email: 'sarah@example.com',
    name: 'Sarah Chen',
    referralCode: 'SARAH2024',
    status: 'ACTIVE',
    tier: 'PLATINUM',
    phone: '+1-555-0456',
    company: 'Chen Ventures',
    website: 'https://chenventures.io',
    bio: 'Angel investor and startup mentor',
    avatarUrl: null,
    emailDigest: true,
    timezone: 'America/Los_Angeles',
  },
  {
    id: 'partner-demo-789',
    email: 'marcus@example.com',
    name: 'Marcus Williams',
    referralCode: 'MARCUS24',
    status: 'ACTIVE',
    tier: 'SILVER',
    phone: null,
    company: null,
    website: null,
    bio: null,
    avatarUrl: null,
    emailDigest: false,
    timezone: 'America/Chicago',
  },
  {
    id: 'partner-demo-101',
    email: 'pending@example.com',
    name: 'Jordan Taylor',
    referralCode: 'JORDAN24',
    status: 'PENDING',
    tier: 'STANDARD',
    phone: null,
    company: 'Taylor & Associates',
    website: null,
    bio: null,
    avatarUrl: null,
    emailDigest: true,
    timezone: 'Europe/London',
  },
];

const DEMO_CAMPAIGNS: Omit<Campaign, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'campaign-001',
    partnerId: 'partner-demo-123',
    name: 'LinkedIn Q1 Push',
    source: 'LINKEDIN',
    slug: 'linkedin-q1',
    isActive: true,
    clicks: 1243,
    conversions: 47,
    revenue: 2350000, // cents
  },
  {
    id: 'campaign-002',
    partnerId: 'partner-demo-123',
    name: 'Twitter Ads',
    source: 'TWITTER',
    slug: 'twitter-ads',
    isActive: true,
    clicks: 892,
    conversions: 23,
    revenue: 1150000,
  },
  {
    id: 'campaign-003',
    partnerId: 'partner-demo-123',
    name: 'Email Newsletter',
    source: 'EMAIL',
    slug: 'email-newsletter',
    isActive: true,
    clicks: 456,
    conversions: 31,
    revenue: 1550000,
  },
  {
    id: 'campaign-004',
    partnerId: 'partner-demo-456',
    name: 'Investor Network',
    source: 'OTHER',
    slug: 'investor-network',
    isActive: true,
    clicks: 2341,
    conversions: 156,
    revenue: 7800000,
  },
  {
    id: 'campaign-005',
    partnerId: 'partner-demo-789',
    name: 'Facebook Group',
    source: 'FACEBOOK',
    slug: 'fb-group',
    isActive: false,
    clicks: 234,
    conversions: 8,
    revenue: 400000,
  },
];

const DEMO_REFERRALS: Omit<Referral, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'referral-001',
    partnerId: 'partner-demo-123',
    campaignId: 'campaign-001',
    status: 'CONVERTED',
    customerHash: 'hash_abc123',
    commissionCents: 50000,
    commissionRate: 0.22,
    clickedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    convertedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    payoutId: null,
  },
  {
    id: 'referral-002',
    partnerId: 'partner-demo-123',
    campaignId: 'campaign-002',
    status: 'PAID',
    customerHash: 'hash_def456',
    commissionCents: 45000,
    commissionRate: 0.22,
    clickedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    convertedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    payoutId: 'payout-001',
  },
  {
    id: 'referral-003',
    partnerId: 'partner-demo-123',
    campaignId: 'campaign-001',
    status: 'PENDING',
    customerHash: 'hash_ghi789',
    commissionCents: 0,
    commissionRate: 0.22,
    clickedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    convertedAt: null,
    payoutId: null,
  },
  {
    id: 'referral-004',
    partnerId: 'partner-demo-456',
    campaignId: 'campaign-004',
    status: 'CONVERTED',
    customerHash: 'hash_jkl012',
    commissionCents: 62500,
    commissionRate: 0.25,
    clickedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    convertedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    payoutId: null,
  },
];

const DEMO_PAYOUTS: Omit<Payout, 'requestedAt'>[] = [
  {
    id: 'payout-001',
    partnerId: 'partner-demo-123',
    status: 'COMPLETED',
    amountCents: 250000,
    feeCents: 2500,
    netCents: 247500,
    paymentMethod: 'bank_transfer',
    transactionId: 'txn_abc123xyz',
    processedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'payout-002',
    partnerId: 'partner-demo-123',
    status: 'PENDING',
    amountCents: 95000,
    feeCents: 950,
    netCents: 94050,
    paymentMethod: null,
    transactionId: null,
    processedAt: null,
    completedAt: null,
  },
  {
    id: 'payout-003',
    partnerId: 'partner-demo-456',
    status: 'PROCESSING',
    amountCents: 780000,
    feeCents: 7800,
    netCents: 772200,
    paymentMethod: 'bank_transfer',
    transactionId: 'txn_pending_456',
    processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    completedAt: null,
  },
];

const DEMO_MILESTONES: Omit<Milestone, 'achievedAt'>[] = [
  {
    id: 'milestone-001',
    partnerId: 'partner-demo-123',
    type: 'FIRST_SHARE',
    title: 'First Share!',
    description: 'You shared your referral link for the first time',
    celebrationShown: true,
  },
  {
    id: 'milestone-002',
    partnerId: 'partner-demo-123',
    type: 'FIRST_CONVERSION',
    title: 'First Conversion!',
    description: 'Your first referral converted',
    celebrationShown: true,
  },
  {
    id: 'milestone-003',
    partnerId: 'partner-demo-123',
    type: 'THOUSAND_EARNED',
    title: '$1,000 Earned!',
    description: 'You\'ve earned over $1,000 in commissions',
    celebrationShown: true,
  },
  {
    id: 'milestone-004',
    partnerId: 'partner-demo-123',
    type: 'TIER_UPGRADE',
    title: 'Gold Partner!',
    description: 'You\'ve been upgraded to Gold tier',
    celebrationShown: false,
  },
  {
    id: 'milestone-005',
    partnerId: 'partner-demo-456',
    type: 'TEN_THOUSAND_EARNED',
    title: '$10,000 Earned!',
    description: 'Incredible! You\'ve earned over $10,000',
    celebrationShown: true,
  },
];

const DEMO_NOTIFICATIONS: Omit<Notification, 'createdAt'>[] = [
  {
    id: 'notif-001',
    partnerId: 'partner-demo-123',
    type: 'CONVERSION',
    title: 'New Conversion!',
    message: 'Someone signed up through your LinkedIn campaign',
    link: '/campaigns/campaign-001',
    read: false,
    readAt: null,
  },
  {
    id: 'notif-002',
    partnerId: 'partner-demo-123',
    type: 'PAYOUT',
    title: 'Payout Processing',
    message: 'Your payout of $950.00 is being processed',
    link: '/payouts/payout-002',
    read: false,
    readAt: null,
  },
  {
    id: 'notif-003',
    partnerId: 'partner-demo-123',
    type: 'MILESTONE',
    title: 'Achievement Unlocked!',
    message: 'You\'ve been upgraded to Gold tier',
    link: null,
    read: false,
    readAt: null,
  },
  {
    id: 'notif-004',
    partnerId: 'partner-demo-123',
    type: 'SYSTEM',
    title: 'New Feature Available',
    message: 'Check out our new campaign analytics dashboard',
    link: '/analytics',
    read: true,
    readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

const DEMO_EXPERIMENTS: Omit<Experiment, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'exp-001',
    name: 'Landing Page CTA',
    description: 'Testing different CTA button colors',
    status: 'RUNNING',
    variants: { control: 'blue', variant_a: 'green', variant_b: 'orange' },
    targetRatio: 0.5,
    startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endedAt: null,
  },
  {
    id: 'exp-002',
    name: 'Commission Display',
    description: 'Show commission rate vs dollar amount',
    status: 'COMPLETED',
    variants: { control: 'percentage', variant_a: 'dollar_amount' },
    targetRatio: 0.5,
    startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
];

// ============================================
// Seed Function
// ============================================

let isSeeded = false;

export function seedStore(): void {
  if (isSeeded) return;
  
  const now = new Date();
  
  // Seed partners
  DEMO_PARTNERS.forEach(p => {
    store.partners.set(p.id, {
      ...p,
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });
  });
  
  // Seed campaigns
  DEMO_CAMPAIGNS.forEach(c => {
    store.campaigns.set(c.id, {
      ...c,
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });
  });
  
  // Seed referrals
  DEMO_REFERRALS.forEach(r => {
    store.referrals.set(r.id, {
      ...r,
      createdAt: r.clickedAt ?? now,
      updatedAt: now,
    });
  });
  
  // Seed payouts
  DEMO_PAYOUTS.forEach(p => {
    store.payouts.set(p.id, {
      ...p,
      requestedAt: p.processedAt ?? new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    });
  });
  
  // Seed milestones
  DEMO_MILESTONES.forEach(m => {
    store.milestones.set(m.id, {
      ...m,
      achievedAt: new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000),
    });
  });
  
  // Seed notifications
  DEMO_NOTIFICATIONS.forEach(n => {
    store.notifications.set(n.id, {
      ...n,
      createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  });
  
  // Seed experiments
  DEMO_EXPERIMENTS.forEach(e => {
    store.experiments.set(e.id, {
      ...e,
      createdAt: e.startedAt ?? now,
      updatedAt: now,
    });
  });
  
  isSeeded = true;
  console.log('[DataStore] Seeded with demo data');
}

// ============================================
// Repository Interfaces
// ============================================

export interface PartnerRepository {
  findById(id: string): Promise<Partner | null>;
  findByEmail(email: string): Promise<Partner | null>;
  findByReferralCode(code: string): Promise<Partner | null>;
  findAll(options?: { status?: PartnerStatus; tier?: PartnerTier; limit?: number; offset?: number }): Promise<Partner[]>;
  count(options?: { status?: PartnerStatus; tier?: PartnerTier }): Promise<number>;
  create(data: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Partner>;
  update(id: string, data: Partial<Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Partner | null>;
  delete(id: string): Promise<boolean>;
}

export interface CampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  findByPartnerId(partnerId: string, options?: { isActive?: boolean; limit?: number; offset?: number }): Promise<Campaign[]>;
  countByPartnerId(partnerId: string, options?: { isActive?: boolean }): Promise<number>;
  create(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'clicks' | 'conversions' | 'revenue'>): Promise<Campaign>;
  update(id: string, data: Partial<Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Campaign | null>;
  incrementStats(id: string, stats: { clicks?: number; conversions?: number; revenue?: number }): Promise<Campaign | null>;
  delete(id: string): Promise<boolean>;
}

export interface ReferralRepository {
  findById(id: string): Promise<Referral | null>;
  findByPartnerId(partnerId: string, options?: { status?: ReferralStatus; limit?: number; offset?: number }): Promise<Referral[]>;
  countByPartnerId(partnerId: string, options?: { status?: ReferralStatus }): Promise<number>;
  create(data: Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>): Promise<Referral>;
  update(id: string, data: Partial<Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Referral | null>;
}

export interface PayoutRepository {
  findById(id: string): Promise<Payout | null>;
  findByPartnerId(partnerId: string, options?: { status?: PayoutStatus; limit?: number; offset?: number }): Promise<Payout[]>;
  countByPartnerId(partnerId: string, options?: { status?: PayoutStatus }): Promise<number>;
  create(data: Omit<Payout, 'id' | 'requestedAt'>): Promise<Payout>;
  update(id: string, data: Partial<Omit<Payout, 'id' | 'requestedAt'>>): Promise<Payout | null>;
}

export interface NotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findByPartnerId(partnerId: string, options?: { unreadOnly?: boolean; limit?: number; offset?: number }): Promise<Notification[]>;
  countUnread(partnerId: string): Promise<number>;
  create(data: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  markAsRead(id: string): Promise<Notification | null>;
  markAllAsRead(partnerId: string): Promise<number>;
}

// ============================================
// In-Memory Repository Implementations
// ============================================

export const inMemoryPartnerRepo: PartnerRepository = {
  async findById(id) {
    seedStore();
    return store.partners.get(id) ?? null;
  },
  
  async findByEmail(email) {
    seedStore();
    return Array.from(store.partners.values()).find(p => p.email === email) ?? null;
  },
  
  async findByReferralCode(code) {
    seedStore();
    return Array.from(store.partners.values()).find(p => p.referralCode === code) ?? null;
  },
  
  async findAll(options = {}) {
    seedStore();
    let partners = Array.from(store.partners.values());
    
    if (options.status) {
      partners = partners.filter(p => p.status === options.status);
    }
    if (options.tier) {
      partners = partners.filter(p => p.tier === options.tier);
    }
    
    partners.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 20;
    return partners.slice(offset, offset + limit);
  },
  
  async count(options = {}) {
    seedStore();
    let partners = Array.from(store.partners.values());
    
    if (options.status) {
      partners = partners.filter(p => p.status === options.status);
    }
    if (options.tier) {
      partners = partners.filter(p => p.tier === options.tier);
    }
    
    return partners.length;
  },
  
  async create(data) {
    seedStore();
    const partner: Partner = {
      ...data,
      id: `partner-${generateRandomString(12)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.partners.set(partner.id, partner);
    return partner;
  },
  
  async update(id, data) {
    seedStore();
    const existing = store.partners.get(id);
    if (!existing) return null;
    
    const updated: Partner = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    store.partners.set(id, updated);
    return updated;
  },
  
  async delete(id) {
    seedStore();
    return store.partners.delete(id);
  },
};

export const inMemoryCampaignRepo: CampaignRepository = {
  async findById(id) {
    seedStore();
    return store.campaigns.get(id) ?? null;
  },
  
  async findByPartnerId(partnerId, options = {}) {
    seedStore();
    let campaigns = Array.from(store.campaigns.values())
      .filter(c => c.partnerId === partnerId);
    
    if (options.isActive !== undefined) {
      campaigns = campaigns.filter(c => c.isActive === options.isActive);
    }
    
    campaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 20;
    return campaigns.slice(offset, offset + limit);
  },
  
  async countByPartnerId(partnerId, options = {}) {
    seedStore();
    let campaigns = Array.from(store.campaigns.values())
      .filter(c => c.partnerId === partnerId);
    
    if (options.isActive !== undefined) {
      campaigns = campaigns.filter(c => c.isActive === options.isActive);
    }
    
    return campaigns.length;
  },
  
  async create(data) {
    seedStore();
    const campaign: Campaign = {
      ...data,
      id: `campaign-${generateRandomString(12)}`,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.campaigns.set(campaign.id, campaign);
    return campaign;
  },
  
  async update(id, data) {
    seedStore();
    const existing = store.campaigns.get(id);
    if (!existing) return null;
    
    const updated: Campaign = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    store.campaigns.set(id, updated);
    return updated;
  },
  
  async incrementStats(id, stats) {
    seedStore();
    const existing = store.campaigns.get(id);
    if (!existing) return null;
    
    const updated: Campaign = {
      ...existing,
      clicks: existing.clicks + (stats.clicks ?? 0),
      conversions: existing.conversions + (stats.conversions ?? 0),
      revenue: existing.revenue + (stats.revenue ?? 0),
      updatedAt: new Date(),
    };
    store.campaigns.set(id, updated);
    return updated;
  },
  
  async delete(id) {
    seedStore();
    return store.campaigns.delete(id);
  },
};

export const inMemoryReferralRepo: ReferralRepository = {
  async findById(id) {
    seedStore();
    return store.referrals.get(id) ?? null;
  },
  
  async findByPartnerId(partnerId, options = {}) {
    seedStore();
    let referrals = Array.from(store.referrals.values())
      .filter(r => r.partnerId === partnerId);
    
    if (options.status) {
      referrals = referrals.filter(r => r.status === options.status);
    }
    
    referrals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 20;
    return referrals.slice(offset, offset + limit);
  },
  
  async countByPartnerId(partnerId, options = {}) {
    seedStore();
    let referrals = Array.from(store.referrals.values())
      .filter(r => r.partnerId === partnerId);
    
    if (options.status) {
      referrals = referrals.filter(r => r.status === options.status);
    }
    
    return referrals.length;
  },
  
  async create(data) {
    seedStore();
    const referral: Referral = {
      ...data,
      id: `referral-${generateRandomString(12)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.referrals.set(referral.id, referral);
    return referral;
  },
  
  async update(id, data) {
    seedStore();
    const existing = store.referrals.get(id);
    if (!existing) return null;
    
    const updated: Referral = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    store.referrals.set(id, updated);
    return updated;
  },
};

export const inMemoryPayoutRepo: PayoutRepository = {
  async findById(id) {
    seedStore();
    return store.payouts.get(id) ?? null;
  },
  
  async findByPartnerId(partnerId, options = {}) {
    seedStore();
    let payouts = Array.from(store.payouts.values())
      .filter(p => p.partnerId === partnerId);
    
    if (options.status) {
      payouts = payouts.filter(p => p.status === options.status);
    }
    
    payouts.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
    
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 20;
    return payouts.slice(offset, offset + limit);
  },
  
  async countByPartnerId(partnerId, options = {}) {
    seedStore();
    let payouts = Array.from(store.payouts.values())
      .filter(p => p.partnerId === partnerId);
    
    if (options.status) {
      payouts = payouts.filter(p => p.status === options.status);
    }
    
    return payouts.length;
  },
  
  async create(data) {
    seedStore();
    const payout: Payout = {
      ...data,
      id: `payout-${generateRandomString(12)}`,
      requestedAt: new Date(),
    };
    store.payouts.set(payout.id, payout);
    return payout;
  },
  
  async update(id, data) {
    seedStore();
    const existing = store.payouts.get(id);
    if (!existing) return null;
    
    const updated: Payout = {
      ...existing,
      ...data,
      id: existing.id,
      requestedAt: existing.requestedAt,
    };
    store.payouts.set(id, updated);
    return updated;
  },
};

export const inMemoryNotificationRepo: NotificationRepository = {
  async findById(id) {
    seedStore();
    return store.notifications.get(id) ?? null;
  },
  
  async findByPartnerId(partnerId, options = {}) {
    seedStore();
    let notifications = Array.from(store.notifications.values())
      .filter(n => n.partnerId === partnerId);
    
    if (options.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }
    
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 20;
    return notifications.slice(offset, offset + limit);
  },
  
  async countUnread(partnerId) {
    seedStore();
    return Array.from(store.notifications.values())
      .filter(n => n.partnerId === partnerId && !n.read)
      .length;
  },
  
  async create(data) {
    seedStore();
    const notification: Notification = {
      ...data,
      id: `notif-${generateRandomString(12)}`,
      createdAt: new Date(),
    };
    store.notifications.set(notification.id, notification);
    return notification;
  },
  
  async markAsRead(id) {
    seedStore();
    const existing = store.notifications.get(id);
    if (!existing) return null;
    
    const updated: Notification = {
      ...existing,
      read: true,
      readAt: new Date(),
    };
    store.notifications.set(id, updated);
    return updated;
  },
  
  async markAllAsRead(partnerId) {
    seedStore();
    let count = 0;
    store.notifications.forEach((n, id) => {
      if (n.partnerId === partnerId && !n.read) {
        store.notifications.set(id, { ...n, read: true, readAt: new Date() });
        count++;
      }
    });
    return count;
  },
};

// ============================================
// Stats Helpers
// ============================================

export async function getPartnerStats(partnerId: string): Promise<{
  totalEarned: number;
  pendingPayout: number;
  totalReferrals: number;
  referralsThisMonth: number;
  clicksThisMonth: number;
  conversionRate: number;
}> {
  seedStore();
  
  const campaigns = Array.from(store.campaigns.values())
    .filter(c => c.partnerId === partnerId);
  
  const referrals = Array.from(store.referrals.values())
    .filter(r => r.partnerId === partnerId);
  
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  
  const referralsThisMonth = referrals.filter(r => 
    r.convertedAt && r.convertedAt >= monthStart
  ).length;
  
  const clicksThisMonth = campaigns.reduce((sum, c) => {
    // Approximate: assume 30% of clicks are from this month
    return sum + Math.floor(c.clicks * 0.3);
  }, 0);
  
  const paidAmount = referrals
    .filter(r => r.status === 'PAID')
    .reduce((sum, r) => sum + r.commissionCents, 0);
  
  const pendingAmount = referrals
    .filter(r => r.status === 'CONVERTED')
    .reduce((sum, r) => sum + r.commissionCents, 0);
  
  return {
    totalEarned: paidAmount,
    pendingPayout: pendingAmount,
    totalReferrals: totalConversions,
    referralsThisMonth,
    clicksThisMonth,
    conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
  };
}

export async function getLeaderboard(limit: number = 10): Promise<Array<{
  partnerId: string;
  partnerName: string;
  tier: PartnerTier;
  totalEarned: number;
  referralsThisMonth: number;
  rank: number;
}>> {
  seedStore();
  
  const partners = Array.from(store.partners.values())
    .filter(p => p.status === 'ACTIVE');
  
  const stats = await Promise.all(
    partners.map(async p => {
      const partnerStats = await getPartnerStats(p.id);
      return {
        partnerId: p.id,
        partnerName: p.name,
        tier: p.tier,
        totalEarned: partnerStats.totalEarned,
        referralsThisMonth: partnerStats.referralsThisMonth,
      };
    })
  );
  
  return stats
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .slice(0, limit)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}
