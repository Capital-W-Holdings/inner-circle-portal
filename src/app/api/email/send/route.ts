/**
 * Email API Endpoint
 * POST /api/email/send
 * 
 * Sends transactional emails to partners.
 * Requires authentication and appropriate permissions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getAuthUser, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import {
  sendWelcomeEmail,
  sendConversionEmail,
  sendPayoutEmail,
  sendWeeklyDigest,
  getEmailServiceStatus,
} from '@/lib/email-service';
import { getPartnerRepository } from '@/lib/repositories';
import { logger } from '@/lib/monitoring';

// ============================================
// Types
// ============================================

interface SendEmailResponse {
  success: boolean;
  emailId?: string;
  error?: string;
}

// ============================================
// Validation
// ============================================

const baseSchema = z.object({
  type: z.enum(['welcome', 'conversion', 'payout', 'digest', 'test']),
  partnerId: z.string().min(1, 'Partner ID is required'),
});

const conversionSchema = baseSchema.extend({
  type: z.literal('conversion'),
  campaignName: z.string().optional(),
  commissionAmount: z.number().int().positive(),
  totalEarnings: z.number().int().min(0),
  totalConversions: z.number().int().min(0),
});

const payoutSchema = baseSchema.extend({
  type: z.literal('payout'),
  payoutAmount: z.number().int().positive(),
  payoutFee: z.number().int().min(0),
  netAmount: z.number().int().positive(),
  status: z.enum(['processing', 'completed', 'failed']),
  payoutMethod: z.string().min(1),
  transactionId: z.string().optional(),
  failureReason: z.string().optional(),
});

const digestSchema = baseSchema.extend({
  type: z.literal('digest'),
  weekStartDate: z.string().datetime(),
  weekEndDate: z.string().datetime(),
  clicksThisWeek: z.number().int().min(0),
  conversionsThisWeek: z.number().int().min(0),
  earningsThisWeek: z.number().int().min(0),
  clicksLastWeek: z.number().int().min(0),
  conversionsLastWeek: z.number().int().min(0),
  earningsLastWeek: z.number().int().min(0),
  totalEarnings: z.number().int().min(0),
  pendingPayout: z.number().int().min(0),
  topCampaigns: z.array(z.object({
    name: z.string(),
    clicks: z.number().int().min(0),
    conversions: z.number().int().min(0),
    earnings: z.number().int().min(0),
  })).default([]),
  leaderboardPosition: z.number().int().positive().optional(),
  leaderboardTotal: z.number().int().positive().optional(),
});

// ============================================
// Handler
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SendEmailResponse>>> {
  try {
    // Authentication check (require admin or system role in production)
    if (features.hasAuth) {
      const authResult = await getAuthUser();
      
      if (!authResult.authenticated) {
        return NextResponse.json(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required'),
          { status: 401 }
        );
      }
      
      // In production, you'd check for admin role here
      // For now, any authenticated user can send emails
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate base schema first to get the type
    const baseValidation = baseSchema.safeParse(body);
    if (!baseValidation.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request',
          { errors: baseValidation.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }
    
    const { type, partnerId } = baseValidation.data;
    
    // Get partner from repository
    const partnerRepo = getPartnerRepository();
    const partner = await partnerRepo.findById(partnerId);
    
    if (!partner) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'Partner not found'),
        { status: 404 }
      );
    }
    
    // Handle each email type
    let result;
    
    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail({ partner });
        break;
        
      case 'conversion': {
        const validation = conversionSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            errorResponse(
              ErrorCodes.VALIDATION_ERROR,
              'Invalid conversion email parameters',
              { errors: validation.error.flatten().fieldErrors }
            ),
            { status: 400 }
          );
        }
        
        result = await sendConversionEmail({
          partner,
          campaignName: validation.data.campaignName,
          commissionAmount: validation.data.commissionAmount,
          totalEarnings: validation.data.totalEarnings,
          totalConversions: validation.data.totalConversions,
        });
        break;
      }
        
      case 'payout': {
        const validation = payoutSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            errorResponse(
              ErrorCodes.VALIDATION_ERROR,
              'Invalid payout email parameters',
              { errors: validation.error.flatten().fieldErrors }
            ),
            { status: 400 }
          );
        }
        
        result = await sendPayoutEmail({
          partner,
          payoutAmount: validation.data.payoutAmount,
          payoutFee: validation.data.payoutFee,
          netAmount: validation.data.netAmount,
          status: validation.data.status,
          payoutMethod: validation.data.payoutMethod,
          transactionId: validation.data.transactionId,
          failureReason: validation.data.failureReason,
        });
        break;
      }
        
      case 'digest': {
        const validation = digestSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            errorResponse(
              ErrorCodes.VALIDATION_ERROR,
              'Invalid digest email parameters',
              { errors: validation.error.flatten().fieldErrors }
            ),
            { status: 400 }
          );
        }
        
        result = await sendWeeklyDigest({
          partner,
          weekStartDate: new Date(validation.data.weekStartDate),
          weekEndDate: new Date(validation.data.weekEndDate),
          clicksThisWeek: validation.data.clicksThisWeek,
          conversionsThisWeek: validation.data.conversionsThisWeek,
          earningsThisWeek: validation.data.earningsThisWeek,
          clicksLastWeek: validation.data.clicksLastWeek,
          conversionsLastWeek: validation.data.conversionsLastWeek,
          earningsLastWeek: validation.data.earningsLastWeek,
          totalEarnings: validation.data.totalEarnings,
          pendingPayout: validation.data.pendingPayout,
          topCampaigns: validation.data.topCampaigns,
          leaderboardPosition: validation.data.leaderboardPosition,
          leaderboardTotal: validation.data.leaderboardTotal,
        });
        break;
      }
        
      case 'test':
        // Send a simple welcome email as a test
        result = await sendWelcomeEmail({ partner });
        break;
        
      default:
        return NextResponse.json(
          errorResponse(ErrorCodes.VALIDATION_ERROR, `Unknown email type: ${type}`),
          { status: 400 }
        );
    }
    
    if (!result.success) {
      logger.error('[EmailAPI] Send failed', new Error(result.error || 'Unknown error'), {
        type,
        partnerId,
      });
      
      return NextResponse.json(
        errorResponse(ErrorCodes.INTERNAL_ERROR, result.error || 'Failed to send email'),
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      successResponse({
        success: true,
        emailId: result.id,
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
    
    logger.error('[EmailAPI] Exception', error);
    
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

// ============================================
// GET - Email Service Status
// ============================================

export async function GET(): Promise<NextResponse<ApiResponse<{
  configured: boolean;
  provider: string;
}>>> {
  const status = getEmailServiceStatus();
  
  return NextResponse.json(
    successResponse(status),
    { status: 200 }
  );
}
