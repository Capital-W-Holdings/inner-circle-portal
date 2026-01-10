'use client';

/**
 * Settings Client Component
 * System configuration and settings management
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface TierConfig {
  name: string;
  minReferrals: number;
  commissionRate: number;
  color: string;
}

// ============================================
// Settings Client Component
// ============================================

export function SettingsClient(): React.ReactElement {
  const [activeSection, setActiveSection] = useState<'general' | 'tiers' | 'payouts' | 'notifications'>('general');
  const [saved, setSaved] = useState(false);

  // Demo tier configuration
  const [tiers, setTiers] = useState<TierConfig[]>([
    { name: 'Standard', minReferrals: 0, commissionRate: 10, color: 'blue' },
    { name: 'Silver', minReferrals: 10, commissionRate: 12, color: 'gray' },
    { name: 'Gold', minReferrals: 50, commissionRate: 15, color: 'yellow' },
    { name: 'Platinum', minReferrals: 100, commissionRate: 20, color: 'purple' },
  ]);

  // Demo payout settings
  const [payoutSettings, setPayoutSettings] = useState({
    minimumPayout: 1000, // $10 in cents
    platformFeePercent: 1,
    processingFee: 25, // $0.25 in cents
    autoApproveThreshold: 50000, // $500 auto-approve
  });

  // Demo notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailOnNewPartner: true,
    emailOnPayout: true,
    emailOnMilestone: true,
    weeklyDigest: true,
    slackIntegration: false,
    slackWebhookUrl: '',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    { key: 'general', label: 'General', icon: '⚙️' },
    { key: 'tiers', label: 'Partner Tiers', icon: '🏆' },
    { key: 'payouts', label: 'Payouts', icon: '💰' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your partner program settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors',
                  activeSection === section.key
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <span>{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* General Settings */}
            {activeSection === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Inner Circle Partners"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Referral URL
                    </label>
                    <input
                      type="text"
                      defaultValue="https://innercircle.co/r/"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cookie Duration (days)
                    </label>
                    <input
                      type="number"
                      defaultValue={30}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How long referral attribution lasts
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Auto-approve new partners
                      </label>
                      <p className="text-xs text-gray-500">
                        Skip manual approval for new sign-ups
                      </p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200"
                    >
                      <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tier Settings */}
            {activeSection === 'tiers' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Partner Tiers</h2>
                <p className="text-sm text-gray-500">
                  Configure commission rates and requirements for each tier
                </p>

                <div className="space-y-4">
                  {tiers.map((tier, index) => (
                    <div key={tier.name} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={cn(
                          'font-semibold',
                          tier.color === 'blue' && 'text-amber-600',
                          tier.color === 'gray' && 'text-gray-500',
                          tier.color === 'yellow' && 'text-yellow-500',
                          tier.color === 'purple' && 'text-purple-600'
                        )}>
                          {tier.name}
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Min Referrals
                          </label>
                          <input
                            type="number"
                            value={tier.minReferrals}
                            onChange={(e) => {
                              const newTiers = [...tiers];
                              const tierToUpdate = newTiers[index];
                              if (tierToUpdate) {
                                tierToUpdate.minReferrals = parseInt(e.target.value) || 0;
                                setTiers(newTiers);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Commission Rate (%)
                          </label>
                          <input
                            type="number"
                            value={tier.commissionRate}
                            onChange={(e) => {
                              const newTiers = [...tiers];
                              const tierToUpdate = newTiers[index];
                              if (tierToUpdate) {
                                tierToUpdate.commissionRate = parseInt(e.target.value) || 0;
                                setTiers(newTiers);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payout Settings */}
            {activeSection === 'payouts' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Payout Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Payout Amount ($)
                    </label>
                    <input
                      type="number"
                      value={payoutSettings.minimumPayout / 100}
                      onChange={(e) => setPayoutSettings({
                        ...payoutSettings,
                        minimumPayout: (parseFloat(e.target.value) || 0) * 100,
                      })}
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform Fee (%)
                    </label>
                    <input
                      type="number"
                      value={payoutSettings.platformFeePercent}
                      onChange={(e) => setPayoutSettings({
                        ...payoutSettings,
                        platformFeePercent: parseFloat(e.target.value) || 0,
                      })}
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Processing Fee ($)
                    </label>
                    <input
                      type="number"
                      value={payoutSettings.processingFee / 100}
                      onChange={(e) => setPayoutSettings({
                        ...payoutSettings,
                        processingFee: (parseFloat(e.target.value) || 0) * 100,
                      })}
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-approve Threshold ($)
                    </label>
                    <input
                      type="number"
                      value={payoutSettings.autoApproveThreshold / 100}
                      onChange={(e) => setPayoutSettings({
                        ...payoutSettings,
                        autoApproveThreshold: (parseFloat(e.target.value) || 0) * 100,
                      })}
                      step="1"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Payouts under this amount are auto-approved
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'emailOnNewPartner', label: 'Email on new partner sign-up', desc: 'Receive email when a new partner joins' },
                    { key: 'emailOnPayout', label: 'Email on payout request', desc: 'Receive email when a partner requests payout' },
                    { key: 'emailOnMilestone', label: 'Email on milestone reached', desc: 'Receive email when a partner reaches a milestone' },
                    { key: 'weeklyDigest', label: 'Weekly digest email', desc: 'Receive a weekly summary of partner activity' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          {item.label}
                        </label>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotificationSettings({
                          ...notificationSettings,
                          [item.key]: !notificationSettings[item.key as keyof typeof notificationSettings],
                        })}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          notificationSettings[item.key as keyof typeof notificationSettings]
                            ? 'bg-primary-600'
                            : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white transition',
                            notificationSettings[item.key as keyof typeof notificationSettings]
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  ))}

                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Slack Integration
                      </label>
                      <button
                        type="button"
                        onClick={() => setNotificationSettings({
                          ...notificationSettings,
                          slackIntegration: !notificationSettings.slackIntegration,
                        })}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          notificationSettings.slackIntegration
                            ? 'bg-primary-600'
                            : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white transition',
                            notificationSettings.slackIntegration
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                    {notificationSettings.slackIntegration && (
                      <input
                        type="text"
                        placeholder="Slack Webhook URL"
                        value={notificationSettings.slackWebhookUrl}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          slackWebhookUrl: e.target.value,
                        })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className={cn(
                  'px-6 py-2 rounded-lg font-medium transition-colors',
                  saved
                    ? 'bg-green-600 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                )}
              >
                {saved ? '✓ Saved' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsClient;
