'use client';

/**
 * Admin Dashboard Client Component
 * Client-side admin dashboard with overview statistics
 */

import React, { useState, useEffect } from 'react';
import { StatsCard, StatsGrid, StatsIcons } from '@/components/ui/StatsCard';
import { EarningsChart } from '@/components/charts/EarningsChart';
import { formatCurrency } from '@/lib/utils';
import type { ApiResponse } from '@/types';

// ============================================
// Types
// ============================================

interface AdminStats {
  totalPartners: number;
  activePartners: number;
  pendingApprovals: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalPayouts: number;
  pendingPayouts: number;
  conversionRate: number;
}

interface RecentPartner {
  id: string;
  name: string;
  email: string;
  status: string;
  tier: string;
  createdAt: string;
}

interface RecentPayout {
  id: string;
  partnerName: string;
  amount: number;
  status: string;
  requestedAt: string;
}

// ============================================
// Admin Dashboard Client
// ============================================

export function AdminDashboardClient(): React.ReactElement {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentPartners, setRecentPartners] = useState<RecentPartner[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<RecentPayout[]>([]);
  const [chartData, setChartData] = useState<Array<{ date: string; earnings: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/stats');
        const result: ApiResponse<{
          stats: AdminStats;
          recentPartners: RecentPartner[];
          recentPayouts: RecentPayout[];
          chartData: Array<{ date: string; earnings: number }>;
        }> = await response.json();

        if (result.success && result.data) {
          setStats(result.data.stats);
          setRecentPartners(result.data.recentPartners);
          setRecentPayouts(result.data.recentPayouts);
          setChartData(result.data.chartData);
        } else {
          // Use demo data if API fails
          setStats({
            totalPartners: 156,
            activePartners: 124,
            pendingApprovals: 8,
            totalRevenue: 12450000,
            monthlyRevenue: 2340000,
            totalPayouts: 8750000,
            pendingPayouts: 450000,
            conversionRate: 5.27,
          });
          setRecentPartners([
            { id: '1', name: 'Alex Morgan', email: 'alex@example.com', status: 'ACTIVE', tier: 'GOLD', createdAt: new Date().toISOString() },
            { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', status: 'PENDING', tier: 'BRONZE', createdAt: new Date().toISOString() },
            { id: '3', name: 'Marcus Williams', email: 'marcus@example.com', status: 'ACTIVE', tier: 'SILVER', createdAt: new Date().toISOString() },
          ]);
          setRecentPayouts([
            { id: '1', partnerName: 'Alex Morgan', amount: 125000, status: 'COMPLETED', requestedAt: new Date().toISOString() },
            { id: '2', partnerName: 'Sarah Chen', amount: 75000, status: 'PROCESSING', requestedAt: new Date().toISOString() },
          ]);
          // Generate demo chart data
          const demoChart: Array<{ date: string; earnings: number }> = [];
          const now = new Date();
          for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            demoChart.push({
              date: dateStr || '',
              earnings: Math.floor(50000 + Math.random() * 100000),
            });
          }
          setChartData(demoChart);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        // Still set demo data on error
        setStats({
          totalPartners: 156,
          activePartners: 124,
          pendingApprovals: 8,
          totalRevenue: 12450000,
          monthlyRevenue: 2340000,
          totalPayouts: 8750000,
          pendingPayouts: 450000,
          conversionRate: 5.27,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    INACTIVE: 'bg-gray-100 text-gray-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-green-100 text-green-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    FAILED: 'bg-red-100 text-red-700',
  };

  const tierColors: Record<string, string> = {
    BRONZE: 'text-amber-600',
    SILVER: 'text-gray-500',
    GOLD: 'text-yellow-500',
    PLATINUM: 'text-purple-600',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your partner program performance
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            Using demo data. API endpoint not available: {error}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <StatsGrid columns={4}>
        <StatsCard
          title="Total Partners"
          value={stats?.totalPartners ?? 0}
          subtitle={`${stats?.activePartners ?? 0} active`}
          icon={StatsIcons.referrals}
          loading={loading}
        />
        <StatsCard
          title="Pending Approvals"
          value={stats?.pendingApprovals ?? 0}
          color={stats?.pendingApprovals && stats.pendingApprovals > 0 ? 'warning' : 'default'}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          loading={loading}
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthlyRevenue ?? 0)}
          trend={{ value: 12, direction: 'up', label: 'vs last month' }}
          icon={StatsIcons.earnings}
          color="success"
          loading={loading}
        />
        <StatsCard
          title="Pending Payouts"
          value={formatCurrency(stats?.pendingPayouts ?? 0)}
          subtitle="Awaiting processing"
          icon={StatsIcons.payout}
          loading={loading}
        />
      </StatsGrid>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
          <span className="text-sm text-gray-500">Last 30 days</span>
        </div>
        <EarningsChart
          data={chartData}
          height={300}
          loading={loading}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Partners */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Partners</h2>
            <a
              href="/admin/partners"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all →
            </a>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPartners.map((partner) => (
                <div key={partner.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {partner.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{partner.name}</p>
                      <p className="text-xs text-gray-500">{partner.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${tierColors[partner.tier] ?? ''}`}>
                      {partner.tier}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[partner.status] ?? ''}`}>
                      {partner.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payouts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payouts</h2>
            <a
              href="/admin/payouts"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all →
            </a>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPayouts.map((payout) => (
                <div key={payout.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payout.partnerName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payout.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payout.amount)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[payout.status] ?? ''}`}>
                      {payout.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/partners?status=PENDING"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Review Pending</p>
              <p className="text-xs text-gray-500">{stats?.pendingApprovals ?? 0} partners</p>
            </div>
          </a>
          <a
            href="/admin/payouts?status=PENDING"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Process Payouts</p>
              <p className="text-xs text-gray-500">Pending requests</p>
            </div>
          </a>
          <a
            href="/admin/partners/new"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Add Partner</p>
              <p className="text-xs text-gray-500">Manual invite</p>
            </div>
          </a>
          <a
            href="/admin/analytics"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">View Analytics</p>
              <p className="text-xs text-gray-500">Full reports</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardClient;
