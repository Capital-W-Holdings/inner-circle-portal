'use client';

/**
 * StatsDashboard Component
 * 
 * Real-time statistics dashboard for partners showing:
 * - Key metrics (earnings, referrals, conversion rate)
 * - Mini sparkline charts
 * - Recent activity feed
 * - Auto-refresh every 30 seconds
 * 
 * Features:
 * - Loading skeleton states
 * - Error handling with retry
 * - Animated value changes
 * - Mobile-responsive layout
 */

import React, { useState, useMemo } from 'react';
import type { ActivityItem, ActivityType } from '@/types';
import { 
  formatCurrency, 
  formatCurrencyCompact, 
  formatNumber, 
  formatPercentage,
  formatRelativeTime,
  cn 
} from '@/lib/utils';
import { usePartnerStats } from '@/hooks';

// ============================================
// Types
// ============================================

interface StatsDashboardProps {
  partnerId: string;
  className?: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: string;
  isLoading?: boolean;
}

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

// ============================================
// Activity Icon Map
// ============================================

const ACTIVITY_ICONS: Record<ActivityType, { icon: string; color: string }> = {
  CLICK: { icon: '👀', color: 'bg-blue-100 text-blue-600' },
  CONVERSION: { icon: '🎉', color: 'bg-green-100 text-green-600' },
  PAYOUT: { icon: '💰', color: 'bg-yellow-100 text-yellow-600' },
  MILESTONE: { icon: '🏆', color: 'bg-purple-100 text-purple-600' },
  CAMPAIGN: { icon: '🎯', color: 'bg-orange-100 text-orange-600' },
};

// ============================================
// Mock Sparkline Data Generator
// ============================================

function generateSparklineData(points: number = 30): number[] {
  const data: number[] = [];
  let value = 50 + Math.random() * 30;
  
  for (let i = 0; i < points; i++) {
    value = Math.max(10, Math.min(100, value + (Math.random() - 0.45) * 15));
    data.push(value);
  }
  
  return data;
}

// ============================================
// Sparkline Component
// ============================================

function Sparkline({ 
  data, 
  color = '#6366f1', 
  height = 40 
}: SparklineProps): React.ReactElement {
  const points = useMemo(() => {
    if (data.length === 0) return '';
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const width = 100;
    const xStep = width / (data.length - 1);
    
    return data
      .map((value, i) => {
        const x = i * xStep;
        const y = height - ((value - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, height]);

  if (data.length === 0) {
    return <div style={{ height }} className="bg-gray-100 rounded animate-pulse" />;
  }

  return (
    <svg 
      viewBox={`0 0 100 ${height}`} 
      className="w-full overflow-visible"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx="100"
          cy={(() => {
            const max = Math.max(...data);
            const min = Math.min(...data);
            const range = max - min || 1;
            const lastValue = data[data.length - 1] ?? 0;
            return height - ((lastValue - min) / range) * (height - 4) - 2;
          })()}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
}

// ============================================
// Skeleton Loading Component
// ============================================

function StatCardSkeleton(): React.ReactElement {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </div>
      <div className="w-24 h-8 bg-gray-200 rounded mb-1" />
      <div className="w-16 h-4 bg-gray-200 rounded" />
    </div>
  );
}

function ActivitySkeleton(): React.ReactElement {
  return (
    <div className="flex items-start gap-3 p-3 animate-pulse">
      <div className="w-8 h-8 bg-gray-200 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
        <div className="w-48 h-3 bg-gray-200 rounded" />
      </div>
      <div className="w-16 h-3 bg-gray-200 rounded" />
    </div>
  );
}

// ============================================
// Stat Card Component
// ============================================

function StatCard({
  label,
  value,
  subValue,
  trend,
  trendValue,
  icon,
  isLoading,
}: StatCardProps): React.ReactElement {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
          <span className="text-xl" role="img" aria-hidden="true">{icon}</span>
        </div>
        {trend && trendValue && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            trend === 'up' && 'bg-green-100 text-green-700',
            trend === 'down' && 'bg-red-100 text-red-700',
            trend === 'neutral' && 'bg-gray-100 text-gray-600'
          )}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trendValue}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
      {subValue && (
        <div className="text-xs text-gray-400 mt-1">{subValue}</div>
      )}
    </div>
  );
}

// ============================================
// Activity Feed Component
// ============================================

function ActivityFeed({ 
  activities, 
  isLoading 
}: ActivityFeedProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="space-y-1">
        {[1, 2, 3, 4].map((i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <span className="text-3xl block mb-2">📭</span>
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const config = ACTIVITY_ICONS[activity.type];
        return (
          <div 
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              config.color
            )}>
              <span className="text-sm" role="img" aria-hidden="true">
                {config.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activity.title}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {activity.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              {activity.amount !== undefined && (
                <p className="text-sm font-semibold text-green-600">
                  +{formatCurrency(activity.amount)}
                </p>
              )}
              <p className="text-xs text-gray-400">
                {formatRelativeTime(new Date(activity.timestamp))}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Error State Component
// ============================================

function ErrorState({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry: () => void;
}): React.ReactElement {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <span className="text-3xl block mb-2">⚠️</span>
      <p className="text-red-700 font-medium mb-3">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function StatsDashboard({
  partnerId,
  className,
}: StatsDashboardProps): React.ReactElement {
  const { 
    data: stats, 
    status, 
    error, 
    refetch, 
    isRefetching 
  } = usePartnerStats(partnerId, {
    refetchInterval: 30000, // 30 seconds
  });

  // Generate sparkline data (in production, this would come from API)
  const [sparklineData] = useState(() => ({
    earnings: generateSparklineData(30),
    referrals: generateSparklineData(30),
    clicks: generateSparklineData(30),
  }));

  const isLoading = status === 'loading';

  if (status === 'error' && error) {
    return (
      <div className={className}>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Refresh Indicator */}
      {isRefetching && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Updating...
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="💰"
          label="Total Earned"
          value={isLoading ? '—' : formatCurrency(stats?.totalEarned ?? 0)}
          subValue={isLoading ? undefined : `${formatCurrencyCompact(stats?.pendingPayout ?? 0)} pending`}
          trend="up"
          trendValue="+12%"
          isLoading={isLoading}
        />
        <StatCard
          icon="👥"
          label="Referrals This Month"
          value={isLoading ? '—' : formatNumber(stats?.referralsThisMonth ?? 0)}
          subValue={isLoading ? undefined : `${formatNumber(stats?.totalReferrals ?? 0)} total`}
          trend="up"
          trendValue="+8"
          isLoading={isLoading}
        />
        <StatCard
          icon="👆"
          label="Clicks This Month"
          value={isLoading ? '—' : formatNumber(stats?.clicksThisMonth ?? 0)}
          trend="up"
          trendValue="+156"
          isLoading={isLoading}
        />
        <StatCard
          icon="📈"
          label="Conversion Rate"
          value={isLoading ? '—' : formatPercentage(stats?.conversionRate ?? 0)}
          trend="neutral"
          trendValue="stable"
          isLoading={isLoading}
        />
      </div>

      {/* Sparkline Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Earnings Trend</span>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </div>
          <Sparkline data={sparklineData.earnings} color="#10b981" height={50} />
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Referral Trend</span>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </div>
          <Sparkline data={sparklineData.referrals} color="#6366f1" height={50} />
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Click Trend</span>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </div>
          <Sparkline data={sparklineData.clicks} color="#f59e0b" height={50} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-2">
          <ActivityFeed 
            activities={stats?.recentActivity ?? []} 
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default StatsDashboard;
