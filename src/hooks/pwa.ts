'use client';

/**
 * PWA Hooks
 * 
 * Provides hooks for Progressive Web App functionality:
 * - usePWAInstall: Manage install prompt
 * - usePushNotifications: Manage push notification subscriptions
 * - useOnlineStatus: Track network connectivity
 * 
 * Features:
 * - Deferred install prompt
 * - Push subscription management
 * - Offline detection
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================
// Types
// ============================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallResult {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<boolean>;
}

interface UsePushNotificationsResult {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  subscribe: () => Promise<PushSubscription | null>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
}

interface UseOnlineStatusResult {
  isOnline: boolean;
  wasOffline: boolean;
}

// ============================================
// usePWAInstall Hook
// ============================================

export function usePWAInstall(): UsePWAInstallResult {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      const isInStandaloneMode = ('standalone' in window.navigator) && 
                                   (window.navigator as Navigator & { standalone: boolean }).standalone;
      setIsIOS(isIOSDevice && !isInStandaloneMode);
    };

    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = ('standalone' in window.navigator) && 
                             (window.navigator as Navigator & { standalone: boolean }).standalone;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    checkIOS();
    checkInstalled();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Install prompt error:', error);
      return false;
    }
  }, [installPrompt]);

  return {
    isInstallable: !!installPrompt,
    isInstalled,
    isIOS,
    promptInstall,
  };
}

// ============================================
// usePushNotifications Hook
// ============================================

export function usePushNotifications(
  vapidPublicKey?: string
): UsePushNotificationsResult {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    const checkSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false);
        return;
      }

      setIsSupported(true);
      setPermission(Notification.permission);

      // Check existing subscription
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }
    };

    void checkSupport();
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Permission request error:', error);
      return 'denied';
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported || !vapidPublicKey) return null;

    try {
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const result = await requestPermission();
        if (result !== 'granted') return null;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setIsSubscribed(true);
        return existingSubscription;
      }

      // Create new subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setIsSubscribed(true);

      // TODO: Send subscription to server
      // await fetch('/api/push/subscribe', {
      //   method: 'POST',
      //   body: JSON.stringify(subscription),
      //   headers: { 'Content-Type': 'application/json' },
      // });

      return subscription;
    } catch (error) {
      console.error('Push subscription error:', error);
      return null;
    }
  }, [isSupported, vapidPublicKey, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      const success = await subscription.unsubscribe();
      
      if (success) {
        setIsSubscribed(false);
        
        // TODO: Remove subscription from server
        // await fetch('/api/push/unsubscribe', {
        //   method: 'POST',
        //   body: JSON.stringify({ endpoint: subscription.endpoint }),
        //   headers: { 'Content-Type': 'application/json' },
        // });
      }

      return success;
    } catch (error) {
      console.error('Push unsubscription error:', error);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

// ============================================
// useOnlineStatus Hook
// ============================================

export function useOnlineStatus(): UseOnlineStatusResult {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Keep wasOffline true to show reconnection message
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
  };
}

// ============================================
// Utilities
// ============================================

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer as ArrayBuffer;
}

// ============================================
// Re-export from main hooks
// ============================================

export * from './index';
