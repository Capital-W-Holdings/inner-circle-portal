/**
 * Partner Campaigns API Endpoint
 * 
 * GET  /api/partners/[id]/campaigns - List campaigns
 * POST /api/partners/[id]/campaigns - Create campaign
 * 
 * Security: Requires authentication and partner ownership validation
 * Rate limiting: Applied per endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Campaign, ApiResponse, PaginatedResponse } from '@/types';
import { 
  successResponse, 
  errorResponse, 
  ErrorCodes,
  generateRandomString,
  slugify,
} from '@/lib/utils';
import { createCampaignSchema, partnerIdSchema } from '@/lib/utils';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitHeaders,
  RateLimitConfigs,
  shouldEnforceRateLimit,
} from '@/lib/rate-limit';
import {
  getAuthUser,
  canAccessPartnerData,
  isAuthError,
  AuthError,
} from '@/lib/auth';
import { features } from '@/lib/env';

// ============================================
// Validation
// ============================================

const paramsSchema = z.object({
  id: partnerIdSchema,
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// Types
// ============================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// In-Memory Store (Replace with database)
// ============================================

const campaignStore = new Map<string, Campaign[]>();

function getCampaignsForPartner(partnerId: string): Campaign[] {
  return campaignStore.get(partnerId) ?? [];
}

function addCampaignForPartner(partnerId: string, campaign: Campaign): void {
  const existing = campaignStore.get(partnerId) ?? [];
  campaignStore.set(partnerId, [campaign, ...existing]);
}

// ============================================
// GET Handler - List Campaigns
// ============================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<PaginatedResponse<Campaign>>> {
  try {
    // Rate limiting
    if (shouldEnforceRateLimit()) {
      const clientId = getClientIdentifier(request);
      const rateLimitResult = await checkRateLimit(clientId, RateLimitConfigs.API_GENERAL);
      
      if (!rateLimitResult.success) {
        const headers = rateLimitHeaders(rateLimitResult);
        return NextResponse.json(
          {
            success: false,
            data: [],
            pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasMore: false, hasPrevious: false },
            error: {
              code: ErrorCodes.RATE_LIMIT_EXCEEDED,
              message: `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`,
            },
          },
          { status: 429, headers }
        );
      }
    }

    // Await params (Next.js 15 requirement)
    const resolvedParams = await params;
    
    // Validate partner ID
    const paramsValidation = paramsSchema.safeParse(resolvedParams);
    if (!paramsValidation.success) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasMore: false, hasPrevious: false },
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid partner ID',
          },
        },
        { status: 400 }
      );
    }

    const { id: partnerId } = paramsValidation.data;

    // Authentication check (skip if auth not configured)
    if (features.hasAuth) {
      const authResult = await getAuthUser();
      
      if (!authResult.authenticated) {
        return NextResponse.json(
          {
            success: false,
            data: [],
            pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasMore: false, hasPrevious: false },
            error: {
              code: ErrorCodes.UNAUTHORIZED,
              message: 'Authentication required',
            },
          },
          { status: 401 }
        );
      }

      // Authorization check
      if (!canAccessPartnerData(authResult.user, partnerId)) {
        return NextResponse.json(
          {
            success: false,
            data: [],
            pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasMore: false, hasPrevious: false },
            error: {
              code: ErrorCodes.FORBIDDEN,
              message: 'Access denied to this partner data',
            },
          },
          { status: 403 }
        );
      }
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = querySchema.safeParse({
      page: searchParams.get('page') ?? '1',
      pageSize: searchParams.get('pageSize') ?? '20',
    });

    const { page, pageSize } = queryValidation.success 
      ? queryValidation.data 
      : { page: 1, pageSize: 20 };

    // Get campaigns from store (will be replaced with DB query)
    const allCampaigns = getCampaignsForPartner(partnerId);
    const total = allCampaigns.length;
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;
    const campaigns = allCampaigns.slice(skip, skip + pageSize);

    return NextResponse.json(
      {
        success: true,
        data: campaigns,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasMore: page < totalPages,
          hasPrevious: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/partners/[id]/campaigns error:', error);

    // Handle auth errors specifically
    if (isAuthError(error)) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasMore: false, hasPrevious: false },
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: error.message,
          },
        },
        { status: (error as AuthError).statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        data: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasMore: false, hasPrevious: false },
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'An unexpected error occurred. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST Handler - Create Campaign
// ============================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<Campaign>>> {
  try {
    // Rate limiting (stricter for creation)
    if (shouldEnforceRateLimit()) {
      const clientId = getClientIdentifier(request);
      const rateLimitResult = await checkRateLimit(clientId, RateLimitConfigs.CAMPAIGN_CREATE);
      
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
    const paramsValidation = paramsSchema.safeParse(resolvedParams);
    if (!paramsValidation.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid partner ID',
          { errors: paramsValidation.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }

    const { id: partnerId } = paramsValidation.data;

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

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid JSON in request body'
        ),
        { status: 400 }
      );
    }

    // Validate request body
    const bodyValidation = createCampaignSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid campaign data',
          { errors: bodyValidation.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }

    const { name, source } = bodyValidation.data;

    // TODO: Get partner's referral code from database
    const referralCode = 'ABC123'; // Mock

    // Check for duplicate campaign name
    const existingCampaigns = getCampaignsForPartner(partnerId);
    const campaignSlug = slugify(name);
    const isDuplicate = existingCampaigns.some(
      c => slugify(c.name) === campaignSlug
    );

    if (isDuplicate) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.CONFLICT,
          'A campaign with this name already exists'
        ),
        { status: 409 }
      );
    }

    // Create campaign
    const campaign: Campaign = {
      id: `camp_${generateRandomString(12)}`,
      partnerId,
      name,
      source,
      link: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://innercircle.co'}/r/${referralCode}?c=${campaignSlug}`,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: new Date(),
      isActive: true,
    };

    // Store campaign
    addCampaignForPartner(partnerId, campaign);

    // TODO: Save to database
    // await prisma.campaign.create({ data: campaign });

    return NextResponse.json(
      successResponse(campaign),
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/partners/[id]/campaigns error:', error);

    // Handle auth errors specifically
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: (error as AuthError).statusCode }
      );
    }

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again.'
      ),
      { status: 500 }
    );
  }
}
