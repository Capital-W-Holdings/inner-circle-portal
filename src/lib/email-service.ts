/**
 * Email Service
 * High-level email sending functions using React Email templates
 */

import { sendEmail, sendBulkEmails, isEmailConfigured, type EmailResult } from './email';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { ConversionEmail } from '@/emails/ConversionEmail';
import { PayoutEmail } from '@/emails/PayoutEmail';
import { WeeklyDigestEmail } from '@/emails/WeeklyDigestEmail';
import { logger } from './monitoring';
import type { Partner, PartnerTier } from './db';

// ============================================
// Configuration
// ============================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://innercircle.co';

// Commission rates by tier
const COMMISSION_RATES: Record<PartnerTier, number> = {
  STANDARD: 15,
  SILVER: 18,
  GOLD: 22,
  PLATINUM: 25,
};

// ============================================
// Welcome Email
// ============================================

export interface SendWelcomeEmailParams {
  partner: Pick<Partner, 'email' | 'name' | 'referralCode' | 'tier'>;
}

export async function sendWelcomeEmail({
  partner,
}: SendWelcomeEmailParams): Promise<EmailResult> {
  const commissionRate = COMMISSION_RATES[partner.tier];
  const referralLink = `${APP_URL}/r/${partner.referralCode}`;
  
  logger.info('[EmailService] Sending welcome email', {
    partnerId: partner.email,
    tier: partner.tier,
  });
  
  return sendEmail({
    to: { email: partner.email, name: partner.name },
    subject: `Welcome to Inner Circle, ${partner.name}! 🎉`,
    react: WelcomeEmail({
      partnerName: partner.name,
      referralCode: partner.referralCode,
      referralLink,
      tier: partner.tier,
      commissionRate,
    }),
    tags: [
      { name: 'category', value: 'welcome' },
      { name: 'tier', value: partner.tier },
    ],
  });
}

// ============================================
// Conversion Notification Email
// ============================================

export interface SendConversionEmailParams {
  partner: Pick<Partner, 'email' | 'name'>;
  campaignName?: string;
  commissionAmount: number; // in cents
  totalEarnings: number; // in cents
  totalConversions: number;
}

export async function sendConversionEmail({
  partner,
  campaignName,
  commissionAmount,
  totalEarnings,
  totalConversions,
}: SendConversionEmailParams): Promise<EmailResult> {
  logger.info('[EmailService] Sending conversion notification', {
    partnerId: partner.email,
    amount: commissionAmount,
  });
  
  return sendEmail({
    to: { email: partner.email, name: partner.name },
    subject: `🎉 You earned $${(commissionAmount / 100).toFixed(2)} from a new conversion!`,
    react: ConversionEmail({
      partnerName: partner.name,
      campaignName,
      commissionAmount,
      totalEarnings,
      totalConversions,
      referralDate: new Date(),
    }),
    tags: [
      { name: 'category', value: 'conversion' },
    ],
  });
}

// ============================================
// Payout Notification Email
// ============================================

export interface SendPayoutEmailParams {
  partner: Pick<Partner, 'email' | 'name'>;
  payoutAmount: number; // in cents
  payoutFee: number; // in cents
  netAmount: number; // in cents
  status: 'processing' | 'completed' | 'failed';
  payoutMethod: string;
  transactionId?: string;
  estimatedArrival?: Date;
  failureReason?: string;
}

export async function sendPayoutEmail({
  partner,
  payoutAmount,
  payoutFee,
  netAmount,
  status,
  payoutMethod,
  transactionId,
  estimatedArrival,
  failureReason,
}: SendPayoutEmailParams): Promise<EmailResult> {
  const subjectMap = {
    processing: `💸 Your payout of $${(netAmount / 100).toFixed(2)} is being processed`,
    completed: `✅ Payout complete: $${(netAmount / 100).toFixed(2)} sent to your account`,
    failed: `❌ Payout of $${(netAmount / 100).toFixed(2)} failed - action required`,
  };
  
  logger.info('[EmailService] Sending payout notification', {
    partnerId: partner.email,
    status,
    amount: netAmount,
  });
  
  return sendEmail({
    to: { email: partner.email, name: partner.name },
    subject: subjectMap[status],
    react: PayoutEmail({
      partnerName: partner.name,
      payoutAmount,
      payoutFee,
      netAmount,
      status,
      payoutMethod,
      transactionId,
      estimatedArrival,
      failureReason,
    }),
    tags: [
      { name: 'category', value: 'payout' },
      { name: 'status', value: status },
    ],
  });
}

// ============================================
// Weekly Digest Email
// ============================================

export interface CampaignStats {
  name: string;
  clicks: number;
  conversions: number;
  earnings: number;
}

export interface SendWeeklyDigestParams {
  partner: Pick<Partner, 'email' | 'name'>;
  weekStartDate: Date;
  weekEndDate: Date;
  clicksThisWeek: number;
  conversionsThisWeek: number;
  earningsThisWeek: number;
  clicksLastWeek: number;
  conversionsLastWeek: number;
  earningsLastWeek: number;
  totalEarnings: number;
  pendingPayout: number;
  topCampaigns: CampaignStats[];
  leaderboardPosition?: number;
  leaderboardTotal?: number;
}

export async function sendWeeklyDigest({
  partner,
  weekStartDate,
  weekEndDate,
  clicksThisWeek,
  conversionsThisWeek,
  earningsThisWeek,
  clicksLastWeek,
  conversionsLastWeek,
  earningsLastWeek,
  totalEarnings,
  pendingPayout,
  topCampaigns,
  leaderboardPosition,
  leaderboardTotal,
}: SendWeeklyDigestParams): Promise<EmailResult> {
  const earnedStr = `$${(earningsThisWeek / 100).toFixed(2)}`;
  
  logger.info('[EmailService] Sending weekly digest', {
    partnerId: partner.email,
    earnings: earningsThisWeek,
    conversions: conversionsThisWeek,
  });
  
  return sendEmail({
    to: { email: partner.email, name: partner.name },
    subject: `📊 Your week: ${earnedStr} earned, ${conversionsThisWeek} conversions`,
    react: WeeklyDigestEmail({
      partnerName: partner.name,
      weekStartDate,
      weekEndDate,
      clicksThisWeek,
      conversionsThisWeek,
      earningsThisWeek,
      clicksLastWeek,
      conversionsLastWeek,
      earningsLastWeek,
      totalEarnings,
      pendingPayout,
      topCampaigns,
      leaderboardPosition,
      leaderboardTotal,
    }),
    tags: [
      { name: 'category', value: 'digest' },
      { name: 'type', value: 'weekly' },
    ],
  });
}

// ============================================
// Bulk Digest Sending
// ============================================

export interface BulkDigestRecipient extends SendWeeklyDigestParams {}

export async function sendBulkWeeklyDigests(
  recipients: BulkDigestRecipient[]
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}> {
  logger.info('[EmailService] Starting bulk digest send', {
    recipientCount: recipients.length,
  });
  
  const emails = recipients.map(recipient => ({
    to: { email: recipient.partner.email, name: recipient.partner.name },
    subject: `📊 Your week: $${(recipient.earningsThisWeek / 100).toFixed(2)} earned, ${recipient.conversionsThisWeek} conversions`,
    react: WeeklyDigestEmail({
      partnerName: recipient.partner.name,
      weekStartDate: recipient.weekStartDate,
      weekEndDate: recipient.weekEndDate,
      clicksThisWeek: recipient.clicksThisWeek,
      conversionsThisWeek: recipient.conversionsThisWeek,
      earningsThisWeek: recipient.earningsThisWeek,
      clicksLastWeek: recipient.clicksLastWeek,
      conversionsLastWeek: recipient.conversionsLastWeek,
      earningsLastWeek: recipient.earningsLastWeek,
      totalEarnings: recipient.totalEarnings,
      pendingPayout: recipient.pendingPayout,
      topCampaigns: recipient.topCampaigns,
      leaderboardPosition: recipient.leaderboardPosition,
      leaderboardTotal: recipient.leaderboardTotal,
    }),
    tags: [
      { name: 'category', value: 'digest' },
      { name: 'type', value: 'weekly' },
    ],
  }));
  
  // Resend supports up to 100 emails per batch
  const batchSize = 100;
  const results: Array<{ email: string; success: boolean; error?: string }> = [];
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const batchResult = await sendBulkEmails(batch);
    
    batchResult.results.forEach(result => {
      results.push({
        email: result.to,
        success: !result.error,
        error: result.error,
      });
    });
  }
  
  const sent = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const errors = results
    .filter(r => !r.success && r.error)
    .map(r => ({ email: r.email, error: r.error! }));
  
  logger.info('[EmailService] Bulk digest send complete', {
    sent,
    failed,
    total: recipients.length,
  });
  
  return {
    success: failed === 0,
    sent,
    failed,
    errors,
  };
}

// ============================================
// Email Health Check
// ============================================

export function getEmailServiceStatus(): {
  configured: boolean;
  provider: string;
} {
  return {
    configured: isEmailConfigured,
    provider: isEmailConfigured ? 'Resend' : 'None (mock mode)',
  };
}
