'use client';

/**
 * InstallPrompt Component
 * 
 * PWA installation prompt with:
 * - Native install prompt trigger
 * - iOS-specific instructions
 * - Dismissible banner
 * - Persistent dismissal via localStorage
 * 
 * Features:
 * - Automatic detection of installability
 * - Platform-specific messaging
 * - Animated banner
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePWAInstall } from '@/hooks/pwa';

// ============================================
// Types
// ============================================

interface InstallPromptProps {
  className?: string;
  position?: 'top' | 'bottom';
  delay?: number;
}

// ============================================
// Constants
// ============================================

const DISMISSAL_KEY = 'pwa-install-dismissed';
const DISMISSAL_EXPIRY_DAYS = 7;

// ============================================
// Main Component
// ============================================

export function InstallPrompt({
  className,
  position = 'bottom',
  delay = 3000,
}: InstallPromptProps): React.ReactElement | null {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if previously dismissed
  useEffect(() => {
    const checkDismissal = (): boolean => {
      const dismissed = localStorage.getItem(DISMISSAL_KEY);
      if (dismissed) {
        const dismissedAt = new Date(dismissed);
        const expiryDate = new Date(dismissedAt);
        expiryDate.setDate(expiryDate.getDate() + DISMISSAL_EXPIRY_DAYS);
        
        if (new Date() < expiryDate) {
          return true;
        }
        localStorage.removeItem(DISMISSAL_KEY);
      }
      return false;
    };

    // Show prompt after delay if not dismissed and installable
    if ((isInstallable || isIOS) && !isInstalled && !checkDismissal()) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => setIsVisible(true), 50);
      }, delay);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isInstallable, isInstalled, isIOS, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setIsAnimating(false), 300);
    localStorage.setItem(DISMISSAL_KEY, new Date().toISOString());
  };

  const handleInstall = async () => {
    if (isIOS) {
      // Can't programmatically install on iOS, just show instructions
      return;
    }

    const success = await promptInstall();
    if (success) {
      setIsVisible(false);
      setIsAnimating(false);
    }
  };

  if (!isAnimating) return null;

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 px-4 transition-all duration-300',
        position === 'top' ? 'top-0' : 'bottom-0',
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : position === 'top' 
            ? 'opacity-0 -translate-y-full' 
            : 'opacity-0 translate-y-full',
        className
      )}
    >
      <div className={cn(
        'max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-4',
        position === 'top' ? 'mt-4' : 'mb-4'
      )}>
        {isIOS ? (
          // iOS Instructions
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-2xl">📱</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1">
                Install Inner Circle
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Tap <span className="inline-flex items-center px-1 bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                  </svg>
                </span> then <strong>"Add to Home Screen"</strong>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Maybe later
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ) : (
          // Standard Install Prompt
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">
                Install Inner Circle
              </h3>
              <p className="text-sm text-gray-500">
                Get faster access and push notifications
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Later
              </button>
              <button
                type="button"
                onClick={handleInstall}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstallPrompt;
