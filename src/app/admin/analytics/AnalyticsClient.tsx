'use client';

/**
 * Analytics Client Component
 * Comprehensive analytics and reporting dashboard
 */

import React, { useState, useEffect } from 'react';
import { EarningsChart } from '@/components/charts/EarningsChart';
import { ConversionsChart } from '@/components/charts/ConversionsChart';
import { SourceChart } from '@/components/charts/SourceChart';
import { StatsCard, StatsGrid, StatsIcons } from '@/components/ui/StatsCard';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalCommissions: number;
    totalReferrals: number;
    totalPartners: number;
    conversionRate: number;
    avgOrderValue: number;
  };
  chartData: Array<{
    date: string;
    earnings: number;
    clicks: number;
    conversions: number;
  }>;
  sourceData: Array<{
    source: string;
    clicks: number;
    conversions: number;
  }>;
  topPartners: Array<{
    id: string;
    name: string;
    referrals: number;
    earnings: number;
    conversionRate: number;
  }>;
  topCampaigns: Array<{
    id: string;
    name: string;
    partner: string;
    clicks: number;
    conversions: number;
    earnings: number;
  }>;
}

type DateRange = '7d' | '30d' | '90d' | '365d';

// ============================================
// Analytics Client Component
// ============================================

export function AnalyticsClient(): React.ReactElement {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      
      // Simulate API call with demo data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
      
      // Generate chart data
      const chartData: Array<{ date: string; earnings: number; clicks: number; conversions: number }> = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        chartData.push({
          date: dateStr || '',
          earnings: Math.floor(30000 + Math.random() * 70000),
          clicks: Math.floor(100 + Math.random() * 400),
          conversions: Math.floor(5 + Math.random() * 20),
        });
      }

      setData({
        summary: {
          totalRevenue: 12450000,
          totalCommissions: 1867500,
          totalReferrals: 1247,
          totalPartners: 156,
          conversionRate: 5.27,
          avgOrderValue: 99800,
        },
        chartData,
        sourceData: [
          { source: 'LinkedIn', clicks: 4520, conversions: 226 },
          { source: 'Twitter', clicks: 2180, conversions: 87 },
          { source: 'Email', clicks: 3200, conversions: 192 },
          { source: 'Direct', clicks: 1890, conversions: 113 },
          { source: 'Other', clicks: 980, conversions: 39 },
        ],
        topPartners: [
          { id: '1', name: 'Sarah Chen', referrals: 89, earnings: 2340000, conversionRate: 7.2 },
          { id: '2', name: 'Alex Morgan', referrals: 67, earnings: 1780000, conversionRate: 6.8 },
          { id: '3', name: 'Marcus Williams', referrals: 54, earnings: 1420000, conversionRate: 5.9 },
          { id: '4', name: 'Emily Davis', referrals: 48, earnings: 1260000, conversionRate: 5.4 },
          { id: '5', name: 'James Wilson', referrals: 41, earnings: 1080000, conversionRate: 5.1 },
        ],
        topCampaigns: [
          { id: '1', name: 'Q1 LinkedIn Push', partner: 'Sarah Chen', clicks: 1240, conversions: 89, earnings: 890000 },
          { id: '2', name: 'Newsletter Feature', partner: 'Alex Morgan', clicks: 980, conversions: 67, earnings: 670000 },
          { id: '3', name: 'Twitter Thread', partner: 'Marcus Williams', clicks: 720, conversions: 43, earnings: 430000 },
          { id: '4', name: 'Blog Post CTA', partner: 'Emily Davis', clicks: 650, conversions: 39, earnings: 390000 },
          { id: '5', name: 'Podcast Mention', partner: 'James Wilson', clicks: 540, conversions: 32, earnings: 320000 },
        ],
      });
      
      setLoading(false);
    }

    fetchAnalytics();
  }, [dateRange]);

  const dateRangeOptions: Array<{ value: DateRange; label: string }> = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '365d', label: 'Last year' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive view of your partner program performance
          </p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDateRange(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                dateRange === option.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <StatsGrid columns={4}>
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(data?.summary.totalRevenue ?? 0)}
          trend={{ value: 18, direction: 'up', label: 'vs previous period' }}
          icon={StatsIcons.earnings}
          color="success"
          loading={loading}
        />
        <StatsCard
          title="Commissions Paid"
          value={formatCurrency(data?.summary.totalCommissions ?? 0)}
          subtitle={`${((data?.summary.totalCommissions ?? 0) / (data?.summary.totalRevenue || 1) * 100).toFixed(1)}% of revenue`}
          icon={StatsIcons.payout}
          loading={loading}
        />
        <StatsCard
          title="Total Referrals"
          value={formatNumber(data?.summary.totalReferrals ?? 0)}
          trend={{ value: 12, direction: 'up', label: 'new this period' }}
          icon={StatsIcons.referrals}
          loading={loading}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${(data?.summary.conversionRate ?? 0).toFixed(2)}%`}
          subtitle={`Avg order: ${formatCurrency(data?.summary.avgOrderValue ?? 0)}`}
          icon={StatsIcons.conversion}
          loading={loading}
        />
      </StatsGrid>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Revenue & Conversions</h2>
        </div>
        <EarningsChart
          data={data?.chartData ?? []}
          height={350}
          loading={loading}
          showConversions
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks & Conversions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clicks & Conversions</h2>
          <ConversionsChart
            data={data?.chartData ?? []}
            height={300}
            loading={loading}
            showClicks
          />
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h2>
          <SourceChart
            data={data?.sourceData ?? []}
            height={300}
            metric="conversions"
            loading={loading}
          />
        </div>
      </div>

      {/* Top Partners & Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Partners */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Partners</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data?.topPartners.map((partner, index) => (
                <div key={partner.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    index === 0 && 'bg-yellow-100 text-yellow-600',
                    index === 1 && 'bg-gray-100 text-gray-600',
                    index === 2 && 'bg-amber-100 text-amber-600',
                    index > 2 && 'bg-gray-50 text-gray-500'
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{partner.name}</p>
                    <p className="text-xs text-gray-500">
                      {partner.referrals} referrals • {partner.conversionRate}% conv.
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(partner.earnings)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Campaigns */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Campaigns</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data?.topCampaigns.map((campaign) => (
                <div key={campaign.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(campaign.earnings)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>by {campaign.partner}</span>
                    <span>{campaign.clicks} clicks • {campaign.conversions} conv.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
            <p className="text-sm text-gray-500">Download analytics data for reporting</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Export CSV
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsClient;
