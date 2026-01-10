/**
 * Admin Payouts List API Endpoint
 * GET /api/admin/payouts
 * 
 * Returns list of all payouts for admin management
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, PayoutStatus } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getAuthUser, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import { getPartnerRepository, getPayoutRepository } from '@/lib/repositories';
import { logger } from '@/lib/monitoring';

// ============================================
// Types
// ============================================

interface AdminPayout {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PayoutStatus;
  requestedAt: string;
  processedAt?: string | null;
}

// ============================================
// Handler
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ payouts: AdminPayout[] }>>> {
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    // Get repositories
    const partnerRepo = getPartnerRepository();
    const payoutRepo = getPayoutRepository();

    // Get all partners
    const allPartners = await partnerRepo.findAll({});

    // Get all payouts
    const allPayoutsList = await Promise.all(
      allPartners.map(p => payoutRepo.findByPartnerId(p.id))
    );
    let allPayouts = allPayoutsList.flat();

    // Filter by status if provided
    if (statusParam && ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(statusParam)) {
      allPayouts = allPayouts.filter(p => p.status === statusParam);
    }

    // Sort by requestedAt (newest first)
    allPayouts.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    // Build response with partner info
    const payouts: AdminPayout[] = await Promise.all(
      allPayouts.map(async (payout) => {
        const partner = await partnerRepo.findById(payout.partnerId);
        return {
          id: payout.id,
          partnerId: payout.partnerId,
          partnerName: partner?.name ?? 'Unknown',
          partnerEmail: partner?.email ?? 'unknown@example.com',
          amount: payout.amountCents,
          fee: payout.feeCents,
          netAmount: payout.netCents,
          status: payout.status,
          requestedAt: payout.requestedAt.toISOString(),
          processedAt: payout.processedAt?.toISOString() ?? null,
        };
      })
    );

    logger.info('[AdminPayouts] Payouts retrieved', {
      count: payouts.length,
    });

    return NextResponse.json(successResponse({ payouts }), { status: 200 });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: error.statusCode }
      );
    }

    logger.error('[AdminPayouts] Error', error);

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
