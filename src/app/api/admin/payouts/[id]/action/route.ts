/**
 * Admin Payout Action API Endpoint
 * POST /api/admin/payouts/[id]/action
 * 
 * Perform actions on payouts (approve, process, reject)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse, PayoutStatus } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getAuthUser, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import { getPayoutRepository } from '@/lib/repositories';
import { logger } from '@/lib/monitoring';

// ============================================
// Validation
// ============================================

const actionSchema = z.object({
  action: z.enum(['approve', 'process', 'reject']),
  reason: z.string().optional(),
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
): Promise<NextResponse<ApiResponse<{ success: boolean; newStatus: PayoutStatus }>>> {
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

    // Get payout ID
    const { id: payoutId } = await params;

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

    const { action } = validation.data;

    // Get payout
    const payoutRepo = getPayoutRepository();
    const payout = await payoutRepo.findById(payoutId);

    if (!payout) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'Payout not found'),
        { status: 404 }
      );
    }

    // Determine new status based on action
    let newStatus: PayoutStatus;

    switch (action) {
      case 'approve':
        if (payout.status !== 'PENDING' && payout.status !== 'FAILED') {
          return NextResponse.json(
            errorResponse(ErrorCodes.VALIDATION_ERROR, 'Payout cannot be approved in current status'),
            { status: 400 }
          );
        }
        newStatus = 'PROCESSING';
        break;

      case 'process':
        if (payout.status !== 'PROCESSING') {
          return NextResponse.json(
            errorResponse(ErrorCodes.VALIDATION_ERROR, 'Payout must be in PROCESSING status'),
            { status: 400 }
          );
        }
        newStatus = 'COMPLETED';
        break;

      case 'reject':
        if (payout.status !== 'PENDING') {
          return NextResponse.json(
            errorResponse(ErrorCodes.VALIDATION_ERROR, 'Only pending payouts can be rejected'),
            { status: 400 }
          );
        }
        newStatus = 'FAILED';
        break;

      default:
        return NextResponse.json(
          errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid action'),
          { status: 400 }
        );
    }

    // Update payout
    await payoutRepo.update(payoutId, {
      status: newStatus,
      processedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
    });

    logger.info('[AdminPayoutAction] Action performed', {
      payoutId,
      action,
      newStatus,
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

    logger.error('[AdminPayoutAction] Error', error);

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
