/**
 * Stripe Webhook Handler
 * POST /api/payments/webhook
 * 
 * Handles Stripe webhook events for payouts, transfers, and account updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  constructWebhookEvent,
  hasWebhookSecret,
} from '@/lib/stripe';
import { completePayout, failPayout } from '@/lib/payment-service';
import { logger } from '@/lib/monitoring';

// ============================================
// Disable body parsing for webhook signature verification
// ============================================

export const runtime = 'nodejs';

// ============================================
// POST - Webhook Handler
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if webhook secret is configured
    if (!hasWebhookSecret) {
      logger.warn('[StripeWebhook] Webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 400 }
      );
    }
    
    // Get signature from headers
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');
    
    if (!signature) {
      logger.warn('[StripeWebhook] Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }
    
    // Get raw body for signature verification
    const body = await request.text();
    
    // Verify and construct event
    const event = constructWebhookEvent(body, signature);
    
    if (!event) {
      logger.warn('[StripeWebhook] Signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    logger.info('[StripeWebhook] Event received', {
      type: event.type,
      id: event.id,
    });
    
    // Handle different event types
    switch (event.type) {
      // ============================================
      // Payout Events
      // ============================================
      
      case 'payout.paid': {
        const payout = event.data.object;
        const payoutId = payout.metadata?.internalPayoutId;
        
        if (payoutId) {
          await completePayout(payoutId, payout.id);
          logger.info('[StripeWebhook] Payout completed', {
            payoutId,
            stripePayoutId: payout.id,
          });
        }
        break;
      }
      
      case 'payout.failed': {
        const payout = event.data.object;
        const payoutId = payout.metadata?.internalPayoutId;
        const failureMessage = payout.failure_message || 'Payout failed';
        
        if (payoutId) {
          await failPayout(payoutId, failureMessage);
          logger.warn('[StripeWebhook] Payout failed', {
            payoutId,
            stripePayoutId: payout.id,
            reason: failureMessage,
          });
        }
        break;
      }
      
      case 'payout.canceled': {
        const payout = event.data.object;
        const payoutId = payout.metadata?.internalPayoutId;
        
        if (payoutId) {
          await failPayout(payoutId, 'Payout was canceled');
          logger.warn('[StripeWebhook] Payout canceled', {
            payoutId,
            stripePayoutId: payout.id,
          });
        }
        break;
      }
      
      // ============================================
      // Transfer Events
      // ============================================
      
      case 'transfer.created': {
        const transfer = event.data.object;
        logger.info('[StripeWebhook] Transfer created', {
          transferId: transfer.id,
          amount: transfer.amount,
          destination: transfer.destination,
        });
        break;
      }
      
      case 'transfer.reversed': {
        const transfer = event.data.object;
        logger.warn('[StripeWebhook] Transfer reversed', {
          transferId: transfer.id,
          amount: transfer.amount,
        });
        // Handle reversal - may need to update internal records
        break;
      }
      
      // ============================================
      // Account Events
      // ============================================
      
      case 'account.updated': {
        const account = event.data.object;
        logger.info('[StripeWebhook] Account updated', {
          accountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        });
        
        // Could update partner record with onboarding status
        // In production, you'd look up the partner by stripeAccountId
        break;
      }
      
      case 'account.application.deauthorized': {
        const account = event.data.object;
        logger.warn('[StripeWebhook] Account deauthorized', {
          accountId: account.id,
        });
        // Handle deauthorization - disable payouts for partner
        break;
      }
      
      // ============================================
      // Balance Events
      // ============================================
      
      case 'balance.available': {
        logger.info('[StripeWebhook] Balance available', {
          balance: event.data.object,
        });
        break;
      }
      
      // ============================================
      // Unhandled Events
      // ============================================
      
      default: {
        logger.debug('[StripeWebhook] Unhandled event type', {
          type: event.type,
        });
      }
    }
    
    // Return success
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logger.error('[StripeWebhook] Handler error', error);
    
    // Return 200 to prevent Stripe from retrying
    // Log the error but don't fail the webhook
    return NextResponse.json(
      { error: 'Webhook handler error', received: true },
      { status: 200 }
    );
  }
}
