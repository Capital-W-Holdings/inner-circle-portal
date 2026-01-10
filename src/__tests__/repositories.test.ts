/**
 * Repository Tests
 * Tests for the data access layer (in-memory implementation)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  inMemoryPartnerRepo,
  inMemoryCampaignRepo,
  inMemoryPayoutRepo,
  inMemoryNotificationRepo,
  seedStore,
  getPartnerStats,
  getLeaderboard,
} from '@/lib/data-store';

describe('Partner Repository', () => {
  beforeEach(() => {
    seedStore();
  });

  it('should find partner by ID', async () => {
    const partner = await inMemoryPartnerRepo.findById('partner-demo-123');
    expect(partner).not.toBeNull();
    expect(partner?.name).toBe('Alex Morgan');
    expect(partner?.tier).toBe('GOLD');
  });

  it('should find partner by email', async () => {
    const partner = await inMemoryPartnerRepo.findByEmail('demo@innercircle.co');
    expect(partner).not.toBeNull();
    expect(partner?.name).toBe('Alex Morgan');
  });

  it('should find partner by referral code', async () => {
    const partner = await inMemoryPartnerRepo.findByReferralCode('ALEX2024');
    expect(partner).not.toBeNull();
    expect(partner?.name).toBe('Alex Morgan');
  });

  it('should return null for non-existent partner', async () => {
    const partner = await inMemoryPartnerRepo.findById('non-existent');
    expect(partner).toBeNull();
  });

  it('should list all partners with pagination', async () => {
    const partners = await inMemoryPartnerRepo.findAll({ limit: 2 });
    expect(partners).toHaveLength(2);
  });

  it('should filter partners by status', async () => {
    const activePartners = await inMemoryPartnerRepo.findAll({ status: 'ACTIVE' });
    expect(activePartners.every(p => p.status === 'ACTIVE')).toBe(true);
  });

  it('should filter partners by tier', async () => {
    const goldPartners = await inMemoryPartnerRepo.findAll({ tier: 'GOLD' });
    expect(goldPartners.every(p => p.tier === 'GOLD')).toBe(true);
  });

  it('should count partners', async () => {
    const count = await inMemoryPartnerRepo.count();
    expect(count).toBeGreaterThan(0);
  });

  it('should create a new partner', async () => {
    const newPartner = await inMemoryPartnerRepo.create({
      email: 'new@example.com',
      name: 'New Partner',
      referralCode: 'NEW2024',
      status: 'PENDING',
      tier: 'STANDARD',
      phone: null,
      company: null,
      website: null,
      bio: null,
      avatarUrl: null,
      emailDigest: true,
      timezone: 'UTC',
    });

    expect(newPartner.id).toBeDefined();
    expect(newPartner.email).toBe('new@example.com');
    expect(newPartner.createdAt).toBeInstanceOf(Date);
  });

  it('should update a partner', async () => {
    const updated = await inMemoryPartnerRepo.update('partner-demo-123', {
      tier: 'PLATINUM',
    });

    expect(updated).not.toBeNull();
    expect(updated?.tier).toBe('PLATINUM');
  });
});

describe('Campaign Repository', () => {
  beforeEach(() => {
    seedStore();
  });

  it('should find campaign by ID', async () => {
    const campaign = await inMemoryCampaignRepo.findById('campaign-001');
    expect(campaign).not.toBeNull();
    expect(campaign?.name).toBe('LinkedIn Q1 Push');
  });

  it('should find campaigns by partner ID', async () => {
    const campaigns = await inMemoryCampaignRepo.findByPartnerId('partner-demo-123');
    expect(campaigns.length).toBeGreaterThan(0);
    expect(campaigns.every(c => c.partnerId === 'partner-demo-123')).toBe(true);
  });

  it('should create a new campaign', async () => {
    const newCampaign = await inMemoryCampaignRepo.create({
      partnerId: 'partner-demo-123',
      name: 'Test Campaign',
      source: 'EMAIL',
      slug: 'test-campaign',
      isActive: true,
    });

    expect(newCampaign.id).toBeDefined();
    expect(newCampaign.clicks).toBe(0);
    expect(newCampaign.conversions).toBe(0);
  });

  it('should increment campaign stats', async () => {
    const before = await inMemoryCampaignRepo.findById('campaign-001');
    const initialClicks = before?.clicks ?? 0;

    await inMemoryCampaignRepo.incrementStats('campaign-001', { clicks: 10 });

    const after = await inMemoryCampaignRepo.findById('campaign-001');
    expect(after?.clicks).toBe(initialClicks + 10);
  });
});

describe('Payout Repository', () => {
  beforeEach(() => {
    seedStore();
  });

  it('should find payout by ID', async () => {
    const payout = await inMemoryPayoutRepo.findById('payout-001');
    expect(payout).not.toBeNull();
    expect(payout?.status).toBe('COMPLETED');
  });

  it('should find payouts by partner ID', async () => {
    const payouts = await inMemoryPayoutRepo.findByPartnerId('partner-demo-123');
    expect(payouts.length).toBeGreaterThan(0);
  });

  it('should filter payouts by status', async () => {
    const pendingPayouts = await inMemoryPayoutRepo.findByPartnerId('partner-demo-123', {
      status: 'PENDING',
    });
    expect(pendingPayouts.every(p => p.status === 'PENDING')).toBe(true);
  });
});

describe('Notification Repository', () => {
  beforeEach(() => {
    seedStore();
  });

  it('should find notifications by partner ID', async () => {
    const notifications = await inMemoryNotificationRepo.findByPartnerId('partner-demo-123');
    expect(notifications.length).toBeGreaterThan(0);
  });

  it('should count unread notifications', async () => {
    const count = await inMemoryNotificationRepo.countUnread('partner-demo-123');
    expect(count).toBeGreaterThan(0);
  });

  it('should mark notification as read', async () => {
    const before = await inMemoryNotificationRepo.findById('notif-001');
    expect(before?.read).toBe(false);

    await inMemoryNotificationRepo.markAsRead('notif-001');

    const after = await inMemoryNotificationRepo.findById('notif-001');
    expect(after?.read).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    const count = await inMemoryNotificationRepo.markAllAsRead('partner-demo-123');
    expect(count).toBeGreaterThan(0);

    const unread = await inMemoryNotificationRepo.countUnread('partner-demo-123');
    expect(unread).toBe(0);
  });
});

describe('Stats Functions', () => {
  beforeEach(() => {
    seedStore();
  });

  it('should get partner stats', async () => {
    const stats = await getPartnerStats('partner-demo-123');
    
    expect(stats).toHaveProperty('totalEarned');
    expect(stats).toHaveProperty('pendingPayout');
    expect(stats).toHaveProperty('totalReferrals');
    expect(stats).toHaveProperty('conversionRate');
    expect(typeof stats.conversionRate).toBe('number');
  });

  it('should get leaderboard', async () => {
    const leaderboard = await getLeaderboard(5);
    
    expect(leaderboard.length).toBeLessThanOrEqual(5);
    expect(leaderboard[0]).toHaveProperty('rank');
    expect(leaderboard[0]).toHaveProperty('partnerName');
    expect(leaderboard[0]).toHaveProperty('totalEarned');
    expect(leaderboard[0]?.rank).toBe(1);
  });

  it('should sort leaderboard by earnings', async () => {
    const leaderboard = await getLeaderboard(10);
    
    for (let i = 1; i < leaderboard.length; i++) {
      const current = leaderboard[i];
      const previous = leaderboard[i - 1];
      if (current && previous) {
        expect(previous.totalEarned).toBeGreaterThanOrEqual(current.totalEarned);
      }
    }
  });
});
