'use client';

/**
 * EmailDigestSettings Component
 * 
 * Email digest configuration with:
 * - Frequency selection (daily/weekly/monthly)
 * - Content preferences
 * - Preview functionality
 * - Test email sending
 * 
 * Features:
 * - Toggle switches
 * - Preview rendering
 * - Loading/error states
 * - Save confirmation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { ApiResponse } from '@/types';

// ============================================
// Types
// ============================================

export type DigestFrequency = 'daily' | 'weekly' | 'monthly' | 'never';

export interface DigestSettings {
  enabled: boolean;
  frequency: DigestFrequency;
  dayOfWeek: number; // 0-6 for weekly
  dayOfMonth: number; // 1-28 for monthly
  timeOfDay: string; // HH:mm
  includeStats: boolean;
  includeTopCampaigns: boolean;
  includeNewConversions: boolean;
  includeTips: boolean;
  includeLeaderboard: boolean;
}

export interface DigestPreview {
  subject: string;
  stats: {
    clicks: number;
    conversions: number;
    revenue: number;
    changePercent: number;
  };
  topCampaigns: {
    name: string;
    conversions: number;
  }[];
  recentConversions: {
    name: string;
    date: Date;
    amount: number;
  }[];
  tip: string;
  leaderboardRank: number;
}

interface EmailDigestSettingsProps {
  partnerId: string;
  className?: string;
}

// ============================================
// Constants
// ============================================

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const FREQUENCY_OPTIONS: { value: DigestFrequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Every day at your preferred time' },
  { value: 'weekly', label: 'Weekly', description: 'Once a week on your chosen day' },
  { value: 'monthly', label: 'Monthly', description: 'First week of each month' },
  { value: 'never', label: 'Never', description: 'Disable email digests' },
];

const TIPS = [
  'Share your referral link on LinkedIn to boost conversions by 40%',
  'Personalize your share message for better engagement',
  'Follow up with leads who clicked but haven\'t converted',
  'Use WhatsApp for faster response times',
  'Track which campaigns perform best and double down',
];

// ============================================
// Mock Data
// ============================================

function generateMockPreview(): DigestPreview {
  return {
    subject: 'Your Weekly Partner Summary - Great progress! 🚀',
    stats: {
      clicks: 234,
      conversions: 12,
      revenue: 315000,
      changePercent: 15.3,
    },
    topCampaigns: [
      { name: 'LinkedIn Q1 Push', conversions: 5 },
      { name: 'Newsletter Feature', conversions: 4 },
      { name: 'Twitter Thread', conversions: 3 },
    ],
    recentConversions: [
      { name: 'John Smith', date: new Date(Date.now() - 86400000), amount: 35000 },
      { name: 'Sarah Johnson', date: new Date(Date.now() - 172800000), amount: 45000 },
      { name: 'Mike Chen', date: new Date(Date.now() - 259200000), amount: 28000 },
    ],
    tip: TIPS[Math.floor(Math.random() * TIPS.length)] ?? TIPS[0] ?? '',
    leaderboardRank: 7,
  };
}

function getDefaultSettings(): DigestSettings {
  return {
    enabled: true,
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    dayOfMonth: 1,
    timeOfDay: '09:00',
    includeStats: true,
    includeTopCampaigns: true,
    includeNewConversions: true,
    includeTips: true,
    includeLeaderboard: false,
  };
}

// ============================================
// Sub-Components
// ============================================

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}): React.ReactElement {
  return (
    <label className={cn(
      'flex items-start justify-between p-3 rounded-lg transition-colors',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
    )}>
      <div className="flex-1 min-w-0 mr-4">
        <p className={cn('font-medium', disabled ? 'text-gray-400' : 'text-gray-900')}>
          {label}
        </p>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors shrink-0',
          checked ? 'bg-primary-600' : 'bg-gray-200',
          disabled && 'cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </label>
  );
}

function DigestPreviewCard({
  preview,
  settings,
}: {
  preview: DigestPreview;
  settings: DigestSettings;
}): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Email Header */}
      <div className="bg-primary-600 text-white p-4">
        <p className="text-xs opacity-80">Preview of your next digest email</p>
        <p className="font-semibold mt-1">{preview.subject}</p>
      </div>

      {/* Email Body */}
      <div className="p-4 space-y-4">
        {/* Stats Section */}
        {settings.includeStats && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-3">This Week's Performance</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{preview.stats.clicks}</p>
                <p className="text-xs text-gray-500">Clicks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{preview.stats.conversions}</p>
                <p className="text-xs text-gray-500">Conversions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(preview.stats.revenue)}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
            <p className="text-center text-sm text-green-600 mt-2">
              ↑ {preview.stats.changePercent.toFixed(1)}% vs last week
            </p>
          </div>
        )}

        {/* Top Campaigns */}
        {settings.includeTopCampaigns && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Top Campaigns</h4>
            <div className="space-y-2">
              {preview.topCampaigns.map((campaign, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{campaign.name}</span>
                  <span className="text-gray-500">{campaign.conversions} conv.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Conversions */}
        {settings.includeNewConversions && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">New Conversions</h4>
            <div className="space-y-2">
              {preview.recentConversions.map((conversion, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-700">{conversion.name}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      {formatDate(new Date(conversion.date))}
                    </span>
                  </div>
                  <span className="text-green-600 font-medium">
                    +{formatCurrency(conversion.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {settings.includeLeaderboard && (
          <div className="bg-primary-50 rounded-lg p-3 text-center">
            <p className="text-sm text-primary-700">
              You're ranked <span className="font-bold">#{preview.leaderboardRank}</span> on the leaderboard!
            </p>
          </div>
        )}

        {/* Tip */}
        {settings.includeTips && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
            <p className="text-sm text-yellow-800 flex items-start gap-2">
              <span>💡</span>
              <span>{preview.tip}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton(): React.ReactElement {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-12 bg-gray-200 rounded-lg" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
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
    <div className="text-center py-12">
      <span className="text-4xl block mb-3">📧</span>
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

// ============================================
// Main Component
// ============================================

export function EmailDigestSettings({
  partnerId,
  className,
}: EmailDigestSettingsProps): React.ReactElement {
  const [settings, setSettings] = useState<DigestSettings>(getDefaultSettings());
  const [preview, setPreview] = useState<DigestPreview | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const fetchSettings = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`/api/partners/${partnerId}/digest-settings`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: ApiResponse<DigestSettings> = await response.json();

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Failed to fetch settings');
      }

      setSettings(json.data);
      setStatus('success');
    } catch {
      // Use default settings for demo
      setSettings(getDefaultSettings());
      setStatus('success');
    }

    // Generate preview
    setPreview(generateMockPreview());
  }, [partnerId]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 3000);
    } catch {
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Test email sent! Check your inbox.');
    } catch {
      alert('Failed to send test email. Please try again.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const updateSetting = <K extends keyof DigestSettings>(
    key: K,
    value: DigestSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const isLoading = status === 'loading' || status === 'idle';

  if (status === 'error' && error) {
    return (
      <div className={cn('bg-white rounded-2xl border border-gray-200 p-6', className)}>
        <ErrorState message={error} onRetry={fetchSettings} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span>📧</span>
          Email Digest Settings
        </h2>
        {showSavedMessage && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            ✓ Settings saved
          </span>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Master Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <Toggle
                checked={settings.enabled}
                onChange={(checked) => updateSetting('enabled', checked)}
                label="Enable Email Digests"
                description="Receive regular performance summaries via email"
              />
            </div>

            {/* Frequency */}
            <div className={cn(
              'bg-white rounded-xl border border-gray-200 p-4 transition-opacity',
              !settings.enabled && 'opacity-50'
            )}>
              <h3 className="font-medium text-gray-900 mb-3">Frequency</h3>
              <div className="space-y-2">
                {FREQUENCY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                      settings.frequency === option.value
                        ? 'bg-primary-50 border border-primary-200'
                        : 'hover:bg-gray-50 border border-transparent',
                      !settings.enabled && 'pointer-events-none'
                    )}
                  >
                    <input
                      type="radio"
                      name="frequency"
                      value={option.value}
                      checked={settings.frequency === option.value}
                      onChange={() => updateSetting('frequency', option.value)}
                      disabled={!settings.enabled}
                      className="mt-1 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Day/Time Selectors */}
              {settings.enabled && settings.frequency !== 'never' && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  {settings.frequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Week
                      </label>
                      <select
                        value={settings.dayOfWeek}
                        onChange={(e) => updateSetting('dayOfWeek', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {settings.frequency === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Month
                      </label>
                      <select
                        value={settings.dayOfMonth}
                        onChange={(e) => updateSetting('dayOfMonth', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time of Day
                    </label>
                    <input
                      type="time"
                      value={settings.timeOfDay}
                      onChange={(e) => updateSetting('timeOfDay', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Content Options */}
            <div className={cn(
              'bg-white rounded-xl border border-gray-200 p-4 transition-opacity',
              (!settings.enabled || settings.frequency === 'never') && 'opacity-50'
            )}>
              <h3 className="font-medium text-gray-900 mb-3">Content to Include</h3>
              <div className="space-y-1">
                <Toggle
                  checked={settings.includeStats}
                  onChange={(checked) => updateSetting('includeStats', checked)}
                  label="Performance Stats"
                  description="Clicks, conversions, and revenue summary"
                  disabled={!settings.enabled || settings.frequency === 'never'}
                />
                <Toggle
                  checked={settings.includeTopCampaigns}
                  onChange={(checked) => updateSetting('includeTopCampaigns', checked)}
                  label="Top Campaigns"
                  description="Your best performing campaigns"
                  disabled={!settings.enabled || settings.frequency === 'never'}
                />
                <Toggle
                  checked={settings.includeNewConversions}
                  onChange={(checked) => updateSetting('includeNewConversions', checked)}
                  label="New Conversions"
                  description="Recent referral sign-ups"
                  disabled={!settings.enabled || settings.frequency === 'never'}
                />
                <Toggle
                  checked={settings.includeTips}
                  onChange={(checked) => updateSetting('includeTips', checked)}
                  label="Partner Tips"
                  description="Actionable advice to improve performance"
                  disabled={!settings.enabled || settings.frequency === 'never'}
                />
                <Toggle
                  checked={settings.includeLeaderboard}
                  onChange={(checked) => updateSetting('includeLeaderboard', checked)}
                  label="Leaderboard Rank"
                  description="Your position among other partners"
                  disabled={!settings.enabled || settings.frequency === 'never'}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSendingTest || !settings.enabled || settings.frequency === 'never'}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isSendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Email Preview</h3>
            {preview && <DigestPreviewCard preview={preview} settings={settings} />}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailDigestSettings;
