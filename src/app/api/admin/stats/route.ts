/**
 * Admin Stats API Endpoint
 * GET /api/admin/stats
 * 
 * Returns aggregate statistics for admin dashboard
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getAuthUser, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import {
  getPartnerRepository,
  getReferralRepository,
  getPayoutRepository,
} from '@/lib/repositories';
import { logger } from '@/lib/monitoring';
import type { Referral, Payout } from '@/lib/db';

// ============================================
// Types
// ============================================

interface AdminStats {
  totalPartners: number;
  activePartners: number;
  pendingApprovals: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalPayouts: number;
  pendingPayouts: number;
  conversionRate: number;
}

interface RecentPartner {
  id: string;
  name: string;
  email: string;
  status: string;
  tier: string;
  createdAt: string;
}

interface RecentPayout {
  id: string;
  partnerName: string;
  amount: number;
  status: string;
  requestedAt: string;
}

interface AdminStatsResponse {
  stats: AdminStats;
  recentPartners: RecentPartner[];
  recentPayouts: RecentPayout[];
  chartData: Array<{ date: string; earnings: number }>;
}

// ============================================
// Handler
// ============================================

export async function GET(): Promise<NextResponse<ApiResponse<AdminStatsResponse>>> {
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

    // Get repositories
    const partnerRepo = getPartnerRepository();
    const referralRepo = getReferralRepository();
    const payoutRepo = getPayoutRepository();

    // Get partner stats
    const allPartners = await partnerRepo.findAll({});
    const activePartners = await partnerRepo.findAll({ status: 'ACTIVE' });
    const pendingPartners = await partnerRepo.findAll({ status: 'PENDING' });

    // Get referral stats by collecting from all partners
    const allReferralsLists = await Promise.all(
      allPartners.map(p => referralRepo.findByPartnerId(p.id, {}))
    );
    const allReferrals: Referral[] = allReferralsLists.flat();
    const convertedReferrals = allReferrals.filter(r => r.status === 'CONVERTED');
    
    // Calculate revenue (sum of converted referral commissions)
    const totalRevenue = convertedReferrals.reduce((sum: number, r: Referral) => sum + r.commissionCents, 0);
    
    // Get monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyReferrals = convertedReferrals.filter(
      (r: Referral) => new Date(r.convertedAt ?? 0) >= thirtyDaysAgo
    );
    const monthlyRevenue = monthlyReferrals.reduce((sum: number, r: Referral) => sum + r.commissionCents, 0);

    // Get payout stats
    const totalPayoutsList = await Promise.all(
      allPartners.map(p => payoutRepo.findByPartnerId(p.id))
    );
    const allPayouts: Payout[] = totalPayoutsList.flat();
    const completedPayouts = allPayouts.filter(p => p.status === 'COMPLETED');
    const pendingPayoutsList = allPayouts.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING');

    const totalPayoutAmount = completedPayouts.reduce((sum: number, p: Payout) => sum + p.amountCents, 0);
    const pendingPayoutAmount = pendingPayoutsList.reduce((sum: number, p: Payout) => sum + p.amountCents, 0);

    // Calculate conversion rate
    const totalClicks = allReferrals.length;
    const conversionRate = totalClicks > 0 
      ? (convertedReferrals.length / totalClicks) * 100 
      : 0;

    // Build recent partners list
    const sortedPartners = [...allPartners].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const recentPartners: RecentPartner[] = sortedPartners.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      status: p.status,
      tier: p.tier,
      createdAt: p.createdAt.toISOString(),
    }));

    // Build recent payouts list
    const sortedPayouts = [...allPayouts].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
    const recentPayoutsList: RecentPayout[] = await Promise.all(
      sortedPayouts.slice(0, 5).map(async (p: Payout) => {
        const partner = await partnerRepo.findById(p.partnerId);
        return {
          id: p.id,
          partnerName: partner?.name ?? 'Unknown',
          amount: p.amountCents,
          status: p.status,
          requestedAt: p.requestedAt.toISOString(),
        };
      })
    );

    // Generate chart data (last 30 days)
    const chartData: Array<{ date: string; earnings: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] ?? '';
      
      // Sum earnings for this day
      const dayEarnings = convertedReferrals
        .filter((r: Referral) => {
          const convertDate = r.convertedAt ? (new Date(r.convertedAt).toISOString().split('T')[0] ?? '') : '';
          return convertDate === dateStr;
        })
        .reduce((sum: number, r: Referral) => sum + r.commissionCents, 0);
      
      chartData.push({ date: dateStr, earnings: dayEarnings });
    }

    const response: AdminStatsResponse = {
      stats: {
        totalPartners: allPartners.length,
        activePartners: activePartners.length,
        pendingApprovals: pendingPartners.length,
        totalRevenue,
        monthlyRevenue,
        totalPayouts: totalPayoutAmount,
        pendingPayouts: pendingPayoutAmount,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      recentPartners,
      recentPayouts: recentPayoutsList,
      chartData,
    };

    logger.info('[AdminStats] Stats retrieved', {
      totalPartners: response.stats.totalPartners,
      pendingApprovals: response.stats.pendingApprovals,
    });

    return NextResponse.json(successResponse(response), { status: 200 });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: error.statusCode }
      );
    }

    logger.error('[AdminStats] Error', error);

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
