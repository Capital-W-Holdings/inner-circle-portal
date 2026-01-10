/**
 * Database Client
 * Prisma client with connection pooling for serverless environments
 * 
 * NOTE: Run `npx prisma generate` after setting up DATABASE_URL
 * to generate the Prisma client types.
 */

import { features, isDevelopment } from './env';

// ============================================
// Types (Manual definitions until Prisma generates)
// ============================================

// These types mirror the Prisma schema
// They will be replaced by generated types after `prisma generate`

export type PartnerStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type PartnerTier = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type CampaignSource = 'LINKEDIN' | 'TWITTER' | 'FACEBOOK' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'WEBSITE' | 'OTHER';
export type ReferralStatus = 'PENDING' | 'CONVERTED' | 'PAID' | 'CANCELLED' | 'REFUNDED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type MilestoneType = 'FIRST_SHARE' | 'FIRST_CLICK' | 'FIRST_CONVERSION' | 'TENTH_CONVERSION' | 'HUNDRED_CONVERSION' | 'THOUSAND_EARNED' | 'TEN_THOUSAND_EARNED' | 'TIER_UPGRADE';
export type NotificationType = 'CONVERSION' | 'PAYOUT' | 'MILESTONE' | 'CAMPAIGN' | 'SYSTEM' | 'PROMOTION';
export type ExperimentStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export interface Partner {
  id: string;
  email: string;
  name: string;
  referralCode: string;
  status: PartnerStatus;
  tier: PartnerTier;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  emailDigest: boolean;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  partnerId: string;
  name: string;
  source: CampaignSource;
  slug: string;
  isActive: boolean;
  clicks: number;
  conversions: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  id: string;
  partnerId: string;
  campaignId?: string | null;
  status: ReferralStatus;
  customerHash: string;
  commissionCents: number;
  commissionRate: number;
  clickedAt?: Date | null;
  convertedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  payoutId?: string | null;
}

export interface Payout {
  id: string;
  partnerId: string;
  status: PayoutStatus;
  amountCents: number;
  feeCents: number;
  netCents: number;
  paymentMethod?: string | null;
  transactionId?: string | null;
  requestedAt: Date;
  processedAt?: Date | null;
  completedAt?: Date | null;
}

export interface Milestone {
  id: string;
  partnerId: string;
  type: MilestoneType;
  title: string;
  description?: string | null;
  celebrationShown: boolean;
  achievedAt: Date;
}

export interface Notification {
  id: string;
  partnerId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: Date;
  readAt?: Date | null;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string | null;
  status: ExperimentStatus;
  variants: unknown;
  targetRatio: number;
  startedAt?: Date | null;
  endedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperimentResult {
  id: string;
  experimentId: string;
  variant: string;
  impressions: number;
  clicks: number;
  conversions: number;
  recordedAt: Date;
}

// ============================================
// Mock Prisma Client (until database is configured)
// ============================================

interface MockPrismaClient {
  $queryRaw: <T>(query: TemplateStringsArray) => Promise<T>;
  $disconnect: () => Promise<void>;
  $transaction: <T>(fn: (tx: MockPrismaClient) => Promise<T>, options?: { maxWait?: number; timeout?: number }) => Promise<T>;
}

function createMockPrismaClient(): MockPrismaClient {
  return {
    $queryRaw: async <T>(_query: TemplateStringsArray): Promise<T> => {
      throw new Error('Database not configured');
    },
    $disconnect: async () => {
      // No-op
    },
    $transaction: async <T>(fn: (tx: MockPrismaClient) => Promise<T>): Promise<T> => {
      return fn(createMockPrismaClient());
    },
  };
}

// ============================================
// Global Client (Singleton Pattern)
// ============================================

const globalForPrisma = globalThis as unknown as {
  prisma: MockPrismaClient | undefined;
};

/**
 * Get the Prisma client instance
 * Uses singleton pattern to prevent multiple connections in development
 */
export const prisma = globalForPrisma.prisma ?? createMockPrismaClient();

if (isDevelopment()) {
  globalForPrisma.prisma = prisma;
}

// ============================================
// Database Health Check
// ============================================

/**
 * Check database connectivity
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  if (!features.hasDatabase) {
    return {
      connected: false,
      error: 'Database not configured',
    };
  }
  
  const start = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Transaction Helpers
// ============================================

/**
 * Execute a transaction with automatic retry on deadlock
 */
export async function withTransaction<T>(
  fn: (tx: MockPrismaClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        maxWait: 5000, // 5 seconds
        timeout: 10000, // 10 seconds
      });
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a deadlock error (MySQL error code 1213)
      const isDeadlock = 
        error instanceof Error && 
        error.message.includes('deadlock');
      
      if (!isDeadlock || attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 100)
      );
    }
  }
  
  throw lastError;
}

// ============================================
// Query Helpers
// ============================================

/**
 * Paginate query results
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

export function getPaginationParams(params: PaginationParams): {
  skip: number;
  take: number;
} {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

// ============================================
// Cleanup
// ============================================

/**
 * Gracefully disconnect from database
 * Call this when shutting down the application
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await disconnectDatabase();
  });
}
