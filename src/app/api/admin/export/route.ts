/**
 * Admin Export API Endpoint
 * GET /api/admin/export
 * 
 * Export partners or payouts as CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse, ErrorCodes } from '@/lib/utils';
import { getAuthUser, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import { getPartnerRepository, getPayoutRepository, getReferralRepository } from '@/lib/repositories';
import { logger } from '@/lib/monitoring';
import type { Referral, Payout } from '@/lib/db';

// ============================================
// Validation
// ============================================

const querySchema = z.object({
  type: z.enum(['partners', 'payouts', 'referrals']),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ============================================
// Helper Functions
// ============================================

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDateStr(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const parts = d.toISOString().split('T');
  return parts[0] ?? d.toISOString().substring(0, 10);
}

function formatCurrencyValue(cents: number): string {
  return (cents / 100).toFixed(2);
}

// ============================================
// Handler
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Authentication check
    if (features.hasAuth) {
      const authResult = await getAuthUser();
      
      if (!authResult.authenticated) {
        return NextResponse.json(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required'),
          { status: 401 }
        );
      }

      // Admin role check
      if (authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required'),
          { status: 403 }
        );
      }
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const params = {
      type: searchParams.get('type'),
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const validation = querySchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid export parameters',
          { errors: validation.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }

    const { type, status, startDate, endDate } = validation.data;
    let csv = '';
    let filename = '';

    // Generate CSV based on type
    switch (type) {
      case 'partners': {
        const partnerRepo = getPartnerRepository();
        const referralRepo = getReferralRepository();
        
        // Get all partners
        const partners = await partnerRepo.findAll(
          status ? { status: status as 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'SUSPENDED' } : {}
        );

        // CSV Header
        csv = 'ID,Name,Email,Referral Code,Status,Tier,Company,Phone,Total Referrals,Total Earnings,Created At\n';

        // Add rows
        for (const partner of partners) {
          const referrals = await referralRepo.findByPartnerId(partner.id, {});
          const converted = referrals.filter(r => r.status === 'CONVERTED');
          const totalEarnings = converted.reduce((sum: number, r: Referral) => sum + r.commissionCents, 0);

          csv += [
            escapeCSV(partner.id),
            escapeCSV(partner.name),
            escapeCSV(partner.email),
            escapeCSV(partner.referralCode),
            escapeCSV(partner.status),
            escapeCSV(partner.tier),
            escapeCSV(partner.company),
            escapeCSV(partner.phone),
            converted.length,
            formatCurrencyValue(totalEarnings),
            formatDateStr(partner.createdAt),
          ].join(',') + '\n';
        }

        filename = `partners-export-${formatDateStr(new Date())}.csv`;
        break;
      }

      case 'payouts': {
        const payoutRepo = getPayoutRepository();
        const partnerRepo = getPartnerRepository();
        
        // Get all payouts by iterating through partners
        const partners = await partnerRepo.findAll({});
        const payoutLists = await Promise.all(
          partners.map(p => payoutRepo.findByPartnerId(p.id))
        );
        let payouts: Payout[] = payoutLists.flat();

        // Filter by status if provided
        if (status) {
          payouts = payouts.filter((p: Payout) => p.status === status);
        }

        // Filter by date range if provided
        if (startDate) {
          const start = new Date(startDate);
          payouts = payouts.filter((p: Payout) => new Date(p.requestedAt) >= start);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          payouts = payouts.filter((p: Payout) => new Date(p.requestedAt) <= end);
        }

        // CSV Header
        csv = 'ID,Partner ID,Partner Name,Partner Email,Amount,Fee,Net Amount,Status,Requested At,Processed At\n';

        // Add rows
        for (const payout of payouts) {
          const partner = await partnerRepo.findById(payout.partnerId);

          csv += [
            escapeCSV(payout.id),
            escapeCSV(payout.partnerId),
            escapeCSV(partner?.name || 'Unknown'),
            escapeCSV(partner?.email || 'Unknown'),
            formatCurrencyValue(payout.amountCents),
            formatCurrencyValue(payout.feeCents),
            formatCurrencyValue(payout.netCents),
            escapeCSV(payout.status),
            formatDateStr(payout.requestedAt),
            payout.processedAt ? formatDateStr(payout.processedAt) : '',
          ].join(',') + '\n';
        }

        filename = `payouts-export-${formatDateStr(new Date())}.csv`;
        break;
      }

      case 'referrals': {
        const referralRepo = getReferralRepository();
        const partnerRepo = getPartnerRepository();
        
        // Get all referrals by iterating through partners
        const partners = await partnerRepo.findAll({});
        const referralLists = await Promise.all(
          partners.map(p => referralRepo.findByPartnerId(p.id, {}))
        );
        let referrals: Referral[] = referralLists.flat();

        // Filter by status if provided
        if (status) {
          referrals = referrals.filter((r: Referral) => r.status === status);
        }

        // Filter by date range if provided
        if (startDate) {
          const start = new Date(startDate);
          referrals = referrals.filter((r: Referral) => new Date(r.createdAt) >= start);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          referrals = referrals.filter((r: Referral) => new Date(r.createdAt) <= end);
        }

        // CSV Header
        csv = 'ID,Partner ID,Partner Name,Status,Commission,Customer Hash,Created At,Converted At\n';

        // Add rows
        for (const referral of referrals) {
          const partner = await partnerRepo.findById(referral.partnerId);

          csv += [
            escapeCSV(referral.id),
            escapeCSV(referral.partnerId),
            escapeCSV(partner?.name || 'Unknown'),
            escapeCSV(referral.status),
            formatCurrencyValue(referral.commissionCents),
            escapeCSV(referral.customerHash),
            formatDateStr(referral.createdAt),
            referral.convertedAt ? formatDateStr(referral.convertedAt) : '',
          ].join(',') + '\n';
        }

        filename = `referrals-export-${formatDateStr(new Date())}.csv`;
        break;
      }
    }

    logger.info('[AdminExport] Export generated', {
      type,
      status,
      filename,
    });

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: (error as { statusCode: number }).statusCode }
      );
    }

    logger.error('[AdminExport] Error', error);

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
