/**
 * Stripe Connect Onboarding API Endpoint
 * POST /api/payments/connect
 * GET /api/payments/connect
 * 
 * Manage Stripe Connect account setup for partners
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getAuthUser, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import {
  setupPartnerPayments,
  getPartnerPaymentStatus,
  getPaymentServiceStatus,
  type PartnerPaymentStatus,
} from '@/lib/payment-service';
import { logger } from '@/lib/monitoring';

// ============================================
// Validation
// ============================================

const setupSchema = z.object({
  partnerId: z.string().min(1, 'Partner ID is required'),
});

// ============================================
// POST - Start Onboarding
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ onboardingUrl: string }>>> {
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
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = setupSchema.safeParse(body);
    
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
    
    const { partnerId } = validation.data;
    
    // Setup partner payments
    const result = await setupPartnerPayments(partnerId);
    
    if (!result.success || !result.onboardingUrl) {
      logger.warn('[ConnectAPI] Setup failed', {
        partnerId,
        error: result.error,
      });
      
      return NextResponse.json(
        errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          result.error || 'Failed to setup payment account'
        ),
        { status: 500 }
      );
    }
    
    logger.info('[ConnectAPI] Onboarding initiated', { partnerId });
    
    return NextResponse.json(
      successResponse({ onboardingUrl: result.onboardingUrl }),
      { status: 200 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: error.statusCode }
      );
    }
    
    logger.error('[ConnectAPI] Setup exception', error);
    
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

// ============================================
// GET - Payment Status
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PartnerPaymentStatus | {
  serviceStatus: ReturnType<typeof getPaymentServiceStatus>;
}>>> {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const stripeAccountId = searchParams.get('stripeAccountId') || undefined;
    const statusOnly = searchParams.get('status') === 'true';
    
    // If just checking service status
    if (statusOnly || !partnerId) {
      return NextResponse.json(
        successResponse({ serviceStatus: getPaymentServiceStatus() }),
        { status: 200 }
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
    
    // Get partner payment status
    const status = await getPartnerPaymentStatus(partnerId, stripeAccountId);
    
    return NextResponse.json(
      successResponse(status),
      { status: 200 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: error.statusCode }
      );
    }
    
    logger.error('[ConnectAPI] Status exception', error);
    
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
