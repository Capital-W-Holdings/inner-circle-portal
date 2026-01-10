/**
 * Admin Bulk Operations API Endpoint
 * POST /api/admin/bulk
 * 
 * Perform bulk actions on partners and payouts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse, PartnerStatus, PartnerTier } from '@/types';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils';
import { getAuthUser, isAuthError } from '@/lib/auth';
import { features } from '@/lib/env';
import { getPartnerRepository, getPayoutRepository } from '@/lib/repositories';
import { logger } from '@/lib/monitoring';

// ============================================
// Validation
// ============================================

const bulkActionSchema = z.object({
  action: z.enum([
    'approve_partners',
    'suspend_partners',
    'activate_partners',
    'upgrade_partners',
    'downgrade_partners',
    'approve_payouts',
    'reject_payouts',
    'export_partners',
    'export_payouts',
  ]),
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
  tier: z.enum(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
});

// ============================================
// Types
// ============================================

interface BulkResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// ============================================
// Handler
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BulkResult>>> {
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

      // Admin role check
      if (authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required'),
          { status: 403 }
        );
      }
    }

    // Parse body
    const body = await request.json();
    const validation = bulkActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid bulk action request',
          { errors: validation.error.flatten().fieldErrors }
        ),
        { status: 400 }
      );
    }

    const { action, ids, tier } = validation.data;
    const result: BulkResult = {
      total: ids.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Get repositories
    const partnerRepo = getPartnerRepository();
    const payoutRepo = getPayoutRepository();

    // Process based on action type
    if (action.includes('partners')) {
      // Partner bulk actions
      let newStatus: PartnerStatus | undefined;
      let newTier: PartnerTier | undefined;

      switch (action) {
        case 'approve_partners':
          newStatus = 'ACTIVE';
          break;
        case 'suspend_partners':
          newStatus = 'SUSPENDED';
          break;
        case 'activate_partners':
          newStatus = 'ACTIVE';
          break;
        case 'upgrade_partners':
        case 'downgrade_partners':
          if (!tier) {
            return NextResponse.json(
              errorResponse(ErrorCodes.VALIDATION_ERROR, 'Tier is required for upgrade/downgrade'),
              { status: 400 }
            );
          }
          newTier = tier as PartnerTier;
          break;
      }

      // Process each partner
      for (const id of ids) {
        try {
          const partner = await partnerRepo.findById(id);
          
          if (!partner) {
            result.failed++;
            result.errors.push({ id, error: 'Partner not found' });
            continue;
          }

          // Validate action is applicable
          if (action === 'approve_partners' && partner.status !== 'PENDING') {
            result.failed++;
            result.errors.push({ id, error: 'Partner is not pending' });
            continue;
          }

          if (action === 'suspend_partners' && partner.status === 'SUSPENDED') {
            result.failed++;
            result.errors.push({ id, error: 'Partner is already suspended' });
            continue;
          }

          // Update partner
          const updateData: { status?: PartnerStatus; tier?: PartnerTier } = {};
          if (newStatus) updateData.status = newStatus;
          if (newTier) updateData.tier = newTier;

          if (Object.keys(updateData).length > 0) {
            await partnerRepo.update(id, updateData);
          }

          result.successful++;
        } catch (err) {
          result.failed++;
          result.errors.push({ 
            id, 
            error: err instanceof Error ? err.message : 'Unknown error' 
          });
        }
      }
    } else if (action.includes('payouts')) {
      // Payout bulk actions
      let newStatus: 'COMPLETED' | 'FAILED' | undefined;

      switch (action) {
        case 'approve_payouts':
          newStatus = 'COMPLETED';
          break;
        case 'reject_payouts':
          newStatus = 'FAILED';
          break;
      }

      // Process each payout
      for (const id of ids) {
        try {
          const payout = await payoutRepo.findById(id);
          
          if (!payout) {
            result.failed++;
            result.errors.push({ id, error: 'Payout not found' });
            continue;
          }

          // Only process pending payouts
          if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
            result.failed++;
            result.errors.push({ id, error: `Payout is ${payout.status.toLowerCase()}` });
            continue;
          }

          // Update payout
          if (newStatus) {
            await payoutRepo.update(id, { 
              status: newStatus,
              processedAt: new Date(),
            });
          }

          result.successful++;
        } catch (err) {
          result.failed++;
          result.errors.push({ 
            id, 
            error: err instanceof Error ? err.message : 'Unknown error' 
          });
        }
      }
    }

    logger.info('[AdminBulk] Bulk action completed', {
      action,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
    });

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, error.message),
        { status: error.statusCode }
      );
    }

    logger.error('[AdminBulk] Error', error);

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
