'use client';

/**
 * Dashboard Client Component
 * Handles client-side interactions for the partner dashboard
 */

import React, { useState, useCallback } from 'react';
import { ShareKit } from '@/components/features/ShareKit';
import { CampaignCreator } from '@/components/features/CampaignCreator';
import { StatsDashboard } from '@/components/features/StatsDashboard';
import { QRCodeGenerator, QRCodeModal } from '@/components/features/QRCodeGenerator';
import { EarningsChart, ConversionsChart, SourceChart } from '@/components/charts';
import { StatsCard, StatsGrid, StatsIcons } from '@/components/ui/StatsCard';
import { cn, formatCurrency } from '@/lib/utils';
import { usePartnerStats, useCampaigns, useAnalytics } from '@/hooks';
import type { Campaign, ShareResult, UserRole } from '@/types';

// ============================================
// Types
// ============================================

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
  role: UserRole;
  partnerId?: string;
}

interface DashboardClientProps {
  user: DashboardUser;
}

// ============================================
// Tab Types
// ============================================

type TabKey = 'overview' | 'analytics' | 'share' | 'campaigns';

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'analytics', label: 'Analytics', icon: '📈' },
  { key: 'share', label: 'Share', icon: '📤' },
  { key: 'campaigns', label: 'Campaigns', icon: '🎯' },
];

// ============================================
// Dashboard Client Component
// ============================================

export function DashboardClient({ user }: DashboardClientProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>([]);
  const [recentShares, setRecentShares] = useState<ShareResult[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedCampaignUrl, setSelectedCampaignUrl] = useState<string>('');
  const [selectedCampaignName, setSelectedCampaignName] = useState<string>('');

  // Partner ID
  const partnerId = user.partnerId ?? user.id;
  
  // Generate referral info
  const referralCode = partnerId.toUpperCase().slice(-8) || 'PARTNER01';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://innercircle.co';
  const referralLink = `${baseUrl}/r/${referralCode}`;

  // Fetch data
  const { data: stats, status: statsStatus } = usePartnerStats(partnerId);
  const { campaigns: apiCampaigns, createCampaign, isCreating } = useCampaigns(partnerId);
  const { data: analytics, loading: analyticsLoading } = useAnalytics(partnerId, { days: 30 });

  // Combine local and API campaigns
  const allCampaigns = [...localCampaigns, ...apiCampaigns];

  // Event handlers
  const handleShareComplete = useCallback((result: ShareResult) => {
    setRecentShares(prev => [result, ...prev].slice(0, 5));
  }, []);

  const handleCampaignCreated = useCallback(async (campaign: Campaign) => {
    // Try to create via API first
    const created = await createCampaign(campaign.name, campaign.source);
    if (!created) {
      // Fallback to local state if API fails
      setLocalCampaigns(prev => [campaign, ...prev]);
    }
  }, [createCampaign]);

  const handleShowQR = useCallback((url: string, name?: string) => {
    setSelectedCampaignUrl(url);
    setSelectedCampaignName(name || 'Referral Link');
    setQrModalOpen(true);
  }, []);

  const handleSignOut = useCallback(() => {
    window.location.href = '/';
  }, []);

  // Loading states
  const isLoading = statsStatus === 'loading';
  const isAnalyticsLoading = analyticsLoading;

  // Transform analytics data for charts
  const chartData = analytics?.daily ?? [];
  const sourceData = analytics?.bySource ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">
                DFX RMS
              </h1>
              {user.role === 'ADMIN' && (
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              {user.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats Grid */}
        <StatsGrid columns={4} className="mb-8">
          <StatsCard
            title="Total Earned"
            value={formatCurrency(stats?.totalEarned ?? 0)}
            trend={isLoading ? undefined : { value: 12, direction: 'up', label: 'vs last month' }}
            icon={StatsIcons.earnings}
            color="primary"
            loading={isLoading}
          />
          <StatsCard
            title="Pending Payout"
            value={formatCurrency(stats?.pendingPayout ?? 0)}
            subtitle="Available to withdraw"
            icon={StatsIcons.payout}
            color="success"
            loading={isLoading}
          />
          <StatsCard
            title="This Month"
            value={String(stats?.referralsThisMonth ?? 0)}
            trend={isLoading ? undefined : { value: 8, direction: 'up', label: 'new referrals' }}
            icon={StatsIcons.referrals}
            loading={isLoading}
          />
          <StatsCard
            title="Conversion Rate"
            value={`${(stats?.conversionRate ?? 0).toFixed(1)}%`}
            trend={isLoading ? undefined : { value: 0, direction: 'neutral', label: 'stable' }}
            icon={StatsIcons.conversion}
            loading={isLoading}
          />
        </StatsGrid>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
              )}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <StatsDashboard partnerId={partnerId} />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Earnings Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Earnings Over Time</h3>
                  <span className="text-sm text-gray-500">Last 30 days</span>
                </div>
                <EarningsChart
                  data={chartData}
                  height={300}
                  loading={isAnalyticsLoading}
                  showConversions
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversions Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Clicks & Conversions</h3>
                  </div>
                  <ConversionsChart
                    data={chartData}
                    height={250}
                    loading={isAnalyticsLoading}
                    showClicks
                  />
                </div>

                {/* Source Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Traffic Sources</h3>
                  </div>
                  <SourceChart
                    data={sourceData}
                    height={250}
                    metric="conversions"
                    loading={isAnalyticsLoading}
                  />
                </div>
              </div>

              {/* Top Campaigns Table */}
              {analytics?.topCampaigns && analytics.topCampaigns.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Top Performing Campaigns</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Clicks</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conv.</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Earnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {analytics.topCampaigns.map((campaign, i) => (
                          <tr key={campaign.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {i === 0 && <span className="text-yellow-500">🥇</span>}
                                {i === 1 && <span className="text-gray-400">🥈</span>}
                                {i === 2 && <span className="text-amber-600">🥉</span>}
                                <span className="font-medium text-gray-900">{campaign.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">{campaign.clicks}</td>
                            <td className="px-6 py-4 text-right text-gray-600">{campaign.conversions}</td>
                            <td className="px-6 py-4 text-right font-medium text-green-600">
                              {formatCurrency(campaign.earnings)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Share Kit */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Share Your Link
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Share your unique referral link and earn commissions on every conversion.
                </p>
                
                <ShareKit
                  referralCode={referralCode}
                  referralLink={referralLink}
                  partnerName={user.name}
                  onShareComplete={handleShareComplete}
                />

                {recentShares.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Recent Shares
                    </h3>
                    <div className="space-y-2">
                      {recentShares.map((share, i) => (
                        <div 
                          key={i}
                          className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg"
                        >
                          <span className="text-gray-600">
                            Shared via {share.platform}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {share.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  QR Code
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Scan to open your referral link
                </p>
                <QRCodeGenerator
                  url={referralLink}
                  size={180}
                  campaignName="Main Referral Link"
                  showDownload
                  showCopy
                />
              </div>
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Campaign Links
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Create tracking links for different channels to measure performance.
              </p>

              <CampaignCreator
                partnerId={partnerId}
                referralCode={referralCode}
                baseUrl={baseUrl}
                existingCampaigns={allCampaigns}
                onCampaignCreated={handleCampaignCreated}
                onShowQR={handleShowQR}
                isCreating={isCreating}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>DFX RMS • v1.0.0</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            Sign Out
          </button>
        </div>
      </main>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        url={selectedCampaignUrl}
        campaignName={selectedCampaignName}
      />
    </div>
  );
}
