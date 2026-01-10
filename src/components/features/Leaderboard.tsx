'use client';

/**
 * Leaderboard Component
 * 
 * Partner referral leaderboard with:
 * - Monthly/quarterly/all-time views
 * - Opt-in participation
 * - Progress to next rank
 * - Anonymization support
 * 
 * Features:
 * - Tab switching for time periods
 * - Loading skeleton states
 * - Current user highlighting
 * - Progress indicators
 */

import React, { useState, useMemo } from 'react';
import { cn, formatNumber } from '@/lib/utils';
import type { LeaderboardEntry } from '@/hooks';

// ============================================
// Types
// ============================================

type TimePeriod = 'monthly' | 'quarterly' | 'alltime';

interface LeaderboardProps {
  currentPartnerId?: string;
  className?: string;
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  showProgress?: boolean;
  nextRankReferrals?: number;
}

// ============================================
// Constants
// ============================================

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'monthly', label: 'This Month' },
  { value: 'quarterly', label: 'This Quarter' },
  { value: 'alltime', label: 'All Time' },
];

const RANK_BADGES: Record<number, { emoji: string; color: string }> = {
  1: { emoji: '🥇', color: 'text-yellow-500' },
  2: { emoji: '🥈', color: 'text-gray-400' },
  3: { emoji: '🥉', color: 'text-amber-600' },
};

// ============================================
// Mock Data Generator
// ============================================

function generateMockLeaderboard(period: TimePeriod, currentPartnerId?: string): LeaderboardEntry[] {
  const names = [
    'Alex M.', 'Jordan K.', 'Taylor R.', 'Morgan S.', 'Casey P.',
    'Riley B.', 'Quinn D.', 'Avery L.', 'Parker H.', 'Drew N.',
    'Sage W.', 'Blake C.', 'Rowan T.', 'Finley G.', 'Emery J.',
  ];

  const baseReferrals = period === 'monthly' ? 20 : period === 'quarterly' ? 60 : 200;
  
  return names.map((name, i) => {
    const partnerId = `partner-${i + 1}`;
    const isMatch = currentPartnerId === partnerId || (currentPartnerId !== undefined && i === 7);
    return {
      rank: i + 1,
      partnerId,
      displayName: name,
      referrals: Math.max(1, baseReferrals - i * (baseReferrals / 20) + Math.floor(Math.random() * 5)),
      isCurrentUser: isMatch,
    };
  });
}

// ============================================
// Sub-Components
// ============================================

function LeaderboardSkeleton(): React.ReactElement {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="w-24 h-4 bg-gray-200 rounded mb-1" />
            <div className="w-16 h-3 bg-gray-200 rounded" />
          </div>
          <div className="w-12 h-6 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ 
  current, 
  target, 
  label 
}: { 
  current: number; 
  target: number;
  label: string;
}): React.ReactElement {
  const percentage = Math.min(100, (current / target) * 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-700 font-medium">{current} / {target}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function LeaderboardRow({ 
  entry, 
  isCurrentUser,
  showProgress,
  nextRankReferrals,
}: LeaderboardRowProps): React.ReactElement {
  const badge = RANK_BADGES[entry.rank];
  
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-colors',
        isCurrentUser 
          ? 'bg-primary-50 border-2 border-primary-200' 
          : 'hover:bg-gray-50'
      )}
    >
      {/* Rank */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
        badge ? badge.color : 'text-gray-500 bg-gray-100'
      )}>
        {badge ? (
          <span className="text-lg">{badge.emoji}</span>
        ) : (
          entry.rank
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium truncate',
          isCurrentUser ? 'text-primary-700' : 'text-gray-900'
        )}>
          {entry.displayName}
          {isCurrentUser && (
            <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
              You
            </span>
          )}
        </p>
        {showProgress && nextRankReferrals !== undefined && (
          <p className="text-xs text-gray-500">
            {nextRankReferrals - entry.referrals} more to rank up
          </p>
        )}
      </div>

      {/* Referrals */}
      <div className="text-right">
        <p className={cn(
          'font-bold',
          isCurrentUser ? 'text-primary-600' : 'text-gray-900'
        )}>
          {formatNumber(entry.referrals)}
        </p>
        <p className="text-xs text-gray-500">referrals</p>
      </div>
    </div>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <div className="text-center py-8">
      <span className="text-4xl block mb-2">📊</span>
      <p className="text-gray-600 font-medium">No leaderboard data yet</p>
      <p className="text-sm text-gray-500">Start referring to climb the ranks!</p>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function Leaderboard({
  currentPartnerId,
  className,
}: LeaderboardProps): React.ReactElement {
  const [period, setPeriod] = useState<TimePeriod>('monthly');
  const [isOptedIn, setIsOptedIn] = useState(true);

  // In production, this would use the useLeaderboard hook
  // const { entries, status, error, refetch } = useLeaderboard(period);
  
  // For demo, using mock data
  const [status] = useState<'idle' | 'loading' | 'success' | 'error'>('success');
  const entries = useMemo(() => 
    generateMockLeaderboard(period, currentPartnerId),
    [period, currentPartnerId]
  );

  const isLoading = status === 'loading';

  // Find current user's position
  const currentUserEntry = entries.find(e => e.isCurrentUser);
  const currentUserRank = currentUserEntry?.rank ?? null;
  const nextRankEntry = currentUserRank ? entries.find(e => e.rank === currentUserRank - 1) : null;

  // Progress to top 10
  const topTenThreshold = entries[9]?.referrals ?? 0;
  const progressToTopTen = currentUserEntry && currentUserRank && currentUserRank > 10
    ? {
        current: currentUserEntry.referrals,
        target: topTenThreshold,
        remaining: topTenThreshold - currentUserEntry.referrals,
      }
    : null;

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200', className)}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            Partner Leaderboard
          </h2>
          
          {/* Opt-in Toggle */}
          <button
            type="button"
            onClick={() => setIsOptedIn(!isOptedIn)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
              isOptedIn
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            {isOptedIn ? '✓ Participating' : 'Join Leaderboard'}
          </button>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2">
          {TIME_PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                period === p.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current User Summary (if ranked) */}
      {currentUserEntry && currentUserRank && (
        <div className="px-5 py-4 bg-primary-50 border-b border-primary-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-primary-600 font-medium">Your Rank</p>
              <p className="text-3xl font-bold text-primary-700">#{currentUserRank}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-600 font-medium">Your Referrals</p>
              <p className="text-3xl font-bold text-primary-700">
                {formatNumber(currentUserEntry.referrals)}
              </p>
            </div>
          </div>
          
          {/* Progress to next rank */}
          {nextRankEntry && (
            <ProgressBar
              current={currentUserEntry.referrals}
              target={nextRankEntry.referrals}
              label={`${nextRankEntry.referrals - currentUserEntry.referrals} more to reach rank #${nextRankEntry.rank}`}
            />
          )}
          
          {/* Progress to top 10 */}
          {progressToTopTen && (
            <div className="mt-3">
              <ProgressBar
                current={progressToTopTen.current}
                target={progressToTopTen.target}
                label={`${progressToTopTen.remaining} more to reach Top 10`}
              />
            </div>
          )}
        </div>
      )}

      {/* Leaderboard List */}
      <div className="p-4">
        {isLoading && <LeaderboardSkeleton />}
        
        {!isLoading && entries.length === 0 && <EmptyState />}
        
        {!isLoading && entries.length > 0 && (
          <div className="space-y-1">
            {/* Top 10 */}
            {entries.slice(0, 10).map((entry) => (
              <LeaderboardRow
                key={entry.partnerId}
                entry={entry}
                isCurrentUser={entry.isCurrentUser}
                showProgress={entry.isCurrentUser}
                nextRankReferrals={
                  entry.isCurrentUser && entry.rank > 1
                    ? entries.find(e => e.rank === entry.rank - 1)?.referrals
                    : undefined
                }
              />
            ))}
            
            {/* Separator if current user is outside top 10 */}
            {currentUserRank && currentUserRank > 10 && (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">•••</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                
                {/* Current user row */}
                {currentUserEntry && (
                  <LeaderboardRow
                    entry={currentUserEntry}
                    isCurrentUser={true}
                    showProgress={true}
                    nextRankReferrals={nextRankEntry?.referrals}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 rounded-b-2xl border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Rankings update every hour • Only opted-in partners appear
        </p>
      </div>
    </div>
  );
}

export default Leaderboard;
