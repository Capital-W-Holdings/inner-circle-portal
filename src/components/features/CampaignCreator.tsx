'use client';

/**
 * CampaignCreator Component
 * 
 * Smart link generator for campaign-specific tracking.
 * Allows partners to create unique tracking links for different channels.
 * 
 * Features:
 * - Campaign name input with validation
 * - Source selection (LinkedIn, Twitter, etc.)
 * - Generated link preview
 * - Copy to clipboard
 * - Campaign list management
 * - Loading and error states
 */

import React, { useState, useCallback } from 'react';
import type { 
  Campaign, 
  CampaignSource, 
  LoadingState,
  ApiResponse 
} from '@/types';
import { CAMPAIGN_SOURCES } from '@/types';
import { 
  cn, 
  buildReferralLink,
  slugify,
  canUseClipboard 
} from '@/lib/utils';
import { createCampaignSchema } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface CampaignCreatorProps {
  partnerId: string;
  referralCode: string;
  baseUrl: string;
  existingCampaigns?: Campaign[];
  onCampaignCreated?: (campaign: Campaign) => void;
  onShowQR?: (url: string, name?: string) => void;
  onError?: (error: Error) => void;
  isCreating?: boolean;
  className?: string;
}

interface FormState {
  name: string;
  source: CampaignSource;
}

interface ValidationErrors {
  name?: string;
  source?: string;
}

// ============================================
// Sub-Components
// ============================================

function SourceSelector({
  value,
  onChange,
  error,
}: {
  value: CampaignSource;
  onChange: (source: CampaignSource) => void;
  error?: string;
}): React.ReactElement {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Source
      </label>
      <div className="grid grid-cols-4 gap-2">
        {CAMPAIGN_SOURCES.map((source) => (
          <button
            key={source.value}
            type="button"
            onClick={() => onChange(source.value)}
            className={cn(
              'flex flex-col items-center justify-center p-3 rounded-xl',
              'border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              value === source.value
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
            )}
            aria-pressed={value === source.value}
          >
            <span className="text-xl mb-1" role="img" aria-hidden="true">
              {source.icon}
            </span>
            <span className="text-xs font-medium">{source.label}</span>
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}

function CampaignCard({
  campaign,
  onCopy,
  onShowQR,
}: {
  campaign: Campaign;
  onCopy: (link: string) => void;
  onShowQR?: (url: string, name?: string) => void;
}): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await onCopy(campaign.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [campaign.link, onCopy]);

  const sourceConfig = CAMPAIGN_SOURCES.find(s => s.value === campaign.source);

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl" role="img" aria-hidden="true">
            {sourceConfig?.icon ?? '📌'}
          </span>
          <div className="min-w-0">
            <h4 className="font-medium text-gray-900 truncate">
              {campaign.name}
            </h4>
            <p className="text-xs text-gray-500">
              {campaign.clicks} clicks • {campaign.conversions} conversions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onShowQR && (
            <button
              type="button"
              onClick={() => onShowQR(campaign.link, campaign.name)}
              className="p-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Show QR Code"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              copied
                ? 'bg-success-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkPreview({
  link,
  isValid,
}: {
  link: string;
  isValid: boolean;
}): React.ReactElement {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Generated Link
      </label>
      <div 
        className={cn(
          'px-4 py-3 rounded-xl font-mono text-sm truncate border',
          isValid
            ? 'bg-success-50 border-success-200 text-success-800'
            : 'bg-gray-100 border-gray-200 text-gray-500'
        )}
      >
        {isValid ? link : 'Enter a campaign name to generate link...'}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function CampaignCreator({
  partnerId,
  referralCode,
  baseUrl,
  existingCampaigns = [],
  onCampaignCreated,
  onShowQR,
  onError,
  isCreating: externalIsCreating,
  className,
}: CampaignCreatorProps): React.ReactElement {
  // Form state
  const [form, setForm] = useState<FormState>({
    name: '',
    source: 'LINKEDIN',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [status, setStatus] = useState<LoadingState>('idle');
  const [campaigns, setCampaigns] = useState<Campaign[]>(existingCampaigns);

  // Use external isCreating if provided
  const isCreating = externalIsCreating || status === 'loading';

  // Generate campaign ID from name
  const campaignId = form.name.trim() ? slugify(form.name) : '';
  const previewLink = campaignId 
    ? buildReferralLink(baseUrl, referralCode, campaignId)
    : '';

  // Validate form
  const validateForm = useCallback((): boolean => {
    const result = createCampaignSchema.safeParse(form);
    
    if (!result.success) {
      const fieldErrors: ValidationErrors = {};
      const flatErrors = result.error.flatten();
      if (flatErrors.fieldErrors.name) {
        fieldErrors.name = flatErrors.fieldErrors.name[0];
      }
      if (flatErrors.fieldErrors.source) {
        fieldErrors.source = flatErrors.fieldErrors.source[0];
      }
      setErrors(fieldErrors);
      return false;
    }
    
    // Check for duplicate campaign names
    const isDuplicate = campaigns.some(
      c => slugify(c.name) === campaignId
    );
    if (isDuplicate) {
      setErrors({ name: 'A campaign with this name already exists' });
      return false;
    }

    setErrors({});
    return true;
  }, [form, campaigns, campaignId]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setStatus('loading');
    
    try {
      // API call to create campaign
      const response = await fetch(`/api/partners/${partnerId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          source: form.source,
        }),
      });

      const data: ApiResponse<Campaign> = await response.json();

      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.error?.message ?? 'Failed to create campaign');
      }

      // Update local state
      setCampaigns(prev => [data.data!, ...prev]);
      setForm({ name: '', source: 'LINKEDIN' });
      setStatus('success');
      onCampaignCreated?.(data.data);

      // Reset status after animation
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      const error = err instanceof Error ? err : new Error('Unknown error');
      onError?.(error);
      
      // Reset status after showing error
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [partnerId, form, validateForm, onCampaignCreated, onError]);

  // Handle input changes
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, name: e.target.value }));
    setErrors(prev => ({ ...prev, name: undefined }));
  }, []);

  const handleSourceChange = useCallback((source: CampaignSource) => {
    setForm(prev => ({ ...prev, source }));
    setErrors(prev => ({ ...prev, source: undefined }));
  }, []);

  // Handle copy link
  const handleCopyLink = useCallback(async (link: string) => {
    if (!canUseClipboard()) return;
    
    try {
      await navigator.clipboard.writeText(link);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Campaign Name Input */}
        <div className="space-y-2">
          <label 
            htmlFor="campaign-name"
            className="block text-sm font-medium text-gray-700"
          >
            Campaign Name
          </label>
          <input
            id="campaign-name"
            type="text"
            value={form.name}
            onChange={handleNameChange}
            placeholder="e.g., LinkedIn Q1 2026"
            maxLength={50}
            className={cn(
              'w-full px-4 py-3 rounded-xl border text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'placeholder:text-gray-400',
              errors.name 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-200 bg-white'
            )}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-600" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        {/* Source Selector */}
        <SourceSelector
          value={form.source}
          onChange={handleSourceChange}
          error={errors.source}
        />

        {/* Link Preview */}
        <LinkPreview
          link={previewLink}
          isValid={!!campaignId && !errors.name}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isCreating || !form.name.trim()}
          className={cn(
            'w-full px-6 py-3 rounded-xl font-semibold transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            isCreating && 'opacity-75 cursor-wait',
            status === 'success' && 'bg-success-500 text-white',
            status === 'error' && 'bg-red-500 text-white',
            status === 'idle' && !isCreating && 'bg-primary-600 text-white hover:bg-primary-700',
            !form.name.trim() && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isCreating && (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" cy="12" r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating...
            </span>
          )}
          {status === 'success' && !isCreating && '✓ Created!'}
          {status === 'error' && !isCreating && 'Failed - Try Again'}
          {status === 'idle' && !isCreating && 'Create Campaign Link'}
        </button>
      </form>

      {/* Existing Campaigns */}
      {campaigns.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Your Campaign Links
          </h3>
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onCopy={handleCopyLink}
                onShowQR={onShowQR}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignCreator;
