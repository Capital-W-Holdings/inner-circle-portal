'use client';

/**
 * ShareKit Component
 * 
 * One-tap share functionality with multiple platform support,
 * QR code generation, and pre-formatted share messages.
 * 
 * Features:
 * - Native Web Share API with fallback
 * - Platform-specific share buttons
 * - QR code for mobile sharing
 * - Pre-written message templates
 * - Copy to clipboard with feedback
 * - Loading and error states
 */

import React, { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { 
  SharePlatform, 
  ShareTemplate, 
  ShareResult
} from '@/types';
import { SHARE_TEMPLATES } from '@/types';
import { 
  buildShareUrl, 
  canUseWebShare, 
  canUseClipboard,
  cn,
  isMobileDevice 
} from '@/lib/utils';

// ============================================
// Types
// ============================================

interface ShareKitProps {
  referralCode: string;
  referralLink: string;
  partnerName?: string;
  onShareComplete?: (result: ShareResult) => void;
  onError?: (error: Error) => void;
  className?: string;
}

interface ShareButtonProps {
  platform: SharePlatform;
  icon: string;
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

// ============================================
// Sub-Components
// ============================================

function ShareButton({ 
  icon, 
  label, 
  onClick, 
  isLoading, 
  disabled 
}: ShareButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex flex-col items-center justify-center p-3 rounded-xl',
        'bg-gray-50 hover:bg-gray-100 transition-all duration-200',
        'border border-gray-200 hover:border-primary-300',
        'min-w-[72px] min-h-[72px]',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        isLoading && 'animate-pulse'
      )}
      aria-label={`Share on ${label}`}
    >
      <span className="text-2xl mb-1" role="img" aria-hidden="true">
        {icon}
      </span>
      <span className="text-xs text-gray-600 font-medium">{label}</span>
    </button>
  );
}

function CopyButton({ 
  text, 
  onCopy 
}: { 
  text: string; 
  onCopy: () => void;
}): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!canUseClipboard()) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        onCopy();
      } catch {
        console.error('Fallback copy failed');
      }
      document.body.removeChild(textArea);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text, onCopy]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        copied
          ? 'bg-success-500 text-white'
          : 'bg-primary-600 text-white hover:bg-primary-700'
      )}
      aria-label={copied ? 'Copied!' : 'Copy link'}
    >
      {copied ? (
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </span>
      )}
    </button>
  );
}

function MessageTemplate({ 
  template, 
  referralLink, 
  onUse 
}: { 
  template: ShareTemplate; 
  referralLink: string;
  onUse: (message: string) => void;
}): React.ReactElement {
  const formattedMessage = template.message.replace('{link}', referralLink);

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600 line-clamp-3">
            {formattedMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onUse(formattedMessage)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium',
            'bg-white border border-gray-300 text-gray-700',
            'hover:bg-gray-50 hover:border-primary-300',
            'transition-all duration-200 whitespace-nowrap',
            'focus:outline-none focus:ring-2 focus:ring-primary-500'
          )}
        >
          Use
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ShareKit({
  referralLink,
  partnerName,
  onShareComplete,
  onError,
  className,
}: ShareKitProps): React.ReactElement {
  const [loadingPlatform, setLoadingPlatform] = useState<SharePlatform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Track share for analytics
  const trackShare = useCallback(
    (platform: SharePlatform, success: boolean) => {
      if (success && onShareComplete) {
        onShareComplete({
          success: true,
          platform,
          timestamp: new Date(),
        });
      }
    },
    [onShareComplete]
  );

  // Handle native share (mobile)
  const handleNativeShare = useCallback(async () => {
    if (!canUseWebShare()) {
      setError('Web Share not supported on this device');
      return;
    }

    setLoadingPlatform('native');
    setError(null);

    try {
      await navigator.share({
        title: 'Join Inner Circle',
        text: `${partnerName ? `${partnerName} invited you to ` : ''}Join Inner Circle and unlock exclusive opportunities!`,
        url: referralLink,
      });
      trackShare('native', true);
    } catch (err) {
      // User cancelled - not an error
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Failed to share. Please try another method.');
        onError?.(err);
      }
    } finally {
      setLoadingPlatform(null);
    }
  }, [referralLink, partnerName, trackShare, onError]);

  // Handle platform-specific share
  const handlePlatformShare = useCallback(
    (platform: SharePlatform) => {
      setError(null);
      const shareText = `Check out Inner Circle! ${partnerName ? `Recommended by ${partnerName}.` : ''}`;
      const shareUrl = buildShareUrl(platform, shareText, referralLink);

      // Open share URL in new window
      const width = 600;
      const height = 400;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      window.open(
        shareUrl,
        'share',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      trackShare(platform, true);
    },
    [referralLink, partnerName, trackShare]
  );

  // Handle message template use
  const handleUseTemplate = useCallback(
    async (message: string) => {
      if (canUseClipboard()) {
        try {
          await navigator.clipboard.writeText(message);
          trackShare('copy', true);
        } catch {
          setError('Failed to copy message');
        }
      }
    },
    [trackShare]
  );

  // Handle copy link
  const handleCopyLink = useCallback(() => {
    trackShare('copy', true);
  }, [trackShare]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Link Display */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Your unique link
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-mono text-sm text-gray-800 truncate border border-gray-200">
            {referralLink}
          </div>
          <CopyButton text={referralLink} onCopy={handleCopyLink} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div 
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Quick Share Buttons */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Quick Share
        </label>
        <div className="flex flex-wrap gap-3">
          {/* Native Share (mobile priority) */}
          {isMobileDevice() && canUseWebShare() && (
            <ShareButton
              platform="native"
              icon="📤"
              label="Share"
              onClick={handleNativeShare}
              isLoading={loadingPlatform === 'native'}
            />
          )}
          
          {/* Platform buttons */}
          <ShareButton
            platform="twitter"
            icon="🐦"
            label="X"
            onClick={() => handlePlatformShare('twitter')}
          />
          <ShareButton
            platform="linkedin"
            icon="💼"
            label="LinkedIn"
            onClick={() => handlePlatformShare('linkedin')}
          />
          <ShareButton
            platform="whatsapp"
            icon="💬"
            label="WhatsApp"
            onClick={() => handlePlatformShare('whatsapp')}
          />
          <ShareButton
            platform="email"
            icon="✉️"
            label="Email"
            onClick={() => handlePlatformShare('email')}
          />
        </div>
      </div>

      {/* Pre-written Messages */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Pre-written messages
        </label>
        <div className="space-y-3">
          {SHARE_TEMPLATES.map((template) => (
            <MessageTemplate
              key={template.id}
              template={template}
              referralLink={referralLink}
              onUse={handleUseTemplate}
            />
          ))}
        </div>
      </div>

      {/* QR Code */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
        >
          <svg 
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              showQR && 'rotate-90'
            )} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          QR Code for mobile sharing
        </button>
        
        {showQR && (
          <div className="flex justify-center p-6 bg-white rounded-xl border border-gray-200 animate-fade-in">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <QRCodeSVG
                value={referralLink}
                size={160}
                level="H"
                includeMargin
                imageSettings={{
                  src: '/logo.png',
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShareKit;
