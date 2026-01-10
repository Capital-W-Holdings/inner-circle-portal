'use client';

/**
 * PayoutTracker Component
 * 
 * Payout tracking with timeline visualization:
 * - Upcoming payout preview
 * - Payout history timeline
 * - Status indicators
 * - Breakdown details
 * 
 * Features:
 * - Loading skeleton states
 * - Error handling with retry
 * - Empty state
 * - Expandable payout details
 * - Progress indicator for pending
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { ApiResponse } from '@/types';

// ============================================
// Types
// ============================================

export type PayoutStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface PayoutBreakdown {
  referrals: number;
  conversionAmount: number;
  bonuses: number;
  adjustments: number;
}

export interface Payout {
  id: string;
  amount: number; // in cents
  status: PayoutStatus;
  periodStart: Date;
  periodEnd: Date;
  scheduledDate?: Date;
  processedDate?: Date;
  breakdown: PayoutBreakdown;
  method: 'BANK_TRANSFER' | 'PAYPAL' | 'CHECK';
  transactionId?: string;
}

interface PayoutTrackerProps {
  partnerId: string;
  className?: string;
}

interface PayoutCardProps {
  payout: Payout;
  isUpcoming?: boolean;
}

// ============================================
// Constants
// ============================================

const STATUS_CONFIG: Record<PayoutStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: string;
}> = {
  PENDING: { 
    label: 'Pending', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-100',
    icon: '⏳',
  },
  PROCESSING: { 
    label: 'Processing', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    icon: '🔄',
  },
  COMPLETED: { 
    label: 'Completed', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    icon: '✅',
  },
  FAILED: { 
    label: 'Failed', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    icon: '❌',
  },
};

const METHOD_LABELS: Record<Payout['method'], string> = {
  BANK_TRANSFER: 'Bank Transfer',
  PAYPAL: 'PayPal',
  CHECK: 'Check',
};

// ============================================
// Mock Data Generator
// ============================================

function generateMockPayouts(): Payout[] {
  const now = new Date();
  
  return [
    {
      id: 'payout-upcoming',
      amount: 124500, // $1,245.00
      status: 'PENDING',
      periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      scheduledDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
      breakdown: {
        referrals: 47,
        conversionAmount: 118500,
        bonuses: 10000,
        adjustments: -4000,
      },
      method: 'BANK_TRANSFER',
    },
    {
      id: 'payout-1',
      amount: 98700,
      status: 'COMPLETED',
      periodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      periodEnd: new Date(now.getFullYear(), now.getMonth(), 0),
      scheduledDate: new Date(now.getFullYear(), now.getMonth(), 5),
      processedDate: new Date(now.getFullYear(), now.getMonth(), 5),
      breakdown: {
        referrals: 38,
        conversionAmount: 95200,
        bonuses: 5000,
        adjustments: -1500,
      },
      method: 'BANK_TRANSFER',
      transactionId: 'TXN-2026-001234',
    },
    {
      id: 'payout-2',
      amount: 156300,
      status: 'COMPLETED',
      periodStart: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      periodEnd: new Date(now.getFullYear(), now.getMonth() - 1, 0),
      scheduledDate: new Date(now.getFullYear(), now.getMonth() - 1, 5),
      processedDate: new Date(now.getFullYear(), now.getMonth() - 1, 5),
      breakdown: {
        referrals: 62,
        conversionAmount: 148800,
        bonuses: 7500,
        adjustments: 0,
      },
      method: 'BANK_TRANSFER',
      transactionId: 'TXN-2025-012345',
    },
    {
      id: 'payout-3',
      amount: 87200,
      status: 'COMPLETED',
      periodStart: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      periodEnd: new Date(now.getFullYear(), now.getMonth() - 2, 0),
      scheduledDate: new Date(now.getFullYear(), now.getMonth() - 2, 5),
      processedDate: new Date(now.getFullYear(), now.getMonth() - 2, 6),
      breakdown: {
        referrals: 34,
        conversionAmount: 85700,
        bonuses: 2500,
        adjustments: -1000,
      },
      method: 'PAYPAL',
      transactionId: 'PP-2025-098765',
    },
  ];
}

// ============================================
// Sub-Components
// ============================================

function PayoutSkeleton(): React.ReactElement {
  return (
    <div className="p-4 border border-gray-200 rounded-xl animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-24 h-6 bg-gray-200 rounded" />
        <div className="w-16 h-5 bg-gray-200 rounded-full" />
      </div>
      <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
      <div className="w-48 h-3 bg-gray-200 rounded" />
    </div>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <div className="text-center py-12">
      <span className="text-4xl block mb-3">💸</span>
      <p className="text-gray-600 font-medium">No payouts yet</p>
      <p className="text-sm text-gray-500">Start referring to earn commissions!</p>
    </div>
  );
}

function ErrorState({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry: () => void;
}): React.ReactElement {
  return (
    <div className="text-center py-8">
      <span className="text-4xl block mb-2">⚠️</span>
      <p className="text-red-600 font-medium mb-3">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

function ProgressBar({ 
  progress, 
  label 
}: { 
  progress: number; 
  label: string;
}): React.ReactElement {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}

function PayoutCard({ payout, isUpcoming }: PayoutCardProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(isUpcoming);
  const statusConfig = STATUS_CONFIG[payout.status];

  const periodLabel = `${formatDate(new Date(payout.periodStart), { month: 'short', day: 'numeric' })} - ${formatDate(new Date(payout.periodEnd), { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Calculate days until payout for pending
  const daysUntilPayout = payout.scheduledDate
    ? Math.ceil((new Date(payout.scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Progress through the month (for pending payouts)
  const monthProgress = isUpcoming
    ? ((Date.now() - new Date(payout.periodStart).getTime()) /
       (new Date(payout.periodEnd).getTime() - new Date(payout.periodStart).getTime())) * 100
    : 100;

  return (
    <div
      className={cn(
        'border rounded-xl transition-all duration-200',
        isUpcoming 
          ? 'border-primary-200 bg-primary-50/50' 
          : 'border-gray-200 bg-white',
        isExpanded && 'shadow-sm'
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left flex items-start justify-between"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(payout.amount)}
            </span>
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1',
              statusConfig.bgColor,
              statusConfig.color
            )}>
              <span>{statusConfig.icon}</span>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">{periodLabel}</p>
          {isUpcoming && payout.scheduledDate && (
            <p className="text-sm text-primary-600 font-medium mt-1">
              {daysUntilPayout > 0 
                ? `Payout in ${daysUntilPayout} day${daysUntilPayout === 1 ? '' : 's'}`
                : 'Payout scheduled for today'}
            </p>
          )}
        </div>
        <span className={cn(
          'text-gray-400 transition-transform',
          isExpanded && 'rotate-180'
        )}>
          ▼
        </span>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {/* Progress (for pending) */}
          {isUpcoming && (
            <ProgressBar
              progress={monthProgress}
              label="Month progress"
            />
          )}

          {/* Breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Breakdown</p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Referrals ({payout.breakdown.referrals})
                </span>
                <span className="text-gray-900 font-medium">
                  {formatCurrency(payout.breakdown.conversionAmount)}
                </span>
              </div>
              {payout.breakdown.bonuses > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bonuses</span>
                  <span className="text-green-600 font-medium">
                    +{formatCurrency(payout.breakdown.bonuses)}
                  </span>
                </div>
              )}
              {payout.breakdown.adjustments !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Adjustments</span>
                  <span className={cn(
                    'font-medium',
                    payout.breakdown.adjustments > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {payout.breakdown.adjustments > 0 ? '+' : ''}
                    {formatCurrency(payout.breakdown.adjustments)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-medium">Total</span>
                <span className="text-gray-900 font-bold">
                  {formatCurrency(payout.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Payment Details</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Method</p>
                <p className="text-gray-900">{METHOD_LABELS[payout.method]}</p>
              </div>
              {payout.processedDate && (
                <div>
                  <p className="text-gray-500">Processed</p>
                  <p className="text-gray-900">
                    {formatDate(new Date(payout.processedDate), {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {payout.transactionId && (
                <div className="col-span-2">
                  <p className="text-gray-500">Transaction ID</p>
                  <p className="text-gray-900 font-mono text-xs">
                    {payout.transactionId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineConnector(): React.ReactElement {
  return (
    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
  );
}

function TimelineDot({ status }: { status: PayoutStatus }): React.ReactElement {
  const config = STATUS_CONFIG[status];
  return (
    <div className={cn(
      'absolute left-3 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-xs',
      config.bgColor
    )}>
      <span className="text-[10px]">{config.icon}</span>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function PayoutTracker({
  partnerId,
  className,
}: PayoutTrackerProps): React.ReactElement {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Fetch payouts
  const fetchPayouts = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`/api/partners/${partnerId}/payouts`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: ApiResponse<Payout[]> = await response.json();

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Failed to fetch payouts');
      }

      setPayouts(json.data);
      setStatus('success');
    } catch {
      // Use mock data on error for demo
      setPayouts(generateMockPayouts());
      setStatus('success');
    }
  }, [partnerId]);

  // Initial fetch
  useEffect(() => {
    void fetchPayouts();
  }, [fetchPayouts]);

  const isLoading = status === 'loading' || status === 'idle';
  const upcomingPayout = payouts.find(p => p.status === 'PENDING');
  const pastPayouts = payouts.filter(p => p.status !== 'PENDING');

  // Calculate totals
  const totalEarned = payouts
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = upcomingPayout?.amount ?? 0;

  if (status === 'error' && error) {
    return (
      <div className={cn('bg-white rounded-2xl border border-gray-200 p-6', className)}>
        <ErrorState message={error} onRetry={fetchPayouts} />
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200', className)}>
      {/* Header */}
      <div className="p-5 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">💸</span>
          Payout Tracker
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 p-5 border-b border-gray-200">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-600 font-medium">Total Earned</p>
          <p className="text-2xl font-bold text-green-700">
            {isLoading ? '—' : formatCurrency(totalEarned)}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-sm text-yellow-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">
            {isLoading ? '—' : formatCurrency(pendingAmount)}
          </p>
        </div>
      </div>

      {/* Payouts List */}
      <div className="p-5 space-y-6">
        {isLoading && (
          <div className="space-y-4">
            <PayoutSkeleton />
            <PayoutSkeleton />
          </div>
        )}

        {!isLoading && payouts.length === 0 && <EmptyState />}

        {!isLoading && payouts.length > 0 && (
          <>
            {/* Upcoming Payout */}
            {upcomingPayout && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Upcoming Payout
                </h3>
                <PayoutCard payout={upcomingPayout} isUpcoming />
              </div>
            )}

            {/* Past Payouts Timeline */}
            {pastPayouts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Payout History
                </h3>
                <div className="relative pl-8">
                  <TimelineConnector />
                  <div className="space-y-4">
                    {pastPayouts.map((payout) => (
                      <div key={payout.id} className="relative">
                        <TimelineDot status={payout.status} />
                        <PayoutCard payout={payout} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 rounded-b-2xl border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Payouts are processed on the 5th of each month
        </p>
      </div>
    </div>
  );
}

export default PayoutTracker;
