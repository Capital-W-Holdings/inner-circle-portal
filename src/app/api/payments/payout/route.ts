/**
 * Payout Request API Endpoint
 * POST /api/payments/payout
 * 
 * Request a payout for a partner's earned commissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getAuthUser, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import {
  requestPayout,
  getPartnerPayoutStats,
  type PayoutResponse,
} from '@/lib/payment-service';
import { logger } from '@/lib/monitoring';

// ============================================
// Validation
// ============================================

const payoutRequestSchema = z.object({
  partnerId: z.string().min(1, 'Partner ID is required'),
  amountCents: z.number().int().positive('Amount must be positive'),
  method: z.enum(['stripe', 'manual']).optional().default('stripe'),
});

// ============================================
// POST - Request Payout
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PayoutResponse>>> {
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
      
      // In production, verify the user owns this partner account
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = payoutRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request',
          { errors: validation.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }
    
    const { partnerId, amountCents, method } = validation.data;
    
    // Request payout
    const result = await requestPayout({
      partnerId,
      amountCents,
      method,
    });
    
    if (!result.success) {
      logger.warn('[PayoutAPI] Payout request failed', {
        partnerId,
        amount: amountCents,
        error: result.error,
        errorCode: result.errorCode,
      });
      
      // Return appropriate status based on error
      const status = result.errorCode === 'PARTNER_NOT_FOUND' ? 404 : 400;
      
      return NextResponse.json(
        errorResponse(
          result.errorCode === 'PARTNER_NOT_FOUND' 
            ? ErrorCodes.NOT_FOUND 
            : ErrorCodes.VALIDATION_ERROR,
          result.error || 'Payout request failed'
        ),
        { status }
      );
    }
    
    logger.info('[PayoutAPI] Payout requested successfully', {
      partnerId,
      payoutId: result.payout?.id,
      amount: amountCents,
    });
    
    return NextResponse.json(
      successResponse(result),
      { status: 201 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: error.statusCode }
      );
    }
    
    logger.error('[PayoutAPI] Exception', error);
    
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

// ============================================
// GET - Partner Payout Stats
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{
  totalPaid: number;
  totalPending: number;
  totalProcessing: number;
  payoutCount: number;
  lastPayoutDate?: string;
}>>> {
  try {
    // Get partner ID from query params
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    
    if (!partnerId) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Partner ID is required'),
        { status: 400 }
      );
    }
    
    // Authentication check
    if (features.hasAuth) {
      const authResult = await getAuthUser();
      
      if (!authResult.authenticated) {
        return NextResponse.json(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required'),
          { status: 401 }
        );
      }
    }
    
    const stats = await getPartnerPayoutStats(partnerId);
    
    return NextResponse.json(
      successResponse({
        totalPaid: stats.totalPaid,
        totalPending: stats.totalPending,
        totalProcessing: stats.totalProcessing,
        payoutCount: stats.payoutCount,
        lastPayoutDate: stats.lastPayoutDate?.toISOString(),
      }),
      { status: 200 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: error.statusCode }
      );
    }
    
    logger.error('[PayoutAPI] Stats exception', error);
    
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
