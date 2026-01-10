'use client';

/**
 * Payouts Management Client Component
 * Lists, filters, and processes payouts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { ApiResponse, PayoutStatus } from '@/types';

// ============================================
// Types
// ============================================

interface Payout {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PayoutStatus;
  requestedAt: string;
  processedAt?: string | null;
}

type FilterStatus = PayoutStatus | 'ALL';

// ============================================
// Payouts Client Component
// ============================================

export function PayoutsClient(): React.ReactElement {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [selectedPayouts, setSelectedPayouts] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [processingBulk, setProcessingBulk] = useState(false);

  // Fetch payouts
  useEffect(() => {
    async function fetchPayouts() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/payouts');
        const result: ApiResponse<{ payouts: Payout[] }> = await response.json();

        if (result.success && result.data) {
          setPayouts(result.data.payouts);
        } else {
          // Use demo data if API fails
          setPayouts([
            {
              id: 'payout-1',
              partnerId: 'partner-123',
              partnerName: 'Alex Morgan',
              partnerEmail: 'alex@example.com',
              amount: 125000,
              fee: 1500,
              netAmount: 123500,
              status: 'PENDING',
              requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'payout-2',
              partnerId: 'partner-456',
              partnerName: 'Sarah Chen',
              partnerEmail: 'sarah@example.com',
              amount: 250000,
              fee: 2750,
              netAmount: 247250,
              status: 'PROCESSING',
              requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'payout-3',
              partnerId: 'partner-789',
              partnerName: 'Marcus Williams',
              partnerEmail: 'marcus@example.com',
              amount: 75000,
              fee: 1000,
              netAmount: 74000,
              status: 'COMPLETED',
              requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'payout-4',
              partnerId: 'partner-101',
              partnerName: 'Emily Davis',
              partnerEmail: 'emily@example.com',
              amount: 50000,
              fee: 750,
              netAmount: 49250,
              status: 'FAILED',
              requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payouts');
      } finally {
        setLoading(false);
      }
    }

    fetchPayouts();
  }, []);

  // Filter payouts
  const filteredPayouts = payouts.filter(payout => {
    if (statusFilter !== 'ALL' && payout.status !== statusFilter) return false;
    return true;
  });

  // Handle payout action
  const handleAction = useCallback(async (payoutId: string, action: 'approve' | 'process' | 'reject') => {
    setActionLoading(payoutId);
    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Update local state
        setPayouts(prev => prev.map(p => {
          if (p.id === payoutId) {
            let newStatus: PayoutStatus = p.status;
            if (action === 'approve') newStatus = 'PROCESSING';
            if (action === 'process') newStatus = 'COMPLETED';
            if (action === 'reject') newStatus = 'FAILED';
            return { ...p, status: newStatus };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
    }
  }, []);

  // Handle bulk process
  const handleBulkProcess = useCallback(async () => {
    if (selectedPayouts.size === 0) return;
    
    setProcessingBulk(true);
    try {
      const pendingIds = Array.from(selectedPayouts).filter(id => {
        const payout = payouts.find(p => p.id === id);
        return payout?.status === 'PENDING' || payout?.status === 'PROCESSING';
      });

      if (pendingIds.length === 0) {
        return;
      }

      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_payouts',
          ids: pendingIds,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setPayouts(prev => prev.map(p => {
          if (pendingIds.includes(p.id)) {
            return { ...p, status: 'COMPLETED' as PayoutStatus };
          }
          return p;
        }));
        setSelectedPayouts(new Set());
      }
    } catch (err) {
      console.error('Bulk process failed:', err);
    } finally {
      setProcessingBulk(false);
    }
  }, [selectedPayouts, payouts]);

  // Handle bulk reject
  const handleBulkReject = useCallback(async () => {
    if (selectedPayouts.size === 0) return;
    
    setProcessingBulk(true);
    try {
      const pendingIds = Array.from(selectedPayouts).filter(id => {
        const payout = payouts.find(p => p.id === id);
        return payout?.status === 'PENDING' || payout?.status === 'PROCESSING';
      });

      if (pendingIds.length === 0) {
        return;
      }

      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_payouts',
          ids: pendingIds,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setPayouts(prev => prev.map(p => {
          if (pendingIds.includes(p.id)) {
            return { ...p, status: 'FAILED' as PayoutStatus };
          }
          return p;
        }));
        setSelectedPayouts(new Set());
      }
    } catch (err) {
      console.error('Bulk reject failed:', err);
    } finally {
      setProcessingBulk(false);
    }
  }, [selectedPayouts, payouts]);

  // Toggle selection
  const toggleSelection = useCallback((payoutId: string) => {
    setSelectedPayouts(prev => {
      const next = new Set(prev);
      if (next.has(payoutId)) {
        next.delete(payoutId);
      } else {
        next.add(payoutId);
      }
      return next;
    });
  }, []);

  // Select all pending
  const selectAllPending = useCallback(() => {
    const pendingIds = filteredPayouts
      .filter(p => p.status === 'PENDING')
      .map(p => p.id);
    
    if (pendingIds.every(id => selectedPayouts.has(id))) {
      // Deselect all pending
      setSelectedPayouts(prev => {
        const next = new Set(prev);
        pendingIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Select all pending
      setSelectedPayouts(prev => new Set([...prev, ...pendingIds]));
    }
  }, [filteredPayouts, selectedPayouts]);

  // Status colors
  const statusColors: Record<PayoutStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  };

  // Calculate totals
  const totals = {
    pending: payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
    processing: payouts.filter(p => p.status === 'PROCESSING').reduce((sum, p) => sum + p.amount, 0),
    completed: payouts.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and process partner payout requests
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            Using demo data. API endpoint not available.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totals.pending)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Processing</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.processing)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed (All Time)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.completed)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>

            {selectedPayouts.size > 0 && (
              <span className="text-sm text-gray-500">
                {selectedPayouts.size} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllPending}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Select All Pending
            </button>
            <button
              type="button"
              onClick={handleBulkProcess}
              disabled={selectedPayouts.size === 0 || processingBulk}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingBulk ? 'Processing...' : 'Approve Selected'}
            </button>
            <button
              type="button"
              onClick={handleBulkReject}
              disabled={selectedPayouts.size === 0 || processingBulk}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject Selected
            </button>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Loading payouts...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayouts.map(payout => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      {payout.status === 'PENDING' && (
                        <input
                          type="checkbox"
                          checked={selectedPayouts.has(payout.id)}
                          onChange={() => toggleSelection(payout.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payout.partnerName}</p>
                        <p className="text-xs text-gray-500">{payout.partnerEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-500">
                      {formatCurrency(payout.fee)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-green-600">
                      {formatCurrency(payout.netAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[payout.status])}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatRelativeTime(new Date(payout.requestedAt))}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {payout.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAction(payout.id, 'approve')}
                              disabled={actionLoading === payout.id}
                              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50"
                            >
                              {actionLoading === payout.id ? '...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(payout.id, 'reject')}
                              disabled={actionLoading === payout.id}
                              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {payout.status === 'PROCESSING' && (
                          <button
                            type="button"
                            onClick={() => handleAction(payout.id, 'process')}
                            disabled={actionLoading === payout.id}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                          >
                            {actionLoading === payout.id ? '...' : 'Complete'}
                          </button>
                        )}
                        {payout.status === 'FAILED' && (
                          <button
                            type="button"
                            onClick={() => handleAction(payout.id, 'approve')}
                            disabled={actionLoading === payout.id}
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayouts.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-500">No payouts found matching your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PayoutsClient;
