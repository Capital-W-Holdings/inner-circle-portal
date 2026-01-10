/**
 * Payment Service
 * High-level payment operations for partner payouts
 */

import {
  isStripeConfigured,
  createConnectAccount,
  createAccountLink,
  createLoginLink,
  getConnectAccount,
  getAccountBalance,
} from './stripe';
import { getPartnerRepository, getPayoutRepository } from './repositories';
import { sendPayoutEmail } from './email-service';
import { logger } from './monitoring';
import type { Payout, PayoutStatus } from './db';

// ============================================
// Configuration
// ============================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://innercircle.co';

// Platform fee percentage (1%)
const PLATFORM_FEE_RATE = 0.01;

// Minimum payout amount in cents ($10)
const MIN_PAYOUT_AMOUNT = 1000;

// ============================================
// Types
// ============================================

export interface PayoutRequest {
  partnerId: string;
  amountCents: number;
  method?: 'stripe' | 'manual';
}

export interface PayoutResponse {
  success: boolean;
  payout?: {
    id: string;
    amountCents: number;
    feeCents: number;
    netCents: number;
    status: PayoutStatus;
    estimatedArrival?: Date;
  };
  error?: string;
  errorCode?: string;
}

export interface OnboardingResult {
  success: boolean;
  onboardingUrl?: string;
  error?: string;
}

export interface PartnerPaymentStatus {
  hasStripeAccount: boolean;
  stripeAccountId?: string;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
  availableBalance: number;
  pendingBalance: number;
  canRequestPayout: boolean;
  minPayoutAmount: number;
}

// ============================================
// Connect Account Management
// ============================================

/**
 * Set up a Stripe Connect account for a partner
 */
export async function setupPartnerPayments(
  partnerId: string
): Promise<OnboardingResult> {
  const partnerRepo = getPartnerRepository();
  const partner = await partnerRepo.findById(partnerId);
  
  if (!partner) {
    return { success: false, error: 'Partner not found' };
  }
  
  // Check if partner already has a Stripe account
  // In a real implementation, you'd store stripeAccountId on the Partner model
  // For now, we'll create a new one each time
  
  const { accountId, error: createError } = await createConnectAccount(
    partner.email,
    'US',
    {
      partnerId: partner.id,
      partnerName: partner.name,
      referralCode: partner.referralCode,
    }
  );
  
  if (createError || !accountId) {
    logger.error('[PaymentService] Failed to create Connect account', null, {
      partnerId,
      error: createError,
    });
    return { success: false, error: createError || 'Failed to create payment account' };
  }
  
  // Create onboarding link
  const refreshUrl = `${APP_URL}/dashboard/settings?tab=payments&refresh=true`;
  const returnUrl = `${APP_URL}/dashboard/settings?tab=payments&success=true`;
  
  const { url, error: linkError } = await createAccountLink(
    accountId,
    refreshUrl,
    returnUrl
  );
  
  if (linkError || !url) {
    logger.error('[PaymentService] Failed to create onboarding link', null, {
      partnerId,
      accountId,
      error: linkError,
    });
    return { success: false, error: linkError || 'Failed to create onboarding link' };
  }
  
  logger.info('[PaymentService] Partner payment setup initiated', {
    partnerId,
    accountId,
  });
  
  return { success: true, onboardingUrl: url };
}

/**
 * Get partner payment status
 */
export async function getPartnerPaymentStatus(
  partnerId: string,
  stripeAccountId?: string
): Promise<PartnerPaymentStatus> {
  // Default status when no Stripe account
  if (!stripeAccountId) {
    return {
      hasStripeAccount: false,
      onboardingComplete: false,
      payoutsEnabled: false,
      availableBalance: 0,
      pendingBalance: 0,
      canRequestPayout: false,
      minPayoutAmount: MIN_PAYOUT_AMOUNT,
    };
  }
  
  const { account, error } = await getConnectAccount(stripeAccountId);
  
  if (error || !account) {
    logger.warn('[PaymentService] Failed to get account status', {
      partnerId,
      stripeAccountId,
      error,
    });
    
    return {
      hasStripeAccount: true,
      stripeAccountId,
      onboardingComplete: false,
      payoutsEnabled: false,
      availableBalance: 0,
      pendingBalance: 0,
      canRequestPayout: false,
      minPayoutAmount: MIN_PAYOUT_AMOUNT,
    };
  }
  
  // Get account balance
  const balance = await getAccountBalance(stripeAccountId);
  
  return {
    hasStripeAccount: true,
    stripeAccountId,
    onboardingComplete: account.onboardingComplete,
    payoutsEnabled: account.payoutsEnabled,
    availableBalance: balance.available,
    pendingBalance: balance.pending,
    canRequestPayout: account.payoutsEnabled && balance.available >= MIN_PAYOUT_AMOUNT,
    minPayoutAmount: MIN_PAYOUT_AMOUNT,
  };
}

/**
 * Get Stripe Express dashboard link for partner
 */
export async function getPartnerDashboardLink(
  stripeAccountId: string
): Promise<{ url: string; error?: string }> {
  return createLoginLink(stripeAccountId);
}

// ============================================
// Payout Processing
// ============================================

/**
 * Calculate payout fees
 */
export function calculatePayoutFees(amountCents: number): {
  grossAmount: number;
  platformFee: number;
  stripeFee: number;
  netAmount: number;
} {
  // Platform fee (1%)
  const platformFee = Math.round(amountCents * PLATFORM_FEE_RATE);
  
  // Stripe fee ($0.25 per payout to bank)
  const stripeFee = 25;
  
  const totalFees = platformFee + stripeFee;
  const netAmount = amountCents - totalFees;
  
  return {
    grossAmount: amountCents,
    platformFee,
    stripeFee,
    netAmount,
  };
}

/**
 * Request a payout for a partner
 */
export async function requestPayout(
  request: PayoutRequest
): Promise<PayoutResponse> {
  const { partnerId, amountCents, method = 'stripe' } = request;
  
  // Validate amount
  if (amountCents < MIN_PAYOUT_AMOUNT) {
    return {
      success: false,
      error: `Minimum payout amount is $${(MIN_PAYOUT_AMOUNT / 100).toFixed(2)}`,
      errorCode: 'BELOW_MINIMUM',
    };
  }
  
  const partnerRepo = getPartnerRepository();
  const payoutRepo = getPayoutRepository();
  
  // Get partner
  const partner = await partnerRepo.findById(partnerId);
  if (!partner) {
    return { success: false, error: 'Partner not found', errorCode: 'PARTNER_NOT_FOUND' };
  }
  
  // Calculate fees
  const fees = calculatePayoutFees(amountCents);
  
  // Create payout record
  const payoutRecord = await payoutRepo.create({
    partnerId,
    status: 'PENDING',
    amountCents: fees.grossAmount,
    feeCents: fees.platformFee + fees.stripeFee,
    netCents: fees.netAmount,
    paymentMethod: method,
    transactionId: null,
    processedAt: null,
    completedAt: null,
  });
  
  logger.info('[PaymentService] Payout requested', {
    payoutId: payoutRecord.id,
    partnerId,
    amount: amountCents,
  });
  
  // If using manual method, just return the pending payout
  if (method === 'manual') {
    return {
      success: true,
      payout: {
        id: payoutRecord.id,
        amountCents: fees.grossAmount,
        feeCents: fees.platformFee + fees.stripeFee,
        netCents: fees.netAmount,
        status: 'PENDING',
      },
    };
  }
  
  // For Stripe, we'd process the actual payout here
  // In a real implementation, you'd have the stripeAccountId stored
  // For demo purposes, we'll simulate success
  
  if (!isStripeConfigured) {
    // Simulate processing delay
    await payoutRepo.update(payoutRecord.id, {
      status: 'PROCESSING',
      processedAt: new Date(),
      transactionId: `mock_po_${Date.now()}`,
    });
    
    // Send notification email
    await sendPayoutEmail({
      partner,
      payoutAmount: fees.grossAmount,
      payoutFee: fees.platformFee + fees.stripeFee,
      netAmount: fees.netAmount,
      status: 'processing',
      payoutMethod: 'Bank Transfer',
      estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    });
    
    return {
      success: true,
      payout: {
        id: payoutRecord.id,
        amountCents: fees.grossAmount,
        feeCents: fees.platformFee + fees.stripeFee,
        netCents: fees.netAmount,
        status: 'PROCESSING',
        estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    };
  }
  
  // With Stripe configured, we'd process the actual payout
  // This would involve:
  // 1. Creating a transfer to the Connect account
  // 2. Triggering a payout from the Connect account to their bank
  
  // For now, return success with processing status
  await payoutRepo.update(payoutRecord.id, {
    status: 'PROCESSING',
    processedAt: new Date(),
  });
  
  return {
    success: true,
    payout: {
      id: payoutRecord.id,
      amountCents: fees.grossAmount,
      feeCents: fees.platformFee + fees.stripeFee,
      netCents: fees.netAmount,
      status: 'PROCESSING',
    },
  };
}

/**
 * Complete a payout (called from webhook or manual process)
 */
export async function completePayout(
  payoutId: string,
  transactionId: string
): Promise<{ success: boolean; error?: string }> {
  const payoutRepo = getPayoutRepository();
  const partnerRepo = getPartnerRepository();
  
  const payout = await payoutRepo.findById(payoutId);
  if (!payout) {
    return { success: false, error: 'Payout not found' };
  }
  
  if (payout.status !== 'PROCESSING') {
    return { success: false, error: `Cannot complete payout with status: ${payout.status}` };
  }
  
  // Update payout status
  await payoutRepo.update(payoutId, {
    status: 'COMPLETED',
    transactionId,
    completedAt: new Date(),
  });
  
  // Get partner for notification
  const partner = await partnerRepo.findById(payout.partnerId);
  
  if (partner) {
    // Send completion email
    await sendPayoutEmail({
      partner,
      payoutAmount: payout.amountCents,
      payoutFee: payout.feeCents,
      netAmount: payout.netCents,
      status: 'completed',
      payoutMethod: payout.paymentMethod || 'Bank Transfer',
      transactionId,
    });
  }
  
  logger.info('[PaymentService] Payout completed', {
    payoutId,
    transactionId,
    partnerId: payout.partnerId,
  });
  
  return { success: true };
}

/**
 * Fail a payout (called from webhook or manual process)
 */
export async function failPayout(
  payoutId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const payoutRepo = getPayoutRepository();
  const partnerRepo = getPartnerRepository();
  
  const payout = await payoutRepo.findById(payoutId);
  if (!payout) {
    return { success: false, error: 'Payout not found' };
  }
  
  // Update payout status
  await payoutRepo.update(payoutId, {
    status: 'FAILED',
  });
  
  // Get partner for notification
  const partner = await partnerRepo.findById(payout.partnerId);
  
  if (partner) {
    // Send failure email
    await sendPayoutEmail({
      partner,
      payoutAmount: payout.amountCents,
      payoutFee: payout.feeCents,
      netAmount: payout.netCents,
      status: 'failed',
      payoutMethod: payout.paymentMethod || 'Bank Transfer',
      failureReason: reason,
    });
  }
  
  logger.warn('[PaymentService] Payout failed', {
    payoutId,
    reason,
    partnerId: payout.partnerId,
  });
  
  return { success: true };
}

// ============================================
// Payout History
// ============================================

/**
 * Get partner payout history
 */
export async function getPartnerPayouts(
  partnerId: string,
  options?: {
    status?: PayoutStatus;
    limit?: number;
    offset?: number;
  }
): Promise<Payout[]> {
  const payoutRepo = getPayoutRepository();
  return payoutRepo.findByPartnerId(partnerId, options);
}

/**
 * Get payout statistics for a partner
 */
export async function getPartnerPayoutStats(partnerId: string): Promise<{
  totalPaid: number;
  totalPending: number;
  totalProcessing: number;
  payoutCount: number;
  lastPayoutDate?: Date;
}> {
  const payoutRepo = getPayoutRepository();
  const payouts = await payoutRepo.findByPartnerId(partnerId, { limit: 100 });
  
  let totalPaid = 0;
  let totalPending = 0;
  let totalProcessing = 0;
  let lastPayoutDate: Date | undefined;
  
  for (const payout of payouts) {
    switch (payout.status) {
      case 'COMPLETED':
        totalPaid += payout.netCents;
        if (!lastPayoutDate || payout.completedAt && payout.completedAt > lastPayoutDate) {
          lastPayoutDate = payout.completedAt ?? undefined;
        }
        break;
      case 'PENDING':
        totalPending += payout.netCents;
        break;
      case 'PROCESSING':
        totalProcessing += payout.netCents;
        break;
    }
  }
  
  return {
    totalPaid,
    totalPending,
    totalProcessing,
    payoutCount: payouts.filter(p => p.status === 'COMPLETED').length,
    lastPayoutDate,
  };
}

// ============================================
// Service Status
// ============================================

export function getPaymentServiceStatus(): {
  configured: boolean;
  provider: string;
  features: {
    connectAccounts: boolean;
    instantPayouts: boolean;
    manualPayouts: boolean;
  };
} {
  return {
    configured: isStripeConfigured,
    provider: isStripeConfigured ? 'Stripe Connect' : 'None (mock mode)',
    features: {
      connectAccounts: isStripeConfigured,
      instantPayouts: false, // Would require Stripe Treasury or Instant Payouts
      manualPayouts: true,
    },
  };
}
