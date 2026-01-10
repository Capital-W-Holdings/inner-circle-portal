/**
 * Experiments API Endpoint
 * GET /api/experiments - List experiments
 * POST /api/experiments - Create experiment
 * 
 * Manages A/B testing experiments for share templates.
 * 
 * Security: Requires authentication (placeholder)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import { successResponse, errorResponse, ErrorCodes, generateRandomString } from '@/lib/utils';

// ============================================
// Types
// ============================================

type ExperimentStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

interface Variant {
  id: string;
  name: string;
  content: string;
  impressions: number;
  clicks: number;
  conversions: number;
  isControl: boolean;
  isWinner?: boolean;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  variants: Variant[];
  startedAt?: Date;
  endedAt?: Date;
  minSampleSize: number;
  confidenceLevel: number;
}

// ============================================
// Validation
// ============================================

const querySchema = z.object({
  partnerId: z.string().min(1, 'Partner ID is required'),
  status: z.enum(['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED']).optional(),
});

const createSchema = z.object({
  partnerId: z.string().min(1, 'Partner ID is required'),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  variants: z.array(z.object({
    name: z.string().min(1),
    content: z.string().min(1),
    isControl: z.boolean(),
  })).min(2, 'At least 2 variants required'),
  minSampleSize: z.number().int().min(50).max(10000).optional().default(100),
  confidenceLevel: z.number().int().min(80).max(99).optional().default(95),
});

// ============================================
// In-Memory Store
// ============================================

const experimentStore = new Map<string, Experiment[]>();

function getExperiments(partnerId: string): Experiment[] {
  if (!experimentStore.has(partnerId)) {
    // Initialize with mock data
    experimentStore.set(partnerId, generateMockExperiments());
  }
  return experimentStore.get(partnerId) ?? [];
}

function generateMockExperiments(): Experiment[] {
  return [
    {
      id: 'exp-1',
      name: 'LinkedIn Share Message',
      description: 'Testing professional vs casual tone',
      status: 'RUNNING',
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      minSampleSize: 100,
      confidenceLevel: 95,
      variants: [
        {
          id: 'var-1a',
          name: 'Professional (Control)',
          content: 'Discover how leading companies are transforming...',
          impressions: 450,
          clicks: 45,
          conversions: 12,
          isControl: true,
        },
        {
          id: 'var-1b',
          name: 'Casual & Personal',
          content: 'Just found this amazing tool...',
          impressions: 438,
          clicks: 62,
          conversions: 18,
          isControl: false,
        },
      ],
    },
    {
      id: 'exp-2',
      name: 'Email Subject Line',
      description: 'Question vs statement',
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      minSampleSize: 200,
      confidenceLevel: 95,
      variants: [
        {
          id: 'var-2a',
          name: 'Statement (Control)',
          content: 'This will change how you work',
          impressions: 520,
          clicks: 78,
          conversions: 15,
          isControl: true,
        },
        {
          id: 'var-2b',
          name: 'Question',
          content: 'Want to 10x your productivity?',
          impressions: 515,
          clicks: 103,
          conversions: 24,
          isControl: false,
          isWinner: true,
        },
      ],
    },
  ];
}

// ============================================
// GET Handler
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Experiment[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      partnerId: searchParams.get('partnerId'),
      status: searchParams.get('status') ?? undefined,
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

    const { partnerId, status } = queryResult.data;
    let experiments = getExperiments(partnerId);

    if (status) {
      experiments = experiments.filter(e => e.status === status);
    }

    return NextResponse.json(
      successResponse(experiments),
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/experiments error:', error);

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again.'
      ),
      { status: 500 }
    );
  }
}

// ============================================
// POST Handler
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Experiment>>> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid JSON'),
        { status: 400 }
      );
    }

    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          { errors: validation.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }

    const { partnerId, name, description, variants, minSampleSize, confidenceLevel } = validation.data;

    const experiment: Experiment = {
      id: `exp_${generateRandomString(8)}`,
      name,
      description: description ?? '',
      status: 'DRAFT',
      variants: variants.map((v, i) => ({
        id: `var_${generateRandomString(8)}`,
        name: v.name,
        content: v.content,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        isControl: v.isControl || i === 0,
      })),
      minSampleSize,
      confidenceLevel,
    };

    const experiments = getExperiments(partnerId);
    experiments.unshift(experiment);
    experimentStore.set(partnerId, experiments);

    return NextResponse.json(
      successResponse(experiment),
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/experiments error:', error);

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again.'
      ),
      { status: 500 }
    );
  }
}
