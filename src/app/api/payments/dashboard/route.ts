/**
 * Stripe Dashboard Link API Endpoint
 * GET /api/payments/dashboard
 * 
 * Get a link to the Stripe Express dashboard for a Connect account
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getAuthUser, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import { getPartnerDashboardLink } from '@/lib/payment-service';
import { logger } from '@/lib/monitoring';

// ============================================
// GET - Dashboard Link
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ dashboardUrl: string }>>> {
  try {
    const { searchParams } = new URL(request.url);
    const stripeAccountId = searchParams.get('accountId');
    
    if (!stripeAccountId) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Stripe account ID is required'),
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
    
    // Get dashboard link
    const result = await getPartnerDashboardLink(stripeAccountId);
    
    if (result.error || !result.url) {
      logger.warn('[DashboardAPI] Failed to get link', {
        accountId: stripeAccountId,
        error: result.error,
      });
      
      return NextResponse.json(
        errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          result.error || 'Failed to get dashboard link'
        ),
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      successResponse({ dashboardUrl: result.url }),
      { status: 200 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: error.statusCode }
      );
    }
    
    logger.error('[DashboardAPI] Exception', error);
    
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
