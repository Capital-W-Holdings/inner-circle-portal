/**
 * Partner Analytics API Endpoint
 * GET /api/partners/[id]/analytics
 * 
 * Returns detailed analytics data with:
 * - Overview metrics
 * - Conversion funnel
 * - Time series data
 * - Source breakdown
 * 
 * Security: Requires authentication (placeholder)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface AnalyticsData {
  overview: {
    clicks: number;
    clicksTrend: number;
    conversions: number;
    conversionsTrend: number;
    revenue: number;
    revenueTrend: number;
    conversionRate: number;
    conversionRateTrend: number;
  };
  funnel: {
    stage: string;
    count: number;
    percentage: number;
  }[];
  timeSeries: {
    date: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }[];
  sourceBreakdown: {
    source: string;
    clicks: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  }[];
  topCampaigns: {
    id: string;
    name: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }[];
}

// ============================================
// Validation
// ============================================

const paramsSchema = z.object({
  id: z.string().min(1, 'Partner ID is required'),
});

const querySchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'ytd', 'all']).optional().default('30d'),
});

// ============================================
// Mock Data Generator
// ============================================

function generateMockAnalytics(range: string): AnalyticsData {
  const multiplier = range === '7d' ? 1 : range === '30d' ? 4 : range === '90d' ? 12 : 24;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 180;

  const timeSeries = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    const baseClicks = 50 + Math.random() * 100;
    const conversions = Math.floor(baseClicks * (0.03 + Math.random() * 0.04));
    return {
      date: date.toISOString().split('T')[0] ?? '',
      clicks: Math.floor(baseClicks),
      conversions,
      revenue: conversions * (25000 + Math.floor(Math.random() * 15000)),
    };
  });

  return {
    overview: {
      clicks: 1250 * multiplier,
      clicksTrend: 12.5,
      conversions: 47 * multiplier,
      conversionsTrend: 8.3,
      revenue: 1245000 * multiplier,
      revenueTrend: 15.2,
      conversionRate: 3.76,
      conversionRateTrend: -0.5,
    },
    funnel: [
      { stage: 'Link Clicks', count: 1250 * multiplier, percentage: 100 },
      { stage: 'Page Views', count: 980 * multiplier, percentage: 78.4 },
      { stage: 'Sign-up Started', count: 245 * multiplier, percentage: 19.6 },
      { stage: 'Sign-up Completed', count: 89 * multiplier, percentage: 7.1 },
      { stage: 'Converted', count: 47 * multiplier, percentage: 3.8 },
    ],
    timeSeries,
    sourceBreakdown: [
      { source: 'LinkedIn', clicks: 450 * multiplier, conversions: 22 * multiplier, revenue: 580000 * multiplier, conversionRate: 4.9 },
      { source: 'Twitter/X', clicks: 320 * multiplier, conversions: 12 * multiplier, revenue: 315000 * multiplier, conversionRate: 3.8 },
      { source: 'Email', clicks: 280 * multiplier, conversions: 8 * multiplier, revenue: 210000 * multiplier, conversionRate: 2.9 },
      { source: 'WhatsApp', clicks: 120 * multiplier, conversions: 4 * multiplier, revenue: 105000 * multiplier, conversionRate: 3.3 },
      { source: 'Direct', clicks: 80 * multiplier, conversions: 1 * multiplier, revenue: 35000 * multiplier, conversionRate: 1.3 },
    ],
    topCampaigns: [
      { id: 'camp-1', name: 'Q1 LinkedIn Push', clicks: 380, conversions: 18, revenue: 475000 },
      { id: 'camp-2', name: 'Newsletter Feature', clicks: 245, conversions: 9, revenue: 237000 },
      { id: 'camp-3', name: 'Twitter Thread', clicks: 198, conversions: 7, revenue: 184000 },
      { id: 'camp-4', name: 'Podcast Mention', clicks: 156, conversions: 6, revenue: 158000 },
      { id: 'camp-5', name: 'Blog Post CTA', clicks: 134, conversions: 5, revenue: 132000 },
    ],
  };
}

// ============================================
// Handler
// ============================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<AnalyticsData>>> {
  try {
    // Await and validate route params
    const params = await context.params;
    const paramsResult = paramsSchema.safeParse(params);

    if (!paramsResult.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid partner ID',
          { errors: paramsResult.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }

    const { id: _partnerId } = paramsResult.data;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      range: searchParams.get('range') ?? undefined,
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

    const { range } = queryResult.data;

    // TODO: Authenticate and fetch from database
    const analytics = generateMockAnalytics(range);

    return NextResponse.json(
      successResponse(analytics),
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/partners/[id]/analytics error:', error);

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again.'
      ),
      { status: 500 }
    );
  }
}
