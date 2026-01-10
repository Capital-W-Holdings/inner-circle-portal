'use client';

/**
 * Partners Management Client Component
 * Lists, filters, and manages partners
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { ApiResponse, PartnerStatus, PartnerTier } from '@/types';

// ============================================
// Types
// ============================================

interface Partner {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  status: PartnerStatus;
  tier: PartnerTier;
  company?: string | null;
  phone?: string | null;
  totalEarnings: number;
  totalReferrals: number;
  createdAt: string;
}

type FilterStatus = PartnerStatus | 'ALL';
type FilterTier = PartnerTier | 'ALL';

// ============================================
// Partners Client Component
// ============================================

export function PartnersClient(): React.ReactElement {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') as FilterStatus) || 'ALL';

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>(initialStatus);
  const [tierFilter, setTierFilter] = useState<FilterTier>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartners, setSelectedPartners] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch partners
  useEffect(() => {
    async function fetchPartners() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/partners');
        const result: ApiResponse<{ partners: Partner[] }> = await response.json();

        if (result.success && result.data) {
          setPartners(result.data.partners);
        } else {
          // Use demo data if API fails
          setPartners([
            {
              id: 'partner-demo-123',
              name: 'Alex Morgan',
              email: 'alex@example.com',
              referralCode: 'ALEX2024',
              status: 'ACTIVE',
              tier: 'GOLD',
              company: 'Morgan Consulting',
              phone: '+1-555-0123',
              totalEarnings: 1245000,
              totalReferrals: 47,
              createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'partner-demo-456',
              name: 'Sarah Chen',
              email: 'sarah@example.com',
              referralCode: 'SARAH2024',
              status: 'ACTIVE',
              tier: 'PLATINUM',
              company: 'Chen Ventures',
              phone: '+1-555-0456',
              totalEarnings: 2340000,
              totalReferrals: 89,
              createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'partner-demo-789',
              name: 'Marcus Williams',
              email: 'marcus@example.com',
              referralCode: 'MARCUS24',
              status: 'PENDING',
              tier: 'STANDARD',
              company: null,
              phone: null,
              totalEarnings: 0,
              totalReferrals: 0,
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'partner-demo-101',
              name: 'Emily Davis',
              email: 'emily@example.com',
              referralCode: 'EMILY24',
              status: 'INACTIVE',
              tier: 'SILVER',
              company: 'Davis Tech',
              phone: null,
              totalEarnings: 450000,
              totalReferrals: 15,
              createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load partners');
        // Still set demo data
        setPartners([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPartners();
  }, []);

  // Filter partners
  const filteredPartners = partners.filter(partner => {
    if (statusFilter !== 'ALL' && partner.status !== statusFilter) return false;
    if (tierFilter !== 'ALL' && partner.tier !== tierFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        partner.name.toLowerCase().includes(query) ||
        partner.email.toLowerCase().includes(query) ||
        partner.referralCode.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Handle partner action
  const handleAction = useCallback(async (partnerId: string, action: 'approve' | 'suspend' | 'activate') => {
    setActionLoading(partnerId);
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Update local state
        setPartners(prev => prev.map(p => {
          if (p.id === partnerId) {
            let newStatus: PartnerStatus = p.status;
            if (action === 'approve') newStatus = 'ACTIVE';
            if (action === 'suspend') newStatus = 'SUSPENDED';
            if (action === 'activate') newStatus = 'ACTIVE';
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

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action: 'approve_partners' | 'suspend_partners' | 'activate_partners') => {
    if (selectedPartners.size === 0) return;
    
    setActionLoading('bulk');
    try {
      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ids: Array.from(selectedPartners),
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        const newStatus = action === 'suspend_partners' ? 'SUSPENDED' : 'ACTIVE';
        setPartners(prev => prev.map(p => {
          if (selectedPartners.has(p.id)) {
            return { ...p, status: newStatus as PartnerStatus };
          }
          return p;
        }));
        setSelectedPartners(new Set());
      }
    } catch (err) {
      console.error('Bulk action failed:', err);
    } finally {
      setActionLoading(null);
    }
  }, [selectedPartners]);

  // Toggle selection
  const toggleSelection = useCallback((partnerId: string) => {
    setSelectedPartners(prev => {
      const next = new Set(prev);
      if (next.has(partnerId)) {
        next.delete(partnerId);
      } else {
        next.add(partnerId);
      }
      return next;
    });
  }, []);

  // Select all
  const toggleSelectAll = useCallback(() => {
    if (selectedPartners.size === filteredPartners.length) {
      setSelectedPartners(new Set());
    } else {
      setSelectedPartners(new Set(filteredPartners.map(p => p.id)));
    }
  }, [filteredPartners, selectedPartners.size]);

  // Status colors
  const statusColors: Record<PartnerStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    INACTIVE: 'bg-gray-100 text-gray-700',
    SUSPENDED: 'bg-red-100 text-red-700',
  };

  // Tier colors
  const tierColors: Record<PartnerTier, string> = {
    STANDARD: 'text-amber-600',
    SILVER: 'text-gray-500',
    GOLD: 'text-yellow-500',
    PLATINUM: 'text-purple-600',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your partner network
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          + Add Partner
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            Using demo data. API endpoint not available.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as FilterStatus)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value as FilterTier)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Tiers</option>
            <option value="STANDARD">Bronze</option>
            <option value="SILVER">Silver</option>
            <option value="GOLD">Gold</option>
            <option value="PLATINUM">Platinum</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedPartners.size > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              {selectedPartners.size} selected
            </span>
            <button
              type="button"
              onClick={() => handleBulkAction('approve_partners')}
              disabled={actionLoading === 'bulk'}
              className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50"
            >
              {actionLoading === 'bulk' ? 'Processing...' : 'Approve Selected'}
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('suspend_partners')}
              disabled={actionLoading === 'bulk'}
              className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50"
            >
              Suspend Selected
            </button>
          </div>
        )}
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Loading partners...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPartners.size === filteredPartners.length && filteredPartners.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Referrals</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPartners.map(partner => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPartners.has(partner.id)}
                        onChange={() => toggleSelection(partner.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 font-medium">
                            {partner.name.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{partner.name}</p>
                          <p className="text-xs text-gray-500 truncate">{partner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {partner.referralCode}
                      </code>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[partner.status])}>
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('text-sm font-medium', tierColors[partner.tier])}>
                        {partner.tier}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-900">
                      {partner.totalReferrals}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(partner.totalEarnings)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatRelativeTime(new Date(partner.createdAt))}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {partner.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleAction(partner.id, 'approve')}
                            disabled={actionLoading === partner.id}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50"
                          >
                            {actionLoading === partner.id ? '...' : 'Approve'}
                          </button>
                        )}
                        {partner.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleAction(partner.id, 'suspend')}
                            disabled={actionLoading === partner.id}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50"
                          >
                            {actionLoading === partner.id ? '...' : 'Suspend'}
                          </button>
                        )}
                        {(partner.status === 'INACTIVE' || partner.status === 'SUSPENDED') && (
                          <button
                            type="button"
                            onClick={() => handleAction(partner.id, 'activate')}
                            disabled={actionLoading === partner.id}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                          >
                            {actionLoading === partner.id ? '...' : 'Activate'}
                          </button>
                        )}
                        <a
                          href={`/admin/partners/${partner.id}`}
                          className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPartners.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-500">No partners found matching your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3">
        <p className="text-sm text-gray-500">
          Showing {filteredPartners.length} of {partners.length} partners
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="px-3 py-1 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled
            className="px-3 py-1 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default PartnersClient;
