/**
 * QR Code Generator Component
 * Generates and displays QR codes for referral links
 */

'use client';

import React, { useCallback, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  logoUrl?: string;
  fgColor?: string;
  bgColor?: string;
  campaignName?: string;
  className?: string;
  showDownload?: boolean;
  showCopy?: boolean;
}

// ============================================
// QR Code Generator Component
// ============================================

export function QRCodeGenerator({
  url,
  size = 200,
  logoUrl,
  fgColor = '#1f2937',
  bgColor = '#ffffff',
  campaignName,
  className,
  showDownload = true,
  showCopy = true,
}: QRCodeGeneratorProps): React.ReactElement {
  const svgRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Download QR code as PNG
  const handleDownload = useCallback(async () => {
    if (!svgRef.current) return;

    setDownloading(true);

    try {
      const svg = svgRef.current.querySelector('svg');
      if (!svg) return;

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size with padding
      const padding = 20;
      canvas.width = size + padding * 2;
      canvas.height = size + padding * 2;

      // Fill background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Convert SVG to image
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, padding, padding, size, size);
        URL.revokeObjectURL(svgUrl);

        // Download
        const link = document.createElement('a');
        const filename = campaignName
          ? `qr-${campaignName.toLowerCase().replace(/\s+/g, '-')}.png`
          : 'qr-code.png';
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();

        setDownloading(false);
      };
      img.src = svgUrl;
    } catch (error) {
      console.error('Failed to download QR code:', error);
      setDownloading(false);
    }
  }, [size, bgColor, campaignName]);

  // Copy URL to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  }, [url]);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* QR Code */}
      <div
        ref={svgRef}
        className="p-4 bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <QRCodeSVG
          value={url}
          size={size}
          fgColor={fgColor}
          bgColor={bgColor}
          level="H"
          includeMargin={false}
          imageSettings={logoUrl ? {
            src: logoUrl,
            height: size * 0.2,
            width: size * 0.2,
            excavate: true,
          } : undefined}
        />
      </div>

      {/* Campaign name */}
      {campaignName && (
        <p className="mt-3 text-sm font-medium text-gray-900">{campaignName}</p>
      )}

      {/* URL preview */}
      <p className="mt-1 text-xs text-gray-500 max-w-[250px] truncate">{url}</p>

      {/* Action buttons */}
      {(showDownload || showCopy) && (
        <div className="flex gap-2 mt-4">
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {copied ? '✓ Copied' : 'Copy Link'}
            </button>
          )}
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
                'bg-primary-600 text-white hover:bg-primary-700',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {downloading ? 'Saving...' : 'Download PNG'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Compact QR Code (for lists)
// ============================================

interface CompactQRCodeProps {
  url: string;
  size?: number;
  onClick?: () => void;
  className?: string;
}

export function CompactQRCode({
  url,
  size = 48,
  onClick,
  className,
}: CompactQRCodeProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-1 bg-white rounded border border-gray-200',
        'hover:border-primary-300 hover:shadow-sm transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary-500',
        className
      )}
      title="Click to expand QR code"
    >
      <QRCodeSVG
        value={url}
        size={size}
        level="L"
        includeMargin={false}
      />
    </button>
  );
}

// ============================================
// QR Code Modal
// ============================================

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  campaignName?: string;
}

export function QRCodeModal({
  isOpen,
  onClose,
  url,
  campaignName,
}: QRCodeModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 shadow-xl max-w-sm mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {campaignName || 'QR Code'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <QRCodeGenerator
          url={url}
          size={250}
          campaignName={campaignName}
          showDownload
          showCopy
        />
      </div>
    </div>
  );
}

export default QRCodeGenerator;
