/**
 * Admin Partners List API Endpoint
 * GET /api/admin/partners
 * 
 * Returns list of all partners with stats for admin management
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, PartnerStatus, PartnerTier } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getAuthUser, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import { getPartnerRepository, getReferralRepository } from '@/lib/repositories';
import { logger } from '@/lib/monitoring';

// ============================================
// Types
// ============================================

interface AdminPartner {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  status: PartnerStatus;
  tier: PartnerTier;
  company?: string | null;
  phone?: string | null;
  totalEarnings: number;
  totalReferrals: number;
  createdAt: string;
}

// ============================================
// Handler
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ partners: AdminPartner[] }>>> {
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
    const tierParam = searchParams.get('tier');

    // Get repositories
    const partnerRepo = getPartnerRepository();
    const referralRepo = getReferralRepository();

    // Build filter options
    const options: {
      status?: PartnerStatus;
      tier?: PartnerTier;
    } = {};

    if (statusParam && ['ACTIVE', 'PENDING', 'INACTIVE', 'SUSPENDED'].includes(statusParam)) {
      options.status = statusParam as PartnerStatus;
    }
    if (tierParam && ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(tierParam)) {
      options.tier = tierParam as PartnerTier;
    }

    // Get partners
    const allPartners = await partnerRepo.findAll(options);

    // Get stats for each partner
    const partners: AdminPartner[] = await Promise.all(
      allPartners.map(async (partner) => {
        // Get referrals for this partner
        const referrals = await referralRepo.findByPartnerId(partner.id, {});
        const convertedReferrals = referrals.filter(r => r.status === 'CONVERTED');
        
        const totalEarnings = convertedReferrals.reduce((sum, r) => sum + r.commissionCents, 0);

        return {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          referralCode: partner.referralCode,
          status: partner.status,
          tier: partner.tier,
          company: partner.company,
          phone: partner.phone,
          totalEarnings,
          totalReferrals: convertedReferrals.length,
          createdAt: partner.createdAt.toISOString(),
        };
      })
    );

    logger.info('[AdminPartners] Partners retrieved', {
      count: partners.length,
    });

    return NextResponse.json(successResponse({ partners }), { status: 200 });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: error.statusCode }
      );
    }

    logger.error('[AdminPartners] Error', error);

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
