/**
 * Dashboard Data Hooks
 * Custom hooks for fetching and managing dashboard data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse } from '@/types';

// ============================================
// Types
// ============================================

export interface PartnerStats {
  totalEarnings: number;
  pendingPayout: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  currentTier: string;
  commissionRate: number;
}

export interface AnalyticsData {
  daily: Array<{
    date: string;
    clicks: number;
    conversions: number;
    earnings: number;
  }>;
  bySource: Array<{
    source: string;
    clicks: number;
    conversions: number;
  }>;
  topCampaigns: Array<{
    id: string;
    name: string;
    clicks: number;
    conversions: number;
    earnings: number;
  }>;
}

export interface Campaign {
  id: string;
  name: string;
  source: string;
  link: string;
  clicks: number;
  conversions: number;
  earnings: number;
  isActive: boolean;
  createdAt: string;
}

export interface Milestone {
  id: string;
  type: string;
  name: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  completedAt: string | null;
  reward: number | null;
}

export interface PayoutSummary {
  totalPaid: number;
  totalPending: number;
  totalProcessing: number;
  payoutCount: number;
  lastPayoutDate: string | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ============================================
// Generic Fetch Hook
// ============================================

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useFetch<T>(url: string | null, deps: unknown[] = []): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      const result: ApiResponse<T> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...deps]);

  return { data, loading, error, refetch: fetchData };
}

// ============================================
// Partner Stats Hook
// ============================================

export function usePartnerStats(partnerId: string): FetchState<PartnerStats> {
  return useFetch<PartnerStats>(`/api/partners/${partnerId}/stats`);
}

// ============================================
// Analytics Hook
// ============================================

export function useAnalytics(
  partnerId: string,
  options?: { days?: number; groupBy?: 'day' | 'week' | 'month' }
): FetchState<AnalyticsData> {
  const params = new URLSearchParams();
  if (options?.days) params.set('days', String(options.days));
  if (options?.groupBy) params.set('groupBy', options.groupBy);
  
  const queryString = params.toString();
  const url = `/api/partners/${partnerId}/analytics${queryString ? `?${queryString}` : ''}`;
  
  return useFetch<AnalyticsData>(url, [options?.days, options?.groupBy]);
}

// ============================================
// Campaigns Hook
// ============================================

interface CampaignsState extends FetchState<{ campaigns: Campaign[]; total: number }> {
  createCampaign: (data: { name: string; source: string }) => Promise<Campaign | null>;
  deleteCampaign: (id: string) => Promise<boolean>;
}

export function useCampaigns(partnerId: string): CampaignsState {
  const state = useFetch<{ campaigns: Campaign[]; total: number }>(
    `/api/partners/${partnerId}/campaigns`
  );

  const createCampaign = useCallback(async (data: { name: string; source: string }) => {
    try {
      const response = await fetch(`/api/partners/${partnerId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<{ campaign: Campaign }> = await response.json();
      
      if (result.success && result.data) {
        await state.refetch();
        return result.data.campaign;
      }
      return null;
    } catch {
      return null;
    }
  }, [partnerId, state]);

  const deleteCampaign = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/partners/${partnerId}/campaigns?id=${id}`, {
        method: 'DELETE',
      });
      const result: ApiResponse<{ success: boolean }> = await response.json();
      
      if (result.success) {
        await state.refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [partnerId, state]);

  return { ...state, createCampaign, deleteCampaign };
}

// ============================================
// Milestones Hook
// ============================================

export function useMilestones(partnerId: string): FetchState<{ milestones: Milestone[] }> {
  return useFetch<{ milestones: Milestone[] }>(`/api/partners/${partnerId}/milestones`);
}

// ============================================
// Payouts Hook
// ============================================

interface PayoutsState extends FetchState<PayoutSummary> {
  requestPayout: (amount: number) => Promise<boolean>;
}

export function usePayouts(partnerId: string): PayoutsState {
  const state = useFetch<PayoutSummary>(`/api/payments/payout?partnerId=${partnerId}`);

  const requestPayout = useCallback(async (amountCents: number) => {
    try {
      const response = await fetch('/api/payments/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, amountCents }),
      });
      const result: ApiResponse<{ success: boolean }> = await response.json();
      
      if (result.success) {
        await state.refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [partnerId, state]);

  return { ...state, requestPayout };
}

// ============================================
// Notifications Hook
// ============================================

interface NotificationsState extends FetchState<{ notifications: Notification[]; unreadCount: number }> {
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
}

export function useNotifications(partnerId: string): NotificationsState {
  const state = useFetch<{ notifications: Notification[]; unreadCount: number }>(
    `/api/notifications?partnerId=${partnerId}`
  );

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, notificationId: id }),
      });
      const result: ApiResponse<{ success: boolean }> = await response.json();
      
      if (result.success) {
        await state.refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [partnerId, state]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, markAllRead: true }),
      });
      const result: ApiResponse<{ success: boolean }> = await response.json();
      
      if (result.success) {
        await state.refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [partnerId, state]);

  return { ...state, markAsRead, markAllAsRead };
}

// ============================================
// Leaderboard Hook
// ============================================

interface LeaderboardEntry {
  rank: number;
  partnerId: string;
  name: string;
  tier: string;
  totalEarnings: number;
  conversions: number;
  isCurrentUser?: boolean;
}

export function useLeaderboard(
  partnerId?: string,
  options?: { period?: 'week' | 'month' | 'all'; limit?: number }
): FetchState<{ leaderboard: LeaderboardEntry[]; userRank?: LeaderboardEntry }> {
  const params = new URLSearchParams();
  if (partnerId) params.set('partnerId', partnerId);
  if (options?.period) params.set('period', options.period);
  if (options?.limit) params.set('limit', String(options.limit));
  
  const queryString = params.toString();
  const url = `/api/leaderboard${queryString ? `?${queryString}` : ''}`;
  
  return useFetch<{ leaderboard: LeaderboardEntry[]; userRank?: LeaderboardEntry }>(
    url,
    [options?.period, options?.limit]
  );
}
