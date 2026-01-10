/**
 * Notifications API Endpoint
 * GET /api/notifications
 * POST /api/notifications/:id/read
 * POST /api/notifications/read-all
 * 
 * Manages partner notifications with:
 * - Listing notifications
 * - Marking as read
 * - Filtering by type
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

type NotificationType = 
  | 'CONVERSION'
  | 'PAYOUT'
  | 'MILESTONE'
  | 'SYSTEM'
  | 'TIP'
  | 'REFERRAL_CLICK';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// Validation
// ============================================

const querySchema = z.object({
  partnerId: z.string().min(1, 'Partner ID is required'),
  type: z.enum(['CONVERSION', 'PAYOUT', 'MILESTONE', 'SYSTEM', 'TIP', 'REFERRAL_CLICK']).optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// ============================================
// In-Memory Store (Replace with database)
// ============================================

const notificationStore = new Map<string, Notification[]>();

// Initialize with mock data for demo
function initializeNotifications(partnerId: string): Notification[] {
  const now = new Date();
  const notifications: Notification[] = [
    {
      id: `notif_${generateRandomString(8)}`,
      type: 'CONVERSION',
      title: 'New Conversion!',
      message: 'John Smith signed up through your referral link',
      read: false,
      createdAt: new Date(now.getTime() - 5 * 60 * 1000),
      actionUrl: '/dashboard/referrals',
    },
    {
      id: `notif_${generateRandomString(8)}`,
      type: 'PAYOUT',
      title: 'Payout Processed',
      message: 'Your monthly payout of $1,245.00 has been sent',
      read: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      actionUrl: '/dashboard/payouts',
    },
    {
      id: `notif_${generateRandomString(8)}`,
      type: 'MILESTONE',
      title: 'Milestone Achieved!',
      message: "You've reached 100 total referrals",
      read: true,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      id: `notif_${generateRandomString(8)}`,
      type: 'TIP',
      title: 'Pro Tip',
      message: 'Share your link on LinkedIn to boost conversions by 40%',
      read: true,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: `notif_${generateRandomString(8)}`,
      type: 'SYSTEM',
      title: 'New Feature Available',
      message: 'Check out our new campaign analytics dashboard',
      read: true,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      actionUrl: '/dashboard/campaigns',
    },
  ];

  notificationStore.set(partnerId, notifications);
  return notifications;
}

function getNotifications(partnerId: string): Notification[] {
  if (!notificationStore.has(partnerId)) {
    return initializeNotifications(partnerId);
  }
  return notificationStore.get(partnerId) ?? [];
}

// ============================================
// GET Handler - List Notifications
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Notification[]>>> {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      partnerId: searchParams.get('partnerId'),
      type: searchParams.get('type') ?? undefined,
      unreadOnly: searchParams.get('unreadOnly') ?? undefined,
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

    const { partnerId, type, unreadOnly, limit } = queryResult.data;

    // TODO: Authenticate request
    // const authResult = await authenticateRequest(request);
    // if (!authResult || authResult.partnerId !== partnerId) {
    //   return NextResponse.json(
    //     errorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'),
    //     { status: 401 }
    //   );
    // }

    // Get notifications
    let notifications = getNotifications(partnerId);

    // Apply filters
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    // Apply limit
    notifications = notifications.slice(0, limit);

    return NextResponse.json(
      successResponse(notifications),
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/notifications error:', error);

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
// POST Handler - Mark as Read / Read All
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const notificationId = searchParams.get('id');
    const readAll = searchParams.get('readAll') === 'true';

    if (!partnerId) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Partner ID is required'),
        { status: 400 }
      );
    }

    const notifications = getNotifications(partnerId);

    if (readAll) {
      // Mark all as read
      notifications.forEach(n => { n.read = true; });
      notificationStore.set(partnerId, notifications);
    } else if (notificationId) {
      // Mark single notification as read
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        notificationStore.set(partnerId, notifications);
      } else {
        return NextResponse.json(
          errorResponse(ErrorCodes.NOT_FOUND, 'Notification not found'),
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Notification ID or readAll flag required'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      successResponse({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/notifications error:', error);

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again.'
      ),
      { status: 500 }
    );
  }
}
