/**
 * Partner Stats API Endpoint
 * GET /api/partners/[id]/stats
 * 
 * Returns aggregate statistics for a partner including:
 * - Total earnings
 * - Pending payout amount
 * - Referral counts
 * - Conversion rates
 * - Recent activity
 * 
 * Security: Requires authentication and partner ownership validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { PartnerStats, ApiResponse } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getPartnerStats, getNotificationRepository } from '@/lib/repositories';
import { getAuthUser, canAccessPartnerData, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitHeaders,
  RateLimitConfigs,
  shouldEnforceRateLimit,
} from '@/lib/rate-limit';

// ============================================
// Validation
// ============================================

const paramsSchema = z.object({
  id: z.string().min(1, 'Partner ID is required'),
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

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<PartnerStats>>> {
  try {
    // Rate limiting
    if (shouldEnforceRateLimit()) {
      const clientId = getClientIdentifier(request);
      const rateLimitResult = await checkRateLimit(clientId, RateLimitConfigs.API_GENERAL);
      
      if (!rateLimitResult.success) {
        const headers = rateLimitHeaders(rateLimitResult);
        return NextResponse.json(
          errorResponse(
            ErrorCodes.RATE_LIMIT_EXCEEDED,
            `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`
          ),
          { status: 429, headers }
        );
      }
    }

    // Await params (Next.js 15 requirement)
    const resolvedParams = await params;
    
    // Validate partner ID
    const validation = paramsSchema.safeParse(resolvedParams);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid partner ID',
          { errors: validation.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }

    const { id: partnerId } = validation.data;

    // Authentication check (skip if auth not configured)
    if (features.hasAuth) {
      const authResult = await getAuthUser();
      
      if (!authResult.authenticated) {
        return NextResponse.json(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required'),
          { status: 401 }
        );
      }

      // Authorization check
      if (!canAccessPartnerData(authResult.user, partnerId)) {
        return NextResponse.json(
          errorResponse(ErrorCodes.FORBIDDEN, 'Access denied to this partner data'),
          { status: 403 }
        );
      }
    }

    // Get stats from repository
    const stats = await getPartnerStats(partnerId);
    
    // Get recent notifications as activity
    const notificationRepo = getNotificationRepository();
    const recentNotifications = await notificationRepo.findByPartnerId(partnerId, { limit: 5 });
    
    // Map notification types to activity types
    const notificationToActivityType: Record<string, 'CLICK' | 'CONVERSION' | 'PAYOUT' | 'MILESTONE' | 'CAMPAIGN' | null> = {
      'CONVERSION': 'CONVERSION',
      'PAYOUT': 'PAYOUT',
      'MILESTONE': 'MILESTONE',
      'CAMPAIGN': 'CAMPAIGN',
      'SYSTEM': null,
      'PROMOTION': null,
    };
    
    // Build the response
    const response: PartnerStats = {
      totalEarned: stats.totalEarned,
      pendingPayout: stats.pendingPayout,
      totalReferrals: stats.totalReferrals,
      referralsThisMonth: stats.referralsThisMonth,
      clicksThisMonth: stats.clicksThisMonth,
      conversionRate: Math.round(stats.conversionRate * 100) / 100,
      recentActivity: recentNotifications
        .map(n => {
          const activityType = notificationToActivityType[n.type];
          if (!activityType) return null;
          return {
            id: n.id,
            type: activityType,
            title: n.title,
            description: n.message,
            amount: undefined,
            timestamp: n.createdAt,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    };

    return NextResponse.json(successResponse(response), { status: 200 });
  } catch (error) {
    // Handle auth errors specifically
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: error.statusCode }
      );
    }

    // Log error for monitoring
    console.error('GET /api/partners/[id]/stats error:', error);

    // Don't expose internal error details
    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again.'
      ),
      { status: 500 }
    );
  }
}
