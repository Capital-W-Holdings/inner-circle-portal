/**
 * Stripe Client Configuration
 * Handles Stripe API client initialization and configuration
 */

import Stripe from 'stripe';
import { logger } from './monitoring';

// ============================================
// Configuration
// ============================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Check if Stripe is configured
export const isStripeConfigured = Boolean(STRIPE_SECRET_KEY);
export const hasWebhookSecret = Boolean(STRIPE_WEBHOOK_SECRET);

// ============================================
// Stripe Client Singleton
// ============================================

let stripeClient: Stripe | null = null;

/**
 * Get the Stripe client instance
 */
export function getStripeClient(): Stripe | null {
  if (!STRIPE_SECRET_KEY) {
    return null;
  }
  
  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
      appInfo: {
        name: 'Inner Circle Partners Portal',
        version: '1.0.0',
      },
    });
  }
  
  return stripeClient;
}

/**
 * Get webhook secret for signature verification
 */
export function getWebhookSecret(): string | null {
  return STRIPE_WEBHOOK_SECRET || null;
}

// ============================================
// Stripe Connect Types
// ============================================

export interface ConnectAccountInfo {
  accountId: string;
  email: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingComplete: boolean;
  country: string;
  defaultCurrency: string;
  businessType?: string;
}

export interface PayoutResult {
  success: boolean;
  payoutId?: string;
  amount?: number;
  currency?: string;
  arrivalDate?: Date;
  error?: string;
}

export interface TransferResult {
  success: boolean;
  transferId?: string;
  amount?: number;
  error?: string;
}

// ============================================
// Connect Account Functions
// ============================================

/**
 * Create a Stripe Connect Express account for a partner
 */
export async function createConnectAccount(
  email: string,
  country: string = 'US',
  metadata?: Record<string, string>
): Promise<{ accountId: string; error?: string }> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    logger.info('[Stripe] Simulated account creation (Stripe not configured)', { email });
    return { accountId: `mock_acct_${Date.now()}` };
  }
  
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      country,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata,
    });
    
    logger.info('[Stripe] Connect account created', { accountId: account.id, email });
    
    return { accountId: account.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Stripe] Failed to create Connect account', error, { email });
    return { accountId: '', error: message };
  }
}

/**
 * Create an onboarding link for a Connect account
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<{ url: string; error?: string }> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    logger.info('[Stripe] Simulated account link (Stripe not configured)', { accountId });
    return { url: `${returnUrl}?mock=true` };
  }
  
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    
    logger.info('[Stripe] Account link created', { accountId });
    
    return { url: accountLink.url };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Stripe] Failed to create account link', error, { accountId });
    return { url: '', error: message };
  }
}

/**
 * Create a login link for the Stripe Express dashboard
 */
export async function createLoginLink(
  accountId: string
): Promise<{ url: string; error?: string }> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    logger.info('[Stripe] Simulated login link (Stripe not configured)', { accountId });
    return { url: 'https://dashboard.stripe.com/test/express' };
  }
  
  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    
    return { url: loginLink.url };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Stripe] Failed to create login link', error, { accountId });
    return { url: '', error: message };
  }
}

/**
 * Get Connect account details
 */
export async function getConnectAccount(
  accountId: string
): Promise<{ account: ConnectAccountInfo | null; error?: string }> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    // Return mock account info
    return {
      account: {
        accountId,
        email: 'mock@example.com',
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        onboardingComplete: true,
        country: 'US',
        defaultCurrency: 'usd',
      },
    };
  }
  
  try {
    const account = await stripe.accounts.retrieve(accountId);
    
    return {
      account: {
        accountId: account.id,
        email: account.email || '',
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        onboardingComplete: account.details_submitted && account.payouts_enabled,
        country: account.country || 'US',
        defaultCurrency: account.default_currency || 'usd',
        businessType: account.business_type || undefined,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Stripe] Failed to retrieve account', error, { accountId });
    return { account: null, error: message };
  }
}

// ============================================
// Transfer & Payout Functions
// ============================================

/**
 * Transfer funds to a Connect account
 */
export async function createTransfer(
  accountId: string,
  amountCents: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<TransferResult> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    logger.info('[Stripe] Simulated transfer (Stripe not configured)', {
      accountId,
      amount: amountCents,
    });
    return {
      success: true,
      transferId: `mock_tr_${Date.now()}`,
      amount: amountCents,
    };
  }
  
  try {
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency,
      destination: accountId,
      metadata,
    });
    
    logger.info('[Stripe] Transfer created', {
      transferId: transfer.id,
      accountId,
      amount: amountCents,
    });
    
    return {
      success: true,
      transferId: transfer.id,
      amount: transfer.amount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Stripe] Transfer failed', error, { accountId, amount: amountCents });
    return { success: false, error: message };
  }
}

/**
 * Create a payout to a Connect account's bank
 */
export async function createPayout(
  accountId: string,
  amountCents: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<PayoutResult> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    logger.info('[Stripe] Simulated payout (Stripe not configured)', {
      accountId,
      amount: amountCents,
    });
    
    // Simulate 2-day payout
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 2);
    
    return {
      success: true,
      payoutId: `mock_po_${Date.now()}`,
      amount: amountCents,
      currency,
      arrivalDate,
    };
  }
  
  try {
    // Create payout on behalf of the connected account
    const payout = await stripe.payouts.create(
      {
        amount: amountCents,
        currency,
        metadata,
      },
      {
        stripeAccount: accountId,
      }
    );
    
    logger.info('[Stripe] Payout created', {
      payoutId: payout.id,
      accountId,
      amount: amountCents,
    });
    
    return {
      success: true,
      payoutId: payout.id,
      amount: payout.amount,
      currency: payout.currency,
      arrivalDate: payout.arrival_date ? new Date(payout.arrival_date * 1000) : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Stripe] Payout failed', error, { accountId, amount: amountCents });
    return { success: false, error: message };
  }
}

/**
 * Get payout details
 */
export async function getPayout(
  payoutId: string,
  accountId?: string
): Promise<{ payout: Stripe.Payout | null; error?: string }> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    // Return mock payout
    return {
      payout: {
        id: payoutId,
        object: 'payout',
        amount: 10000,
        currency: 'usd',
        status: 'paid',
        arrival_date: Math.floor(Date.now() / 1000),
      } as Stripe.Payout,
    };
  }
  
  try {
    const payout = await stripe.payouts.retrieve(
      payoutId,
      accountId ? { stripeAccount: accountId } : undefined
    );
    
    return { payout };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Stripe] Failed to retrieve payout', error, { payoutId });
    return { payout: null, error: message };
  }
}

// ============================================
// Balance Functions
// ============================================

/**
 * Get platform balance
 */
export async function getPlatformBalance(): Promise<{
  available: number;
  pending: number;
  currency: string;
  error?: string;
}> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    return {
      available: 100000,
      pending: 25000,
      currency: 'usd',
    };
  }
  
  try {
    const balance = await stripe.balance.retrieve();
    
    // Get USD balance (or first available)
    const usdAvailable = balance.available.find(b => b.currency === 'usd');
    const usdPending = balance.pending.find(b => b.currency === 'usd');
    
    return {
      available: usdAvailable?.amount || 0,
      pending: usdPending?.amount || 0,
      currency: 'usd',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Stripe] Failed to retrieve balance', error);
    return { available: 0, pending: 0, currency: 'usd', error: message };
  }
}

/**
 * Get Connect account balance
 */
export async function getAccountBalance(accountId: string): Promise<{
  available: number;
  pending: number;
  currency: string;
  error?: string;
}> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    return {
      available: 50000,
      pending: 10000,
      currency: 'usd',
    };
  }
  
  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });
    
    const usdAvailable = balance.available.find(b => b.currency === 'usd');
    const usdPending = balance.pending.find(b => b.currency === 'usd');
    
    return {
      available: usdAvailable?.amount || 0,
      pending: usdPending?.amount || 0,
      currency: 'usd',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Stripe] Failed to retrieve account balance', error, { accountId });
    return { available: 0, pending: 0, currency: 'usd', error: message };
  }
}

// ============================================
// Webhook Signature Verification
// ============================================

/**
 * Verify webhook signature and construct event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  const stripe = getStripeClient();
  const secret = getWebhookSecret();
  
  if (!stripe || !secret) {
    logger.warn('[Stripe] Cannot verify webhook - Stripe or secret not configured');
    return null;
  }
  
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    logger.error('[Stripe] Webhook signature verification failed', error);
    return null;
  }
}

// ============================================
// Health Check
// ============================================

export async function checkStripeHealth(): Promise<{
  configured: boolean;
  operational: boolean;
  error?: string;
}> {
  if (!isStripeConfigured) {
    return {
      configured: false,
      operational: false,
      error: 'Stripe secret key not configured',
    };
  }
  
  try {
    // Simple API call to verify connectivity
    await getPlatformBalance();
    
    return {
      configured: true,
      operational: true,
    };
  } catch (error) {
    return {
      configured: true,
      operational: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
