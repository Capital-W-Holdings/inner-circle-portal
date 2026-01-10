/**
 * Leaderboard API Endpoint
 * GET /api/leaderboard
 * 
 * Returns partner leaderboard rankings for different time periods.
 * 
 * Query params:
 * - period: 'monthly' | 'quarterly' | 'alltime' (default: 'monthly')
 * - limit: number (default: 20, max: 100)
 * 
 * Security: Public endpoint (only shows opted-in partners)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getLeaderboard } from '@/lib/repositories';
import { getAuthUser } from '@/lib/auth';

// ============================================
// Types
// ============================================

interface LeaderboardEntry {
  rank: number;
  partnerId: string;
  displayName: string;
  tier: string;
  referrals: number;
  earnings: number;
  isCurrentUser: boolean;
}

// ============================================
// Validation
// ============================================

const querySchema = z.object({
  period: z.enum(['monthly', 'quarterly', 'alltime']).default('monthly'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// Handler
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<LeaderboardEntry[]>>> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      period: searchParams.get('period') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid query parameters',
          { errors: queryResult.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }

    const { limit } = queryResult.data;

    // Get current user to mark their entry
    const authResult = await getAuthUser();
    const currentPartnerId = authResult.user?.partnerId;

    // Get leaderboard from repository
    const leaderboardData = await getLeaderboard(limit);

    // Transform to response format
    const leaderboard: LeaderboardEntry[] = leaderboardData.map(entry => ({
      rank: entry.rank,
      partnerId: entry.partnerId,
      displayName: entry.partnerName.split(' ')[0] + ' ' + (entry.partnerName.split(' ')[1]?.[0] ?? '') + '.',
      tier: entry.tier,
      referrals: entry.referralsThisMonth,
      earnings: entry.totalEarned,
      isCurrentUser: entry.partnerId === currentPartnerId,
    }));

    return NextResponse.json(
      successResponse(leaderboard),
      { 
        status: 200,
        headers: {
          // Cache for 5 minutes
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/leaderboard error:', error);

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again.'
      ),
      { status: 500 }
    );
  }
}
