/**
 * Stats Card Component
 * Displays a statistic with trend indicator
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

type TrendDirection = 'up' | 'down' | 'neutral';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  icon?: React.ReactNode;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

// ============================================
// Color Mappings
// ============================================

const colorClasses = {
  default: {
    bg: 'bg-white',
    icon: 'bg-gray-100 text-gray-600',
    value: 'text-gray-900',
  },
  primary: {
    bg: 'bg-white',
    icon: 'bg-primary-100 text-primary-600',
    value: 'text-primary-600',
  },
  success: {
    bg: 'bg-white',
    icon: 'bg-green-100 text-green-600',
    value: 'text-green-600',
  },
  warning: {
    bg: 'bg-white',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-600',
  },
  danger: {
    bg: 'bg-white',
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-600',
  },
};

const trendColors = {
  up: 'text-green-600 bg-green-50',
  down: 'text-red-600 bg-red-50',
  neutral: 'text-gray-600 bg-gray-50',
};

// ============================================
// Trend Icon
// ============================================

function TrendIcon({ direction }: { direction: TrendDirection }): React.ReactElement {
  if (direction === 'up') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    );
  }
  if (direction === 'down') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}

// ============================================
// Loading Skeleton
// ============================================

function StatsSkeleton(): React.ReactElement {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
      <div className="h-8 bg-gray-200 rounded w-32 mb-1" />
      <div className="h-3 bg-gray-200 rounded w-20" />
    </div>
  );
}

// ============================================
// Stats Card Component
// ============================================

export function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'default',
  loading = false,
  className,
  onClick,
}: StatsCardProps): React.ReactElement {
  const colors = colorClasses[color];
  
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-xl p-4 shadow-sm border border-gray-200 text-left',
        colors.bg,
        onClick && 'hover:shadow-md hover:border-primary-200 transition-all cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className
      )}
    >
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title */}
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            
            {/* Value */}
            <p className={cn('text-2xl font-bold', colors.value)}>{value}</p>
            
            {/* Subtitle or Trend */}
            <div className="flex items-center gap-2 mt-1">
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
                    trendColors[trend.direction]
                  )}
                >
                  <TrendIcon direction={trend.direction} />
                  {Math.abs(trend.value)}%
                </span>
              )}
              {(subtitle || trend?.label) && (
                <span className="text-xs text-gray-500">
                  {trend?.label || subtitle}
                </span>
              )}
            </div>
          </div>
          
          {/* Icon */}
          {icon && (
            <div className={cn('p-2 rounded-lg', colors.icon)}>
              {icon}
            </div>
          )}
        </div>
      )}
    </Component>
  );
}

// ============================================
// Stats Grid
// ============================================

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({
  children,
  columns = 4,
  className,
}: StatsGridProps): React.ReactElement {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };
  
  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

// ============================================
// Preset Icons
// ============================================

export const StatsIcons = {
  earnings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  payout: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  referrals: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  clicks: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
    </svg>
  ),
  conversion: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  tier: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
};

export default StatsCard;
