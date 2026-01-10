'use client';

/**
 * Custom Hooks for Data Fetching
 * 
 * Provides type-safe data fetching with:
 * - Loading states
 * - Error handling
 * - Auto-refresh capability
 * - Optimistic updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  PartnerStats, 
  Campaign, 
  Milestone,
  ApiResponse,
  PaginatedResponse,
  AsyncState
} from '@/types';

// ============================================
// Generic Fetch Hook
// ============================================

interface UseFetchOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

interface UseFetchResult<T> extends AsyncState<T> {
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

export function useFetch<T>(
  url: string | null,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const { 
    enabled = true, 
    refetchInterval, 
    onSuccess, 
    onError 
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    status: 'idle',
    error: null,
  });
  const [isRefetching, setIsRefetching] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!url) return;

    if (isRefetch) {
      setIsRefetching(true);
    } else {
      setState(prev => ({ ...prev, status: 'loading', error: null }));
    }

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: ApiResponse<T> = await response.json();

      if (!json.success) {
        throw new Error(json.error?.message ?? 'Request failed');
      }

      setState({
        data: json.data ?? null,
        status: 'success',
        error: null,
      });

      onSuccess?.(json.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
      onError?.(error);
    } finally {
      setIsRefetching(false);
    }
  }, [url, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    if (enabled && url) {
      void fetchData();
    }
  }, [enabled, url, fetchData]);

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled && url) {
      intervalRef.current = setInterval(() => {
        void fetchData(true);
      }, refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetchInterval, enabled, url, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    ...state,
    refetch,
    isRefetching,
  };
}

// ============================================
// Partner Stats Hook
// ============================================

interface UsePartnerStatsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function usePartnerStats(
  partnerId: string | null,
  options: UsePartnerStatsOptions = {}
): UseFetchResult<PartnerStats> {
  const url = partnerId ? `/api/partners/${partnerId}/stats` : null;
  return useFetch<PartnerStats>(url, {
    ...options,
    refetchInterval: options.refetchInterval ?? 30000, // 30s default
  });
}

// ============================================
// Campaigns Hook
// ============================================

interface UseCampaignsResult extends Omit<UseFetchResult<Campaign[]>, 'data'> {
  campaigns: Campaign[];
  createCampaign: (name: string, source: string) => Promise<Campaign | null>;
  isCreating: boolean;
}

export function useCampaigns(
  partnerId: string | null,
  options: UseFetchOptions = {}
): UseCampaignsResult {
  const url = partnerId ? `/api/partners/${partnerId}/campaigns` : null;
  const result = useFetch<PaginatedResponse<Campaign>>(url, options);
  const [isCreating, setIsCreating] = useState(false);

  // Extract campaigns from paginated response
  const campaigns = (result.data as unknown as PaginatedResponse<Campaign>)?.data ?? [];

  const createCampaign = useCallback(async (
    name: string, 
    source: string
  ): Promise<Campaign | null> => {
    if (!partnerId) return null;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/partners/${partnerId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, source }),
      });

      const json: ApiResponse<Campaign> = await response.json();

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Failed to create campaign');
      }

      // Trigger refetch to get updated list
      await result.refetch();

      return json.data;
    } catch (err) {
      console.error('Failed to create campaign:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [partnerId, result]);

  return {
    status: result.status,
    error: result.error,
    refetch: result.refetch,
    isRefetching: result.isRefetching,
    campaigns,
    createCampaign,
    isCreating,
  };
}

// ============================================
// Milestones Hook
// ============================================

interface UseMilestonesResult extends Omit<UseFetchResult<Milestone[]>, 'data'> {
  milestones: Milestone[];
  checkMilestones: () => Promise<Milestone[]>;
  isChecking: boolean;
}

export function useMilestones(
  partnerId: string | null,
  options: UseFetchOptions = {}
): UseMilestonesResult {
  const url = partnerId ? `/api/partners/${partnerId}/milestones` : null;
  const result = useFetch<PaginatedResponse<Milestone>>(url, options);
  const [isChecking, setIsChecking] = useState(false);

  const milestones = (result.data as unknown as PaginatedResponse<Milestone>)?.data ?? [];

  const checkMilestones = useCallback(async (): Promise<Milestone[]> => {
    if (!partnerId) return [];

    setIsChecking(true);
    try {
      const response = await fetch(`/api/partners/${partnerId}/milestones`, {
        method: 'POST',
      });

      const json: ApiResponse<{ newMilestones: Milestone[] }> = await response.json();

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Failed to check milestones');
      }

      // Trigger refetch
      await result.refetch();

      return json.data.newMilestones;
    } catch (err) {
      console.error('Failed to check milestones:', err);
      return [];
    } finally {
      setIsChecking(false);
    }
  }, [partnerId, result]);

  return {
    status: result.status,
    error: result.error,
    refetch: result.refetch,
    isRefetching: result.isRefetching,
    milestones,
    checkMilestones,
    isChecking,
  };
}

// ============================================
// Leaderboard Hook
// ============================================

export interface LeaderboardEntry {
  rank: number;
  partnerId: string;
  displayName: string;
  referrals: number;
  isCurrentUser: boolean;
}

interface UseLeaderboardResult extends UseFetchResult<LeaderboardEntry[]> {
  entries: LeaderboardEntry[];
}

export function useLeaderboard(
  period: 'monthly' | 'quarterly' | 'alltime' = 'monthly',
  options: UseFetchOptions = {}
): UseLeaderboardResult {
  const url = `/api/leaderboard?period=${period}`;
  const result = useFetch<LeaderboardEntry[]>(url, options);

  return {
    ...result,
    entries: result.data ?? [],
  };
}

// ============================================
// Partner Interest Hook (Onboarding)
// ============================================

export interface PartnerInterest {
  id: string;
  email: string;
  status: 'WAITLIST' | 'APPROVED' | 'INSTANT_ACCESS';
  inviteCode?: string;
  createdAt: Date;
}

interface UsePartnerInterestResult {
  submitInterest: (email: string, inviteCode?: string) => Promise<PartnerInterest | null>;
  isSubmitting: boolean;
  error: string | null;
}

export function usePartnerInterest(): UsePartnerInterestResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitInterest = useCallback(async (
    email: string,
    inviteCode?: string
  ): Promise<PartnerInterest | null> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/partners/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, inviteCode }),
      });

      const json: ApiResponse<PartnerInterest> = await response.json();

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Failed to submit interest');
      }

      return json.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    submitInterest,
    isSubmitting,
    error,
  };
}

// ============================================
// Re-export dashboard data hooks
// ============================================

export * from './useDashboardData';
