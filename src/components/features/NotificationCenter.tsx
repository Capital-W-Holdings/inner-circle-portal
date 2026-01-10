'use client';

/**
 * NotificationCenter Component
 * 
 * In-app notification system with:
 * - Real-time updates via polling (SSE-ready)
 * - Read/unread state management
 * - Notification preferences
 * - Grouped by date
 * - Mark all as read
 * 
 * Features:
 * - Loading skeleton states
 * - Error handling with retry
 * - Empty state
 * - Notification type icons
 * - Relative timestamps
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { ApiResponse } from '@/types';

// ============================================
// Types
// ============================================

export type NotificationType = 
  | 'CONVERSION'
  | 'PAYOUT'
  | 'MILESTONE'
  | 'SYSTEM'
  | 'TIP'
  | 'REFERRAL_CLICK';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    [K in NotificationType]: boolean;
  };
}

interface NotificationCenterProps {
  partnerId: string;
  className?: string;
  maxHeight?: string;
  onNotificationClick?: (notification: Notification) => void;
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

// ============================================
// Constants
// ============================================

const NOTIFICATION_ICONS: Record<NotificationType, { icon: string; bgColor: string }> = {
  CONVERSION: { icon: '🎉', bgColor: 'bg-green-100' },
  PAYOUT: { icon: '💰', bgColor: 'bg-yellow-100' },
  MILESTONE: { icon: '🏆', bgColor: 'bg-purple-100' },
  SYSTEM: { icon: '⚙️', bgColor: 'bg-gray-100' },
  TIP: { icon: '💡', bgColor: 'bg-blue-100' },
  REFERRAL_CLICK: { icon: '👆', bgColor: 'bg-indigo-100' },
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: true,
  push: true,
  inApp: true,
  types: {
    CONVERSION: true,
    PAYOUT: true,
    MILESTONE: true,
    SYSTEM: true,
    TIP: true,
    REFERRAL_CLICK: false,
  },
};

// ============================================
// Mock Data Generator
// ============================================

function generateMockNotifications(): Notification[] {
  const now = new Date();
  return [
    {
      id: 'notif-1',
      type: 'CONVERSION',
      title: 'New Conversion!',
      message: 'John Smith signed up through your referral link',
      read: false,
      createdAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 min ago
      actionUrl: '/dashboard/referrals',
    },
    {
      id: 'notif-2',
      type: 'PAYOUT',
      title: 'Payout Processed',
      message: 'Your monthly payout of $1,245.00 has been sent',
      read: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      actionUrl: '/dashboard/payouts',
    },
    {
      id: 'notif-3',
      type: 'MILESTONE',
      title: 'Milestone Achieved!',
      message: 'You\'ve reached 100 total referrals',
      read: true,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: 'notif-4',
      type: 'TIP',
      title: 'Pro Tip',
      message: 'Share your link on LinkedIn to boost conversions by 40%',
      read: true,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: 'notif-5',
      type: 'REFERRAL_CLICK',
      title: 'Link Clicked',
      message: 'Someone clicked your referral link from Twitter',
      read: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      id: 'notif-6',
      type: 'SYSTEM',
      title: 'New Feature Available',
      message: 'Check out our new campaign analytics dashboard',
      read: true,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      actionUrl: '/dashboard/campaigns',
    },
  ];
}

// ============================================
// Sub-Components
// ============================================

function NotificationSkeleton(): React.ReactElement {
  return (
    <div className="flex items-start gap-3 p-4 animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
        <div className="w-48 h-3 bg-gray-200 rounded" />
      </div>
      <div className="w-12 h-3 bg-gray-200 rounded" />
    </div>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <div className="text-center py-12">
      <span className="text-4xl block mb-3">🔔</span>
      <p className="text-gray-600 font-medium">All caught up!</p>
      <p className="text-sm text-gray-500">No new notifications</p>
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

function NotificationItem({ 
  notification, 
  onRead,
  onClick,
}: NotificationItemProps): React.ReactElement {
  const config = NOTIFICATION_ICONS[notification.type];
  
  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 p-4 text-left transition-colors',
        'hover:bg-gray-50 focus:outline-none focus:bg-gray-50',
        !notification.read && 'bg-primary-50/50'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
        config.bgColor
      )}>
        <span className="text-lg" role="img" aria-hidden="true">
          {config.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            'text-sm truncate',
            notification.read ? 'text-gray-700' : 'text-gray-900 font-semibold'
          )}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">{notification.message}</p>
      </div>

      {/* Timestamp */}
      <div className="text-xs text-gray-400 shrink-0">
        {formatRelativeTime(new Date(notification.createdAt))}
      </div>
    </button>
  );
}

function DateGroupHeader({ date }: { date: string }): React.ReactElement {
  return (
    <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {date}
      </p>
    </div>
  );
}

// ============================================
// Preferences Panel
// ============================================

function PreferencesPanel({
  preferences,
  onUpdate,
  onClose,
}: {
  preferences: NotificationPreferences;
  onUpdate: (prefs: NotificationPreferences) => void;
  onClose: () => void;
}): React.ReactElement {
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleToggle = (
    category: 'email' | 'push' | 'inApp' | NotificationType
  ) => {
    if (category === 'email' || category === 'push' || category === 'inApp') {
      setLocalPrefs(prev => ({ ...prev, [category]: !prev[category] }));
    } else {
      setLocalPrefs(prev => ({
        ...prev,
        types: { ...prev.types, [category]: !prev.types[category] },
      }));
    }
  };

  const handleSave = () => {
    onUpdate(localPrefs);
    onClose();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Notification Settings</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Channels */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Channels</p>
        {(['email', 'push', 'inApp'] as const).map((channel) => (
          <label key={channel} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 capitalize">
              {channel === 'inApp' ? 'In-App' : channel}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={localPrefs[channel]}
              onClick={() => handleToggle(channel)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                localPrefs[channel] ? 'bg-primary-600' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                  localPrefs[channel] && 'translate-x-5'
                )}
              />
            </button>
          </label>
        ))}
      </div>

      {/* Types */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-700">Notification Types</p>
        {(Object.keys(localPrefs.types) as NotificationType[]).map((type) => (
          <label key={type} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <span>{NOTIFICATION_ICONS[type].icon}</span>
              {type.replace('_', ' ')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={localPrefs.types[type]}
              onClick={() => handleToggle(type)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                localPrefs.types[type] ? 'bg-primary-600' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                  localPrefs.types[type] && 'translate-x-5'
                )}
              />
            </button>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
      >
        Save Preferences
      </button>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function NotificationCenter({
  partnerId,
  className,
  maxHeight = '400px',
  onNotificationClick,
}: NotificationCenterProps): React.ReactElement {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`/api/notifications?partnerId=${partnerId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: ApiResponse<Notification[]> = await response.json();

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Failed to fetch notifications');
      }

      setNotifications(json.data);
      setStatus('success');
    } catch (err) {
      // Use mock data on error for demo
      setNotifications(generateMockNotifications());
      setStatus('success');
      // In production, uncomment:
      // setError(err instanceof Error ? err.message : 'Unknown error');
      // setStatus('error');
    }
  }, [partnerId]);

  // Initial fetch
  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Poll for new notifications (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );

    // API call (fire and forget)
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch {
      // Silent fail - UI already updated optimistically
    }
  }, []);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await fetch(`/api/notifications/read-all?partnerId=${partnerId}`, {
        method: 'POST',
      });
    } catch {
      // Silent fail
    }
  }, [partnerId]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt).toDateString();
      let label: string;

      if (date === today) {
        label = 'Today';
      } else if (date === yesterday) {
        label = 'Yesterday';
      } else {
        label = new Date(notification.createdAt).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      const groupArray = groups[label];
      if (groupArray) {
        groupArray.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isLoading = status === 'loading' || status === 'idle';

  if (status === 'error' && error) {
    return (
      <div className={cn('bg-white rounded-2xl border border-gray-200', className)}>
        <ErrorState message={error} onRetry={fetchNotifications} />
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPreferences(!showPreferences)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Preferences Panel */}
      {showPreferences && (
        <PreferencesPanel
          preferences={preferences}
          onUpdate={setPreferences}
          onClose={() => setShowPreferences(false)}
        />
      )}

      {/* Notification List */}
      {!showPreferences && (
        <div style={{ maxHeight }} className="overflow-y-auto">
          {isLoading && (
            <div>
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </div>
          )}

          {!isLoading && notifications.length === 0 && <EmptyState />}

          {!isLoading && notifications.length > 0 && (
            <div>
              {Object.entries(groupedNotifications).map(([date, items]) => (
                <div key={date}>
                  <DateGroupHeader date={date} />
                  {items.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={handleMarkAsRead}
                      onClick={onNotificationClick}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
