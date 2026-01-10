/**
 * Payment Service Tests
 * Tests for Stripe Connect integration and payout processing
 */

import { describe, it, expect, vi } from 'vitest';
import {
  calculatePayoutFees,
  getPaymentServiceStatus,
} from '@/lib/payment-service';

// Mock Stripe
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    accounts: {
      create: vi.fn().mockResolvedValue({ id: 'mock_acct_123' }),
      retrieve: vi.fn().mockResolvedValue({
        id: 'mock_acct_123',
        email: 'test@example.com',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        country: 'US',
        default_currency: 'usd',
      }),
      createLoginLink: vi.fn().mockResolvedValue({ url: 'https://dashboard.stripe.com/login' }),
    },
    accountLinks: {
      create: vi.fn().mockResolvedValue({ url: 'https://connect.stripe.com/onboarding' }),
    },
    balance: {
      retrieve: vi.fn().mockResolvedValue({
        available: [{ amount: 10000, currency: 'usd' }],
        pending: [{ amount: 5000, currency: 'usd' }],
      }),
    },
    transfers: {
      create: vi.fn().mockResolvedValue({ id: 'tr_123', amount: 10000 }),
    },
    payouts: {
      create: vi.fn().mockResolvedValue({ 
        id: 'po_123', 
        amount: 10000, 
        currency: 'usd',
        arrival_date: Math.floor(Date.now() / 1000) + 86400,
      }),
      retrieve: vi.fn().mockResolvedValue({ id: 'po_123', status: 'paid' }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));

describe('Payout Fee Calculation', () => {
  it('should calculate fees correctly', () => {
    const fees = calculatePayoutFees(10000); // $100
    
    expect(fees.grossAmount).toBe(10000);
    expect(fees.platformFee).toBe(100); // 1%
    expect(fees.stripeFee).toBe(25); // $0.25
    expect(fees.netAmount).toBe(9875); // $100 - $1 - $0.25
  });

  it('should calculate fees for small amounts', () => {
    const fees = calculatePayoutFees(1000); // $10
    
    expect(fees.grossAmount).toBe(1000);
    expect(fees.platformFee).toBe(10); // 1%
    expect(fees.stripeFee).toBe(25);
    expect(fees.netAmount).toBe(965); // $10 - $0.10 - $0.25
  });

  it('should calculate fees for large amounts', () => {
    const fees = calculatePayoutFees(1000000); // $10,000
    
    expect(fees.grossAmount).toBe(1000000);
    expect(fees.platformFee).toBe(10000); // 1%
    expect(fees.stripeFee).toBe(25);
    expect(fees.netAmount).toBe(989975);
  });

  it('should round platform fee correctly', () => {
    const fees = calculatePayoutFees(333); // $3.33
    
    // 1% of 333 = 3.33, rounded to 3
    expect(fees.platformFee).toBe(3);
    expect(fees.netAmount).toBe(305); // 333 - 3 - 25
  });
});

describe('Payment Service Status', () => {
  it('should return service status', () => {
    const status = getPaymentServiceStatus();
    
    expect(status).toHaveProperty('configured');
    expect(status).toHaveProperty('provider');
    expect(status).toHaveProperty('features');
    expect(status.features).toHaveProperty('connectAccounts');
    expect(status.features).toHaveProperty('instantPayouts');
    expect(status.features).toHaveProperty('manualPayouts');
  });

  it('should report manual payouts as always available', () => {
    const status = getPaymentServiceStatus();
    expect(status.features.manualPayouts).toBe(true);
  });
});

describe('Stripe Client', () => {
  it('should return mock values when not configured', async () => {
    const { isStripeConfigured } = await import('@/lib/stripe');
    
    // Without env vars, should not be configured
    expect(typeof isStripeConfigured).toBe('boolean');
  });

  it('should check stripe health', async () => {
    const { checkStripeHealth } = await import('@/lib/stripe');
    
    const result = await checkStripeHealth();
    
    expect(result).toHaveProperty('configured');
    expect(result).toHaveProperty('operational');
  });
});

describe('Connect Account Functions', () => {
  it('should simulate account creation when not configured', async () => {
    const { createConnectAccount } = await import('@/lib/stripe');
    
    const result = await createConnectAccount('test@example.com', 'US');
    
    expect(result.accountId).toBeTruthy();
    expect(result.accountId).toMatch(/^mock_acct_/);
  });

  it('should simulate account link creation when not configured', async () => {
    const { createAccountLink } = await import('@/lib/stripe');
    
    const result = await createAccountLink(
      'mock_acct_123',
      'https://example.com/refresh',
      'https://example.com/return'
    );
    
    expect(result.url).toBeTruthy();
    expect(result.url).toContain('return');
  });

  it('should simulate login link creation when not configured', async () => {
    const { createLoginLink } = await import('@/lib/stripe');
    
    const result = await createLoginLink('mock_acct_123');
    
    expect(result.url).toBeTruthy();
  });

  it('should return mock account info when not configured', async () => {
    const { getConnectAccount } = await import('@/lib/stripe');
    
    const result = await getConnectAccount('mock_acct_123');
    
    expect(result.account).toBeTruthy();
    expect(result.account?.accountId).toBe('mock_acct_123');
    expect(result.account?.onboardingComplete).toBe(true);
    expect(result.account?.payoutsEnabled).toBe(true);
  });
});

describe('Balance Functions', () => {
  it('should return mock platform balance when not configured', async () => {
    const { getPlatformBalance } = await import('@/lib/stripe');
    
    const result = await getPlatformBalance();
    
    expect(result.available).toBeGreaterThanOrEqual(0);
    expect(result.pending).toBeGreaterThanOrEqual(0);
    expect(result.currency).toBe('usd');
  });

  it('should return mock account balance when not configured', async () => {
    const { getAccountBalance } = await import('@/lib/stripe');
    
    const result = await getAccountBalance('mock_acct_123');
    
    expect(result.available).toBeGreaterThanOrEqual(0);
    expect(result.pending).toBeGreaterThanOrEqual(0);
    expect(result.currency).toBe('usd');
  });
});

describe('Transfer & Payout Functions', () => {
  it('should simulate transfer creation when not configured', async () => {
    const { createTransfer } = await import('@/lib/stripe');
    
    const result = await createTransfer('mock_acct_123', 10000);
    
    expect(result.success).toBe(true);
    expect(result.transferId).toBeTruthy();
    expect(result.amount).toBe(10000);
  });

  it('should simulate payout creation when not configured', async () => {
    const { createPayout } = await import('@/lib/stripe');
    
    const result = await createPayout('mock_acct_123', 10000);
    
    expect(result.success).toBe(true);
    expect(result.payoutId).toBeTruthy();
    expect(result.amount).toBe(10000);
    expect(result.arrivalDate).toBeInstanceOf(Date);
  });
});

describe('Payment Request Validation', () => {
  it('should validate minimum payout amount', async () => {
    const { requestPayout } = await import('@/lib/payment-service');
    
    // $5 is below minimum of $10
    const result = await requestPayout({
      partnerId: 'partner-demo-123',
      amountCents: 500,
    });
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('BELOW_MINIMUM');
  });

  it('should reject payout for non-existent partner', async () => {
    const { requestPayout } = await import('@/lib/payment-service');
    
    const result = await requestPayout({
      partnerId: 'non-existent-partner',
      amountCents: 10000,
    });
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('PARTNER_NOT_FOUND');
  });

  it('should accept valid payout request', async () => {
    const { requestPayout } = await import('@/lib/payment-service');
    
    const result = await requestPayout({
      partnerId: 'partner-demo-123',
      amountCents: 10000,
    });
    
    expect(result.success).toBe(true);
    expect(result.payout).toBeTruthy();
    expect(result.payout?.status).toBe('PROCESSING');
  });
});

describe('Payout Statistics', () => {
  it('should return payout stats for partner', async () => {
    const { getPartnerPayoutStats } = await import('@/lib/payment-service');
    
    const stats = await getPartnerPayoutStats('partner-demo-123');
    
    expect(stats).toHaveProperty('totalPaid');
    expect(stats).toHaveProperty('totalPending');
    expect(stats).toHaveProperty('totalProcessing');
    expect(stats).toHaveProperty('payoutCount');
    expect(typeof stats.totalPaid).toBe('number');
  });
});
