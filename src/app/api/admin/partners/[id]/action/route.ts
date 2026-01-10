/**
 * Admin Partner Action API Endpoint
 * POST /api/admin/partners/[id]/action
 * 
 * Perform actions on partners (approve, suspend, activate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse, PartnerStatus, PartnerTier } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getAuthUser, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import { getPartnerRepository } from '@/lib/repositories';
import { logger } from '@/lib/monitoring';

// ============================================
// Validation
// ============================================

const actionSchema = z.object({
  action: z.enum(['approve', 'suspend', 'activate', 'upgrade', 'downgrade']),
  tier: z.enum(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
});

// ============================================
// Types
// ============================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// Handler
// ============================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ success: boolean; newStatus?: PartnerStatus }>>> {
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

    // Get partner ID
    const { id: partnerId } = await params;

    // Parse body
    const body = await request.json();
    const validation = actionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid action',
          { errors: validation.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }

    const { action, tier } = validation.data;

    // Get partner
    const partnerRepo = getPartnerRepository();
    const partner = await partnerRepo.findById(partnerId);

    if (!partner) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'Partner not found'),
        { status: 404 }
      );
    }

    // Determine new status/tier based on action
    let newStatus: PartnerStatus | undefined;
    let newTier = partner.tier;

    switch (action) {
      case 'approve':
        if (partner.status !== 'PENDING') {
          return NextResponse.json(
            errorResponse(ErrorCodes.VALIDATION_ERROR, 'Partner is not pending approval'),
            { status: 400 }
          );
        }
        newStatus = 'ACTIVE';
        break;

      case 'suspend':
        if (partner.status === 'SUSPENDED') {
          return NextResponse.json(
            errorResponse(ErrorCodes.VALIDATION_ERROR, 'Partner is already suspended'),
            { status: 400 }
          );
        }
        newStatus = 'SUSPENDED';
        break;

      case 'activate':
        if (partner.status === 'ACTIVE') {
          return NextResponse.json(
            errorResponse(ErrorCodes.VALIDATION_ERROR, 'Partner is already active'),
            { status: 400 }
          );
        }
        newStatus = 'ACTIVE';
        break;

      case 'upgrade':
      case 'downgrade':
        if (!tier) {
          return NextResponse.json(
            errorResponse(ErrorCodes.VALIDATION_ERROR, 'Tier is required for upgrade/downgrade'),
            { status: 400 }
          );
        }
        newTier = tier as PartnerTier;
        break;
    }

    // Update partner
    const updateData: { status?: PartnerStatus; tier?: PartnerTier } = {};
    if (newStatus) updateData.status = newStatus;
    if (newTier !== partner.tier) updateData.tier = newTier;

    if (Object.keys(updateData).length > 0) {
      await partnerRepo.update(partnerId, updateData);
    }

    logger.info('[AdminPartnerAction] Action performed', {
      partnerId,
      action,
      newStatus,
      newTier: newTier !== partner.tier ? newTier : undefined,
    });

    return NextResponse.json(
      successResponse({ success: true, newStatus }),
      { status: 200 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: error.statusCode }
      );
    }

    logger.error('[AdminPartnerAction] Error', error);

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
