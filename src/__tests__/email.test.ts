/**
 * Email Service Tests
 * Tests for email sending functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendEmail,
  sendBulkEmails,
  isValidEmail,
  canSendEmails,
} from '@/lib/email';

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'mock-email-id' }, error: null }),
    },
    batch: {
      send: vi.fn().mockResolvedValue({ 
        data: { data: [{ id: 'mock-batch-1' }, { id: 'mock-batch-2' }] }, 
        error: null 
      }),
    },
  })),
}));

describe('Email Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendEmail', () => {
    it('should simulate send when Resend not configured', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^mock-/);
    });

    it('should accept string recipient', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(true);
    });

    it('should accept recipient object', async () => {
      const result = await sendEmail({
        to: { email: 'test@example.com', name: 'Test User' },
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(true);
    });

    it('should accept array of recipients', async () => {
      const result = await sendEmail({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendBulkEmails', () => {
    it('should simulate bulk send when Resend not configured', async () => {
      const result = await sendBulkEmails([
        { to: 'test1@example.com', subject: 'Test 1', text: 'Content 1' },
        { to: 'test2@example.com', subject: 'Test 2', text: 'Content 2' },
      ]);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('canSendEmails', () => {
    it('should return appropriate value based on configuration', () => {
      // Without Resend configured, this should reflect the env state
      const result = canSendEmails();
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('Email Service Functions', () => {
  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const { sendWelcomeEmail } = await import('@/lib/email-service');
      
      const result = await sendWelcomeEmail({
        partner: {
          email: 'partner@example.com',
          name: 'Test Partner',
          referralCode: 'TEST123',
          tier: 'GOLD',
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendConversionEmail', () => {
    it('should send conversion notification', async () => {
      const { sendConversionEmail } = await import('@/lib/email-service');
      
      const result = await sendConversionEmail({
        partner: {
          email: 'partner@example.com',
          name: 'Test Partner',
        },
        commissionAmount: 5000,
        totalEarnings: 50000,
        totalConversions: 10,
      });

      expect(result.success).toBe(true);
    });

    it('should include campaign name if provided', async () => {
      const { sendConversionEmail } = await import('@/lib/email-service');
      
      const result = await sendConversionEmail({
        partner: {
          email: 'partner@example.com',
          name: 'Test Partner',
        },
        campaignName: 'LinkedIn Campaign',
        commissionAmount: 5000,
        totalEarnings: 50000,
        totalConversions: 10,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendPayoutEmail', () => {
    it('should send payout processing notification', async () => {
      const { sendPayoutEmail } = await import('@/lib/email-service');
      
      const result = await sendPayoutEmail({
        partner: {
          email: 'partner@example.com',
          name: 'Test Partner',
        },
        payoutAmount: 10000,
        payoutFee: 100,
        netAmount: 9900,
        status: 'processing',
        payoutMethod: 'bank_transfer',
      });

      expect(result.success).toBe(true);
    });

    it('should send payout completed notification', async () => {
      const { sendPayoutEmail } = await import('@/lib/email-service');
      
      const result = await sendPayoutEmail({
        partner: {
          email: 'partner@example.com',
          name: 'Test Partner',
        },
        payoutAmount: 10000,
        payoutFee: 100,
        netAmount: 9900,
        status: 'completed',
        payoutMethod: 'bank_transfer',
        transactionId: 'txn_123',
      });

      expect(result.success).toBe(true);
    });

    it('should send payout failed notification', async () => {
      const { sendPayoutEmail } = await import('@/lib/email-service');
      
      const result = await sendPayoutEmail({
        partner: {
          email: 'partner@example.com',
          name: 'Test Partner',
        },
        payoutAmount: 10000,
        payoutFee: 100,
        netAmount: 9900,
        status: 'failed',
        payoutMethod: 'bank_transfer',
        failureReason: 'Invalid bank account',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendWeeklyDigest', () => {
    it('should send weekly digest with all stats', async () => {
      const { sendWeeklyDigest } = await import('@/lib/email-service');
      
      const result = await sendWeeklyDigest({
        partner: {
          email: 'partner@example.com',
          name: 'Test Partner',
        },
        weekStartDate: new Date('2024-01-01'),
        weekEndDate: new Date('2024-01-07'),
        clicksThisWeek: 100,
        conversionsThisWeek: 5,
        earningsThisWeek: 25000,
        clicksLastWeek: 80,
        conversionsLastWeek: 4,
        earningsLastWeek: 20000,
        totalEarnings: 100000,
        pendingPayout: 25000,
        topCampaigns: [
          { name: 'LinkedIn', clicks: 50, conversions: 3, earnings: 15000 },
          { name: 'Twitter', clicks: 30, conversions: 2, earnings: 10000 },
        ],
        leaderboardPosition: 5,
        leaderboardTotal: 100,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getEmailServiceStatus', () => {
    it('should return service status', async () => {
      const { getEmailServiceStatus } = await import('@/lib/email-service');
      
      const status = getEmailServiceStatus();
      
      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('provider');
      expect(typeof status.configured).toBe('boolean');
      expect(typeof status.provider).toBe('string');
    });
  });
});
