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
import type { Campaign, ShareResult, UserRole, PartnerStats } from '@/types';

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

type StatsModalType = 'earnings' | 'payout' | 'referrals' | 'conversion' | null;

// ============================================
// Tab Types
// ============================================

type TabKey = 'overview' | 'analytics' | 'share' | 'campaigns' | 'settings';

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'analytics', label: 'Analytics', icon: '📈' },
  { key: 'share', label: 'Share', icon: '📤' },
  { key: 'campaigns', label: 'Campaigns', icon: '🎯' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

// ============================================
// Stats Detail Modal Component
// ============================================

interface StatsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: StatsModalType;
  stats: PartnerStats | null;
  analytics: { daily?: Array<{ date: string; earnings: number; conversions: number; clicks: number }> } | null;
}

function StatsDetailModal({ isOpen, onClose, type, stats, analytics: _analytics }: StatsDetailModalProps): React.ReactElement | null {
  if (!isOpen || !type) return null;

  const modalContent: Record<NonNullable<StatsModalType>, { title: string; icon: string; content: React.ReactNode }> = {
    earnings: {
      title: 'Total Earnings',
      icon: '💰',
      content: (
        <div className="space-y-4">
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-green-600">{formatCurrency(stats?.totalEarned ?? 0)}</p>
            <p className="text-gray-500 mt-1">Lifetime earnings</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Earnings Breakdown</h4>
            <div className="flex justify-between">
              <span className="text-gray-600">This Month</span>
              <span className="font-medium">{formatCurrency((stats?.totalEarned ?? 0) * 0.12)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Month</span>
              <span className="font-medium">{formatCurrency((stats?.totalEarned ?? 0) * 0.10)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average per Referral</span>
              <span className="font-medium">{formatCurrency(stats?.totalReferrals ? (stats.totalEarned / stats.totalReferrals) : 0)}</span>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900">Commission Rate</h4>
            <p className="text-2xl font-bold text-indigo-600 mt-1">15%</p>
            <p className="text-sm text-indigo-700 mt-1">Standard tier rate. Upgrade to earn more!</p>
          </div>
        </div>
      ),
    },
    payout: {
      title: 'Pending Payout',
      icon: '💸',
      content: (
        <div className="space-y-4">
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-indigo-600">{formatCurrency(stats?.pendingPayout ?? 0)}</p>
            <p className="text-gray-500 mt-1">Available to withdraw</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Payout Details</h4>
            <div className="flex justify-between">
              <span className="text-gray-600">Minimum Payout</span>
              <span className="font-medium">$50.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Time</span>
              <span className="font-medium">3-5 business days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">Bank Transfer / PayPal</span>
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900">Next Payout Date</h4>
            <p className="text-lg font-bold text-amber-600 mt-1">15th of each month</p>
            <p className="text-sm text-amber-700 mt-1">Payouts are processed automatically</p>
          </div>
          <button className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
            Request Payout
          </button>
        </div>
      ),
    },
    referrals: {
      title: 'Referrals This Month',
      icon: '👥',
      content: (
        <div className="space-y-4">
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-indigo-600">{stats?.referralsThisMonth ?? 0}</p>
            <p className="text-gray-500 mt-1">New referrals this month</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Referral Stats</h4>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Lifetime Referrals</span>
              <span className="font-medium">{stats?.totalReferrals ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Clicks This Month</span>
              <span className="font-medium">{stats?.clicksThisMonth ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Conversions</span>
              <span className="font-medium">0</span>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900">Recent Activity</h4>
            <div className="mt-2 space-y-2">
              {stats?.recentActivity?.slice(0, 3).map((activity, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-green-700">{activity.title}</span>
                </div>
              )) || <p className="text-sm text-green-700">No recent activity</p>}
            </div>
          </div>
        </div>
      ),
    },
    conversion: {
      title: 'Conversion Rate',
      icon: '📈',
      content: (
        <div className="space-y-4">
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-indigo-600">{(stats?.conversionRate ?? 0).toFixed(1)}%</p>
            <p className="text-gray-500 mt-1">Click to conversion rate</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Conversion Funnel</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Link Clicks</span>
                <span className="font-medium">{stats?.clicksThisMonth ?? 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sign Ups</span>
                <span className="font-medium">{Math.round((stats?.clicksThisMonth ?? 0) * 0.3)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conversions</span>
                <span className="font-medium">{stats?.referralsThisMonth ?? 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats?.conversionRate ?? 0}%` }}></div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900">Tips to Improve</h4>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              <li>• Target your ideal audience</li>
              <li>• Use compelling call-to-actions</li>
              <li>• Share on multiple platforms</li>
            </ul>
          </div>
        </div>
      ),
    },
  };

  const content = modalContent[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{content.icon}</span>
            <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {content.content}
        </div>
      </div>
    </div>
  );
}

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
  const [statsModalType, setStatsModalType] = useState<StatsModalType>(null);

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
            onClick={() => setStatsModalType('earnings')}
          />
          <StatsCard
            title="Pending Payout"
            value={formatCurrency(stats?.pendingPayout ?? 0)}
            subtitle="Available to withdraw"
            icon={StatsIcons.payout}
            color="success"
            loading={isLoading}
            onClick={() => setStatsModalType('payout')}
          />
          <StatsCard
            title="This Month"
            value={String(stats?.referralsThisMonth ?? 0)}
            trend={isLoading ? undefined : { value: 8, direction: 'up', label: 'new referrals' }}
            icon={StatsIcons.referrals}
            loading={isLoading}
            onClick={() => setStatsModalType('referrals')}
          />
          <StatsCard
            title="Conversion Rate"
            value={`${(stats?.conversionRate ?? 0).toFixed(1)}%`}
            trend={isLoading ? undefined : { value: 0, direction: 'neutral', label: 'stable' }}
            icon={StatsIcons.conversion}
            loading={isLoading}
            onClick={() => setStatsModalType('conversion')}
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

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Profile Information
                </h2>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.name}
                        className="w-20 h-20 rounded-full"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-indigo-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        defaultValue={user.name}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed here. Manage in Clerk settings.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Partner ID</label>
                      <input
                        type="text"
                        value={partnerId}
                        disabled
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Payment Settings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option>Bank Transfer (ACH)</option>
                      <option>PayPal</option>
                      <option>Stripe Connect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout Threshold</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option>$50 (Default)</option>
                      <option>$100</option>
                      <option>$250</option>
                      <option>$500</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                      + Connect Stripe Account
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive emails about new conversions</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Payout Alerts</p>
                      <p className="text-sm text-gray-500">Get notified when payouts are processed</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Summary</p>
                      <p className="text-sm text-gray-500">Weekly digest of your referral performance</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Marketing Updates</p>
                      <p className="text-sm text-gray-500">Tips and news about the partner program</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                  </label>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
                <h2 className="text-lg font-semibold text-red-600 mb-4">
                  Danger Zone
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Delete Account</p>
                      <p className="text-sm text-gray-500">Permanently delete your partner account and all data</p>
                    </div>
                    <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
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

      {/* Stats Detail Modal */}
      <StatsDetailModal
        isOpen={statsModalType !== null}
        onClose={() => setStatsModalType(null)}
        type={statsModalType}
        stats={stats ?? null}
        analytics={analytics}
      />
    </div>
  );
}
