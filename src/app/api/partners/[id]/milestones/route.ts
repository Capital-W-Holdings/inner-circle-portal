/**
 * Partner Milestones API Endpoint
 * 
 * GET  /api/partners/[id]/milestones - List milestones
 * POST /api/partners/[id]/milestones - Check for new milestones
 * 
 * Security: Requires authentication and partner ownership validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { 
  Milestone, 
  MilestoneCheck, 
  MilestoneType,
  ApiResponse, 
  PaginatedResponse 
} from '@/types';
import { MILESTONE_CONFIGS } from '@/types';
import { 
  successResponse, 
  errorResponse, 
  ErrorCodes,
  generateRandomString,
} from '@/lib/utils';

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

interface PartnerProgress {
  totalShares: number;
  totalClicks: number;
  totalConversions: number;
  totalEarned: number; // in cents
  currentTier: string;
  previousTier: string;
}

// ============================================
// Milestone Check Logic
// ============================================

function checkMilestones(
  partnerId: string,
  progress: PartnerProgress,
  existingMilestones: Set<MilestoneType>
): Milestone[] {
  const newMilestones: Milestone[] = [];

  const milestoneChecks: { type: MilestoneType; condition: boolean }[] = [
    { type: 'FIRST_SHARE', condition: progress.totalShares >= 1 },
    { type: 'FIRST_CLICK', condition: progress.totalClicks >= 1 },
    { type: 'FIRST_CONVERSION', condition: progress.totalConversions >= 1 },
    { type: 'TENTH_CONVERSION', condition: progress.totalConversions >= 10 },
    { type: 'HUNDRED_CONVERSION', condition: progress.totalConversions >= 100 },
    { type: 'THOUSAND_EARNED', condition: progress.totalEarned >= 100000 }, // $1,000
    { type: 'TEN_THOUSAND_EARNED', condition: progress.totalEarned >= 1000000 }, // $10,000
    { type: 'TIER_UPGRADE', condition: progress.currentTier !== progress.previousTier },
  ];

  for (const check of milestoneChecks) {
    if (check.condition && !existingMilestones.has(check.type)) {
      const config = MILESTONE_CONFIGS[check.type];
      newMilestones.push({
        id: `mile_${generateRandomString(12)}`,
        partnerId,
        type: check.type,
        title: config.emoji + ' ' + check.type.replace(/_/g, ' ').toLowerCase(),
        description: config.message,
        achievedAt: new Date(),
        celebrationShown: false,
      });
    }
  }

  return newMilestones;
}

// ============================================
// In-Memory Store (Replace with database)
// ============================================

const milestoneStore = new Map<string, Milestone[]>();

function getMilestonesForPartner(partnerId: string): Milestone[] {
  return milestoneStore.get(partnerId) ?? [];
}

function addMilestonesForPartner(partnerId: string, milestones: Milestone[]): void {
  const existing = milestoneStore.get(partnerId) ?? [];
  milestoneStore.set(partnerId, [...milestones, ...existing]);
}

// Mock progress fetcher (replace with database query)
function getPartnerProgress(_partnerId: string): PartnerProgress {
  // In production, this would query the database
  return {
    totalShares: 15,
    totalClicks: 892,
    totalConversions: 47,
    totalEarned: 1245000, // $12,450.00
    currentTier: 'GOLD',
    previousTier: 'GOLD',
  };
}

// ============================================
// GET Handler - List Milestones
// ============================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<PaginatedResponse<Milestone>>> {
  try {
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

    // TODO: Authenticate and authorize request

    // Get milestones
    const milestones = getMilestonesForPartner(partnerId);

    return NextResponse.json(
      {
        success: true,
        data: milestones,
        pagination: {
          page: 1,
          pageSize: milestones.length,
          total: milestones.length,
          totalPages: 1,
          hasMore: false,
          hasPrevious: false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/partners/[id]/milestones error:', error);

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
// POST Handler - Check for New Milestones
// ============================================

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<MilestoneCheck>>> {
  try {
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

    // TODO: Authenticate and authorize request

    // Get current progress and existing milestones
    const progress = getPartnerProgress(partnerId);
    const existingMilestones = getMilestonesForPartner(partnerId);
    const existingTypes = new Set(existingMilestones.map(m => m.type));

    // Check for new milestones
    const newMilestones = checkMilestones(partnerId, progress, existingTypes);

    // Store new milestones
    if (newMilestones.length > 0) {
      addMilestonesForPartner(partnerId, newMilestones);
    }

    // Build response
    const response: MilestoneCheck = {
      newMilestones,
      celebrationConfig: newMilestones.length > 0 
        ? MILESTONE_CONFIGS[newMilestones[0]!.type]
        : undefined,
    };

    return NextResponse.json(
      successResponse(response),
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/partners/[id]/milestones error:', error);

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again.'
      ),
      { status: 500 }
    );
  }
}
