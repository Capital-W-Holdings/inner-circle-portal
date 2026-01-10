/**
 * Inner Circle Partners Portal - Type Definitions
 * TypeScript strict mode enabled
 */

// ============================================
// User Types
// ============================================

export type UserRole = 'PARTNER' | 'ADMIN' | 'SUPER_ADMIN';

// ============================================
// Partner Types
// ============================================

export interface Partner {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  status: PartnerStatus;
  tier: PartnerTier;
  createdAt: Date;
  updatedAt: Date;
}

export type PartnerStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type PartnerTier = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// ============================================
// Stats Types
// ============================================

export interface PartnerStats {
  totalEarned: number;
  pendingPayout: number;
  totalReferrals: number;
  referralsThisMonth: number;
  clicksThisMonth: number;
  conversionRate: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  amount?: number;
  timestamp: Date;
}

export type ActivityType = 
  | 'CLICK' 
  | 'CONVERSION' 
  | 'PAYOUT' 
  | 'MILESTONE' 
  | 'CAMPAIGN';

// ============================================
// Campaign Types
// ============================================

export interface Campaign {
  id: string;
  partnerId: string;
  name: string;
  source: CampaignSource;
  link: string;
  clicks: number;
  conversions: number;
  revenue: number;
  createdAt: Date;
  isActive: boolean;
}

export type CampaignSource = 
  | 'LINKEDIN' 
  | 'TWITTER' 
  | 'FACEBOOK' 
  | 'EMAIL' 
  | 'SMS' 
  | 'WHATSAPP'
  | 'WEBSITE'
  | 'OTHER';

export interface CreateCampaignRequest {
  name: string;
  source: CampaignSource;
}

export interface CreateCampaignResponse {
  success: boolean;
  campaign?: Campaign;
  error?: ApiError;
}

// ============================================
// Milestone Types
// ============================================

export interface Milestone {
  id: string;
  partnerId: string;
  type: MilestoneType;
  title: string;
  description: string;
  achievedAt: Date;
  celebrationShown: boolean;
}

export type MilestoneType =
  | 'FIRST_SHARE'
  | 'FIRST_CLICK'
  | 'FIRST_CONVERSION'
  | 'TENTH_CONVERSION'
  | 'HUNDRED_CONVERSION'
  | 'THOUSAND_EARNED'
  | 'TEN_THOUSAND_EARNED'
  | 'TIER_UPGRADE';

export interface MilestoneCheck {
  newMilestones: Milestone[];
  celebrationConfig?: CelebrationConfig;
}

export interface CelebrationConfig {
  type: 'confetti' | 'fireworks' | 'stars';
  duration: number;
  message: string;
  emoji: string;
}

// ============================================
// Share Types
// ============================================

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

export interface ShareTemplate {
  id: string;
  name: string;
  platform: SharePlatform;
  message: string;
}

export type SharePlatform = 
  | 'native' 
  | 'twitter' 
  | 'linkedin' 
  | 'facebook' 
  | 'email' 
  | 'sms' 
  | 'whatsapp'
  | 'copy';

export interface ShareResult {
  success: boolean;
  platform: SharePlatform;
  timestamp: Date;
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

// ============================================
// Component State Types
// ============================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}

// ============================================
// Validation Schemas (Zod-compatible)
// ============================================

export const CAMPAIGN_NAME_MIN_LENGTH = 3;
export const CAMPAIGN_NAME_MAX_LENGTH = 50;
export const REFERRAL_CODE_LENGTH = 8;

// ============================================
// Constants
// ============================================

export const MILESTONE_CONFIGS: Record<MilestoneType, CelebrationConfig> = {
  FIRST_SHARE: {
    type: 'confetti',
    duration: 3000,
    message: "You're live! Your first share is out there!",
    emoji: '🚀',
  },
  FIRST_CLICK: {
    type: 'stars',
    duration: 2000,
    message: 'Someone clicked your link!',
    emoji: '👀',
  },
  FIRST_CONVERSION: {
    type: 'fireworks',
    duration: 5000,
    message: 'Your first commission! This is just the beginning!',
    emoji: '🎉',
  },
  TENTH_CONVERSION: {
    type: 'fireworks',
    duration: 4000,
    message: '10 conversions! You\'re on fire!',
    emoji: '🔥',
  },
  HUNDRED_CONVERSION: {
    type: 'fireworks',
    duration: 6000,
    message: '100 conversions! You\'re a referral legend!',
    emoji: '🏆',
  },
  THOUSAND_EARNED: {
    type: 'confetti',
    duration: 5000,
    message: 'You\'ve earned $1,000! Keep it going!',
    emoji: '💰',
  },
  TEN_THOUSAND_EARNED: {
    type: 'fireworks',
    duration: 6000,
    message: '$10,000 earned! You\'re in the big leagues!',
    emoji: '💎',
  },
  TIER_UPGRADE: {
    type: 'confetti',
    duration: 4000,
    message: 'Tier upgrade! Better commissions await!',
    emoji: '⭐',
  },
};

export const SHARE_TEMPLATES: ShareTemplate[] = [
  {
    id: 'professional',
    name: 'Professional',
    platform: 'linkedin',
    message: "I've been working with Inner Circle and the results have been incredible. If you're looking for a trusted partner, use my link for priority onboarding: {link}",
  },
  {
    id: 'casual',
    name: 'Casual',
    platform: 'twitter',
    message: "Just got another commission from @InnerCircle! 🎉 If you want in, here's my link: {link}",
  },
  {
    id: 'direct',
    name: 'Direct Outreach',
    platform: 'email',
    message: "Hi! I wanted to share something that's been working great for me. Inner Circle has an amazing program - use my link to get started: {link}",
  },
];

export const CAMPAIGN_SOURCES: { value: CampaignSource; label: string; icon: string }[] = [
  { value: 'LINKEDIN', label: 'LinkedIn', icon: '💼' },
  { value: 'TWITTER', label: 'X (Twitter)', icon: '🐦' },
  { value: 'FACEBOOK', label: 'Facebook', icon: '📘' },
  { value: 'EMAIL', label: 'Email', icon: '✉️' },
  { value: 'SMS', label: 'SMS', icon: '📱' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
  { value: 'WEBSITE', label: 'Website', icon: '🌐' },
  { value: 'OTHER', label: 'Other', icon: '📌' },
];
