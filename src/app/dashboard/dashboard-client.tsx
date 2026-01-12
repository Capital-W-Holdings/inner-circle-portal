'use client';

/**
 * Dashboard Client Component
 * Client-ready partner dashboard with onboarding, multi-company support
 */

import React, { useState, useCallback, useEffect } from 'react';
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

// ============================================
// Company Data
// ============================================

interface Company {
  id: string;
  name: string;
  slug: string;
  website: string;
  logo?: string;
  primaryColor: string;
  commissionRate: number;
  description: string;
}

const DEFAULT_COMPANY: Company = {
  id: 'dfx',
  name: 'DFX',
  slug: 'dfx',
  website: 'https://www.uedfx.com',
  primaryColor: '#6366f1',
  commissionRate: 15,
  description: 'Deal Flow Xchange - Capital marketplace for private deals',
};

const INITIAL_COMPANIES: Company[] = [DEFAULT_COMPANY];

type StatsModalType = 'earnings' | 'payout' | 'referrals' | 'conversion' | null;

// ============================================
// Tab Types
// ============================================

type TabKey = 'overview' | 'analytics' | 'share' | 'campaigns' | 'settings';

const TABS: Array<{ key: TabKey; label: string; icon: string; mobileIcon: string }> = [
  { key: 'overview', label: 'Overview', icon: '📊', mobileIcon: '📊' },
  { key: 'analytics', label: 'Analytics', icon: '📈', mobileIcon: '📈' },
  { key: 'share', label: 'Share', icon: '📤', mobileIcon: '📤' },
  { key: 'campaigns', label: 'Campaigns', icon: '🎯', mobileIcon: '🎯' },
  { key: 'settings', label: 'Settings', icon: '⚙️', mobileIcon: '⚙️' },
];

// ============================================
// Onboarding Steps
// ============================================

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  tabKey?: TabKey;
}

// ============================================
// Add Company Modal
// ============================================

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (company: Company) => void;
}

function AddCompanyModal({ isOpen, onClose, onAdd }: AddCompanyModalProps): React.ReactElement | null {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [commissionRate, setCommissionRate] = useState('15');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCompany: Company = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      website: website.trim() || '#',
      primaryColor: '#6366f1',
      commissionRate: parseInt(commissionRate) || 15,
      description: description.trim() || `${name} partner program`,
    };

    onAdd(newCompany);
    setName('');
    setWebsite('');
    setDescription('');
    setCommissionRate('15');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Company</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme Corp"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the company..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
            <input
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              min="1"
              max="50"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Quick Link Copy Component
// ============================================

function QuickLinkCopy({ link }: { link: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 max-w-xs">
      <span className="text-sm text-gray-600 truncate flex-1 font-mono">{link.replace('https://', '')}</span>
      <button
        onClick={handleCopy}
        className={cn(
          "p-1.5 rounded transition-all",
          copied ? "bg-green-100 text-green-600" : "hover:bg-gray-200 text-gray-500"
        )}
        title="Copy link"
      >
        {copied ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ============================================
// Welcome Banner Component
// ============================================

interface WelcomeBannerProps {
  userName: string;
  steps: OnboardingStep[];
  onStepClick: (step: OnboardingStep) => void;
  onDismiss: () => void;
}

function WelcomeBanner({ userName, steps, onStepClick, onDismiss }: WelcomeBannerProps): React.ReactElement {
  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Welcome, {userName.split(' ')[0]}! 👋</h2>
            <p className="text-indigo-100">Complete these steps to start earning commissions</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-white/70 hover:text-white p-1"
            title="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>{completedCount} of {steps.length} completed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => onStepClick(step)}
              className={cn(
                "text-left p-4 rounded-xl transition-all",
                step.completed
                  ? "bg-white/20 opacity-75"
                  : "bg-white/10 hover:bg-white/20"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {step.completed ? (
                  <span className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-white/50" />
                )}
                <span className="font-semibold text-sm">{step.title}</span>
              </div>
              <p className="text-xs text-indigo-100 ml-7">{step.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Stats Detail Modal Component
// ============================================

interface StatsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: StatsModalType;
  stats: PartnerStats | null;
  analytics: { daily?: Array<{ date: string; earnings: number; conversions: number; clicks: number }> } | null;
  company: Company;
}

function StatsDetailModal({ isOpen, onClose, type, stats, analytics: _analytics, company }: StatsDetailModalProps): React.ReactElement | null {
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
            <h4 className="font-semibold text-indigo-900">Commission Rate for {company.name}</h4>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{company.commissionRate}%</p>
            <p className="text-sm text-indigo-700 mt-1">Standard tier rate</p>
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
              <span className="text-gray-600">Total Lifetime</span>
              <span className="font-medium">{stats?.totalReferrals ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Clicks This Month</span>
              <span className="font-medium">{stats?.clicksThisMonth ?? 0}</span>
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{content.icon}</span>
            <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">{content.content}</div>
      </div>
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function EmptyState({ icon, title, description, action }: EmptyStateProps): React.ReactElement {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          {action.label}
        </button>
      )}
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
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [selectedCompany, setSelectedCompany] = useState<Company>(DEFAULT_COMPANY);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [addCompanyModalOpen, setAddCompanyModalOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Onboarding steps
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([
    {
      id: 'copy-link',
      title: 'Copy Your Link',
      description: 'Copy your unique referral link',
      action: 'Copy',
      completed: false,
    },
    {
      id: 'share',
      title: 'Share Link',
      description: 'Share on social or email',
      action: 'Share',
      completed: false,
      tabKey: 'share',
    },
    {
      id: 'campaign',
      title: 'Create Campaign',
      description: 'Track different channels',
      action: 'Create',
      completed: false,
      tabKey: 'campaigns',
    },
    {
      id: 'settings',
      title: 'Set Up Payout',
      description: 'Configure payment method',
      action: 'Configure',
      completed: false,
      tabKey: 'settings',
    },
  ]);

  // Check if new user (no stats/activity)
  const isNewUser = !stats?.totalReferrals && !stats?.totalEarned;

  // Persist welcome banner dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem('rms-welcome-dismissed');
    if (dismissed === 'true') {
      setShowWelcome(false);
    }
  }, []);

  // Event handlers
  const handleShareComplete = useCallback((result: ShareResult) => {
    setRecentShares(prev => [result, ...prev].slice(0, 5));
    // Mark share step as completed
    setOnboardingSteps(steps =>
      steps.map(s => s.id === 'share' ? { ...s, completed: true } : s)
    );
  }, []);

  const handleCampaignCreated = useCallback(async (campaign: Campaign) => {
    const created = await createCampaign(campaign.name, campaign.source);
    if (!created) {
      setLocalCampaigns(prev => [campaign, ...prev]);
    }
    // Mark campaign step as completed
    setOnboardingSteps(steps =>
      steps.map(s => s.id === 'campaign' ? { ...s, completed: true } : s)
    );
  }, [createCampaign]);

  const handleShowQR = useCallback((url: string, name?: string) => {
    setSelectedCampaignUrl(url);
    setSelectedCampaignName(name || 'Referral Link');
    setQrModalOpen(true);
  }, []);

  const handleSignOut = useCallback(() => {
    window.location.href = '/';
  }, []);

  const handleAddCompany = useCallback((company: Company) => {
    setCompanies(prev => [...prev, company]);
    setSelectedCompany(company);
  }, []);

  const handleOnboardingStepClick = useCallback((step: OnboardingStep) => {
    if (step.id === 'copy-link') {
      navigator.clipboard.writeText(referralLink).then(() => {
        setOnboardingSteps(steps =>
          steps.map(s => s.id === 'copy-link' ? { ...s, completed: true } : s)
        );
      });
    } else if (step.tabKey) {
      setActiveTab(step.tabKey);
    }
  }, [referralLink]);

  const handleDismissWelcome = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem('rms-welcome-dismissed', 'true');
  }, []);

  // Loading states
  const isLoading = statsStatus === 'loading';
  const isAnalyticsLoading = analyticsLoading;

  // Transform analytics data for charts
  const chartData = analytics?.daily ?? [];
  const sourceData = analytics?.bySource ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Company Selector */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">RMS</h1>

              {/* Company Selector */}
              <div className="relative">
                <button
                  onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <span className="font-medium text-gray-700 hidden sm:inline">{selectedCompany.name}</span>
                  <span className="font-medium text-gray-700 sm:hidden">{selectedCompany.name.slice(0, 3)}</span>
                  <svg
                    className={cn("w-4 h-4 text-gray-500 transition-transform", companyDropdownOpen && "rotate-180")}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {companyDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setCompanyDropdownOpen(false)} />
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                      <div className="p-2">
                        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Your Companies</p>
                        {companies.map((company) => (
                          <button
                            key={company.id}
                            onClick={() => {
                              setSelectedCompany(company);
                              setCompanyDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-3 rounded-lg transition-colors",
                              selectedCompany.id === company.id
                                ? "bg-indigo-50 border border-indigo-200"
                                : "hover:bg-gray-50"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{company.name}</div>
                                <div className="text-xs text-gray-500">{company.commissionRate}% commission</div>
                              </div>
                              {selectedCompany.id === company.id && (
                                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 p-2">
                        <button
                          onClick={() => {
                            setCompanyDropdownOpen(false);
                            setAddCompanyModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                        >
                          + Add Another Company
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {user.role === 'ADMIN' && (
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full hidden sm:inline">
                  Admin
                </span>
              )}
            </div>

            {/* Center: Quick Link Copy (desktop) */}
            <div className="hidden md:block">
              <QuickLinkCopy link={referralLink} />
            </div>

            {/* Right: User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{selectedCompany.commissionRate}% rate</div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative"
              >
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-medium">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Quick Link */}
          <div className="md:hidden mt-3">
            <QuickLinkCopy link={referralLink} />
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute right-4 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-30 overflow-hidden">
              <div className="p-2">
                <div className="px-3 py-2 border-b border-gray-100 mb-2">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  ⚙️ Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Banner for New Users */}
        {showWelcome && isNewUser && (
          <WelcomeBanner
            userName={user.name}
            steps={onboardingSteps}
            onStepClick={handleOnboardingStepClick}
            onDismiss={handleDismissWelcome}
          />
        )}

        {/* Quick Stats Grid */}
        <StatsGrid columns={4} className="mb-6">
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

        {/* Desktop Tab Navigation */}
        <div className="hidden lg:flex gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all',
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
            <>
              {isNewUser ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                  <EmptyState
                    icon="🚀"
                    title="Ready to Start Earning?"
                    description="Share your referral link to start earning commissions. Every time someone signs up through your link, you'll earn money!"
                    action={{
                      label: 'Share Your Link',
                      onClick: () => setActiveTab('share'),
                    }}
                  />
                </div>
              ) : (
                <StatsDashboard partnerId={partnerId} />
              )}
            </>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {isNewUser && !chartData.length ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                  <EmptyState
                    icon="📊"
                    title="No Analytics Yet"
                    description="Once you start getting referrals, you'll see detailed analytics here including earnings charts, conversion rates, and traffic sources."
                    action={{
                      label: 'Start Sharing',
                      onClick: () => setActiveTab('share'),
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Earnings Over Time</h3>
                      <span className="text-sm text-gray-500">Last 30 days</span>
                    </div>
                    <EarningsChart data={chartData} height={300} loading={isAnalyticsLoading} showConversions />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Clicks & Conversions</h3>
                      <ConversionsChart data={chartData} height={250} loading={isAnalyticsLoading} showClicks />
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
                      <SourceChart data={sourceData} height={250} metric="conversions" loading={isAnalyticsLoading} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Share Your Link</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Share your unique referral link for <strong>{selectedCompany.name}</strong> and earn {selectedCompany.commissionRate}% on every conversion.
                </p>

                <ShareKit
                  referralCode={referralCode}
                  referralLink={referralLink}
                  partnerName={user.name}
                  onShareComplete={handleShareComplete}
                />

                {recentShares.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Shares</h3>
                    <div className="space-y-2">
                      {recentShares.map((share, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Shared via {share.platform}</span>
                          <span className="text-gray-400 text-xs">{share.timestamp.toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">QR Code</h2>
                <p className="text-sm text-gray-500 mb-6">Scan to open your referral link</p>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Campaign Links</h2>
              <p className="text-sm text-gray-500 mb-6">
                Create tracking links for different channels to measure which sources perform best.
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

              {allCampaigns.length === 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <EmptyState
                    icon="🎯"
                    title="No Campaigns Yet"
                    description="Create campaign links to track performance across different platforms like Twitter, LinkedIn, Email, etc."
                  />
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt={user.name} className="w-20 h-20 rounded-full" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-indigo-600">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4 w-full">
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
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={referralCode}
                          disabled
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(referralCode)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Copy
                        </button>
                      </div>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option>Bank Transfer (ACH)</option>
                      <option>PayPal</option>
                      <option>Stripe Connect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout Threshold</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option>$50 (Default)</option>
                      <option>$100</option>
                      <option>$250</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
                <div className="space-y-4">
                  {[
                    { id: 'email', label: 'Email Notifications', desc: 'New conversions & updates', checked: true },
                    { id: 'payout', label: 'Payout Alerts', desc: 'When payouts are processed', checked: true },
                    { id: 'weekly', label: 'Weekly Summary', desc: 'Performance digest', checked: true },
                  ].map(item => (
                    <label key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked={item.checked} className="w-5 h-5 text-indigo-600 rounded" />
                    </label>
                  ))}
                </div>
              </div>

              {/* Sign Out */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Sign Out</p>
                    <p className="text-sm text-gray-500">End your current session</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-20">
        <div className="flex justify-around py-2">
          {TABS.slice(0, 5).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex flex-col items-center py-2 px-3 rounded-lg transition-colors",
                activeTab === tab.key
                  ? "text-indigo-600"
                  : "text-gray-500"
              )}
            >
              <span className="text-xl">{tab.mobileIcon}</span>
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        url={selectedCampaignUrl}
        campaignName={selectedCampaignName}
      />

      <StatsDetailModal
        isOpen={statsModalType !== null}
        onClose={() => setStatsModalType(null)}
        type={statsModalType}
        stats={stats ?? null}
        analytics={analytics}
        company={selectedCompany}
      />

      <AddCompanyModal
        isOpen={addCompanyModalOpen}
        onClose={() => setAddCompanyModalOpen(false)}
        onAdd={handleAddCompany}
      />
    </div>
  );
}
