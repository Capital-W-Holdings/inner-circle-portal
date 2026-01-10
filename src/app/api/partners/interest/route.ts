/**
 * Partner Interest API Endpoint
 * POST /api/partners/interest
 * 
 * Handles partner program interest submissions:
 * - Email capture for waitlist
 * - Instant access with valid invite code
 * - Status tracking
 * 
 * Security: Public endpoint with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import { 
  successResponse, 
  errorResponse, 
  ErrorCodes,
  generateRandomString 
} from '@/lib/utils';

// ============================================
// Types
// ============================================

interface PartnerInterest {
  id: string;
  email: string;
  status: 'WAITLIST' | 'APPROVED' | 'INSTANT_ACCESS';
  inviteCode?: string;
  createdAt: Date;
}

// ============================================
// Validation
// ============================================

const interestSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  inviteCode: z.string().min(4).max(20).optional(),
});

// ============================================
// In-Memory Store (Replace with database)
// ============================================

const interestStore = new Map<string, PartnerInterest>();

// Valid invite codes (in production, this would be in database)
const VALID_INVITE_CODES = new Set([
  'INNER2026',
  'PARTNER100',
  'EARLYBIRD',
  'VIP2026',
  'FOUNDER',
]);

function isValidInviteCode(code: string): boolean {
  return VALID_INVITE_CODES.has(code.toUpperCase());
}

// ============================================
// Handler
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PartnerInterest>>> {
  try {
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
    const validation = interestSchema.safeParse(body);
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

    const { email, inviteCode } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing submission
    const existing = interestStore.get(normalizedEmail);
    if (existing) {
      // If already has instant access or approved, return existing
      if (existing.status !== 'WAITLIST') {
        return NextResponse.json(
          successResponse(existing),
          { status: 200 }
        );
      }
      
      // If on waitlist but now has invite code, upgrade
      if (inviteCode && isValidInviteCode(inviteCode)) {
        existing.status = 'INSTANT_ACCESS';
        existing.inviteCode = inviteCode.toUpperCase();
        interestStore.set(normalizedEmail, existing);
        
        return NextResponse.json(
          successResponse(existing),
          { status: 200 }
        );
      }

      // Return existing waitlist entry
      return NextResponse.json(
        successResponse(existing),
        { status: 200 }
      );
    }

    // Determine status based on invite code
    let status: PartnerInterest['status'] = 'WAITLIST';
    if (inviteCode && isValidInviteCode(inviteCode)) {
      status = 'INSTANT_ACCESS';
    }

    // Create new interest record
    const interest: PartnerInterest = {
      id: `interest_${generateRandomString(12)}`,
      email: normalizedEmail,
      status,
      inviteCode: inviteCode?.toUpperCase(),
      createdAt: new Date(),
    };

    // Store interest
    interestStore.set(normalizedEmail, interest);

    // TODO: Save to database
    // await prisma.partnerInterest.create({ data: interest });

    // TODO: Send confirmation email
    // if (status === 'INSTANT_ACCESS') {
    //   await sendWelcomeEmail(email);
    // } else {
    //   await sendWaitlistEmail(email);
    // }

    return NextResponse.json(
      successResponse(interest),
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/partners/interest error:', error);

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
// GET Handler - Check interest status
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PartnerInterest | null>>> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Email parameter is required'
        ),
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid email format'
        ),
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const interest = interestStore.get(normalizedEmail);

    if (!interest) {
      return NextResponse.json(
        successResponse(null),
        { status: 200 }
      );
    }

    return NextResponse.json(
      successResponse(interest),
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/partners/interest error:', error);

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again.'
      ),
      { status: 500 }
    );
  }
}
