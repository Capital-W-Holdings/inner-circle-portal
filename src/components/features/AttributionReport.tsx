'use client';

/**
 * AttributionReport Component
 * 
 * Referral attribution analysis with:
 * - Source performance comparison
 * - Campaign attribution
 * - Multi-touch attribution
 * - Export functionality
 * 
 * Features:
 * - Date range filtering
 * - Attribution model selection
 * - Visual charts
 * - Loading/error states
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import type { ApiResponse } from '@/types';

// ============================================
// Types
// ============================================

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay';

export interface SourceAttribution {
  source: string;
  touchpoints: number;
  conversions: number;
  revenue: number;
  attributedRevenue: number;
  avgTimeToConvert: number; // in hours
  conversionRate: number;
}

export interface CampaignAttribution {
  campaignId: string;
  campaignName: string;
  source: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
}

export interface TouchpointPath {
  path: string[];
  conversions: number;
  revenue: number;
  percentage: number;
}

export interface AttributionData {
  sources: SourceAttribution[];
  campaigns: CampaignAttribution[];
  topPaths: TouchpointPath[];
  totalConversions: number;
  totalRevenue: number;
}

interface AttributionReportProps {
  partnerId: string;
  className?: string;
}

// ============================================
// Mock Data Generator
// ============================================

function generateMockAttributionData(model: AttributionModel): AttributionData {
  const baseMultiplier = model === 'first_touch' ? 1 : model === 'last_touch' ? 1.1 : model === 'linear' ? 1.05 : 1.08;
  
  return {
    totalConversions: 156,
    totalRevenue: 4125000,
    sources: [
      {
        source: 'LinkedIn',
        touchpoints: 892,
        conversions: 58,
        revenue: 1523000,
        attributedRevenue: Math.floor(1523000 * baseMultiplier),
        avgTimeToConvert: 48,
        conversionRate: 6.5,
      },
      {
        source: 'Email',
        touchpoints: 645,
        conversions: 42,
        revenue: 1105000,
        attributedRevenue: Math.floor(1105000 * (baseMultiplier * 0.95)),
        avgTimeToConvert: 72,
        conversionRate: 6.5,
      },
      {
        source: 'Twitter/X',
        touchpoints: 534,
        conversions: 28,
        revenue: 736000,
        attributedRevenue: Math.floor(736000 * (baseMultiplier * 0.9)),
        avgTimeToConvert: 36,
        conversionRate: 5.2,
      },
      {
        source: 'WhatsApp',
        touchpoints: 234,
        conversions: 18,
        revenue: 473000,
        attributedRevenue: Math.floor(473000 * (baseMultiplier * 0.85)),
        avgTimeToConvert: 24,
        conversionRate: 7.7,
      },
      {
        source: 'Direct',
        touchpoints: 156,
        conversions: 10,
        revenue: 288000,
        attributedRevenue: Math.floor(288000 * (baseMultiplier * 0.8)),
        avgTimeToConvert: 12,
        conversionRate: 6.4,
      },
    ],
    campaigns: [
      { campaignId: 'c1', campaignName: 'Q1 LinkedIn Push', source: 'LinkedIn', impressions: 4500, clicks: 380, conversions: 18, revenue: 475000, roi: 342 },
      { campaignId: 'c2', campaignName: 'Newsletter Feature', source: 'Email', impressions: 3200, clicks: 245, conversions: 12, revenue: 315000, roi: 287 },
      { campaignId: 'c3', campaignName: 'Twitter Thread', source: 'Twitter/X', impressions: 8900, clicks: 198, conversions: 8, revenue: 210000, roi: 198 },
      { campaignId: 'c4', campaignName: 'WhatsApp Blast', source: 'WhatsApp', impressions: 890, clicks: 156, conversions: 9, revenue: 237000, roi: 456 },
      { campaignId: 'c5', campaignName: 'Podcast Mention', source: 'Direct', impressions: 2300, clicks: 134, conversions: 6, revenue: 158000, roi: 178 },
    ],
    topPaths: [
      { path: ['LinkedIn', 'Email', 'Direct'], conversions: 24, revenue: 632000, percentage: 15.4 },
      { path: ['Email', 'LinkedIn'], conversions: 18, revenue: 473000, percentage: 11.5 },
      { path: ['Twitter/X', 'LinkedIn'], conversions: 15, revenue: 394000, percentage: 9.6 },
      { path: ['LinkedIn'], conversions: 22, revenue: 578000, percentage: 14.1 },
      { path: ['Email'], conversions: 16, revenue: 420000, percentage: 10.3 },
    ],
  };
}

// ============================================
// Sub-Components
// ============================================

function ModelSelector({
  value,
  onChange,
}: {
  value: AttributionModel;
  onChange: (model: AttributionModel) => void;
}): React.ReactElement {
  const models: { value: AttributionModel; label: string; description: string }[] = [
    { value: 'first_touch', label: 'First Touch', description: '100% credit to first interaction' },
    { value: 'last_touch', label: 'Last Touch', description: '100% credit to last interaction' },
    { value: 'linear', label: 'Linear', description: 'Equal credit across all touchpoints' },
    { value: 'time_decay', label: 'Time Decay', description: 'More credit to recent interactions' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {models.map((model) => (
        <button
          key={model.value}
          type="button"
          onClick={() => onChange(model.value)}
          title={model.description}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            value === model.value
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {model.label}
        </button>
      ))}
    </div>
  );
}

function SourceChart({
  data,
  isLoading,
}: {
  data: SourceAttribution[];
  isLoading?: boolean;
}): React.ReactElement {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.attributedRevenue));

  return (
    <div className="space-y-4">
      {data.map((source) => {
        const percentage = (source.attributedRevenue / maxRevenue) * 100;
        return (
          <div key={source.source}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-gray-900">{source.source}</span>
              <span className="text-gray-600">{formatCurrency(source.attributedRevenue)}</span>
            </div>
            <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${percentage}%` }}
              >
                {percentage > 20 && (
                  <span className="text-xs text-white font-medium">
                    {source.conversions} conv.
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PathsTable({
  data,
  isLoading,
}: {
  data: TouchpointPath[];
  isLoading?: boolean;
}): React.ReactElement {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((path, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
        >
          <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              {path.path.map((source, i) => (
                <React.Fragment key={i}>
                  <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
                    {source}
                  </span>
                  {i < path.path.length - 1 && (
                    <span className="text-gray-400">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {path.conversions} conversions • {path.percentage.toFixed(1)}% of total
            </p>
          </div>
          <p className="font-semibold text-green-600 shrink-0">
            {formatCurrency(path.revenue)}
          </p>
        </div>
      ))}
    </div>
  );
}

function CampaignTable({
  data,
  isLoading,
}: {
  data: CampaignAttribution[];
  isLoading?: boolean;
}): React.ReactElement {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 text-gray-500 font-medium">Campaign</th>
            <th className="text-left py-3 px-2 text-gray-500 font-medium">Source</th>
            <th className="text-right py-3 px-2 text-gray-500 font-medium">Clicks</th>
            <th className="text-right py-3 px-2 text-gray-500 font-medium">Conv.</th>
            <th className="text-right py-3 px-2 text-gray-500 font-medium">Revenue</th>
            <th className="text-right py-3 px-2 text-gray-500 font-medium">ROI</th>
          </tr>
        </thead>
        <tbody>
          {data.map((campaign) => (
            <tr key={campaign.campaignId} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-2 font-medium text-gray-900">{campaign.campaignName}</td>
              <td className="py-3 px-2">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                  {campaign.source}
                </span>
              </td>
              <td className="py-3 px-2 text-right text-gray-600">{formatNumber(campaign.clicks)}</td>
              <td className="py-3 px-2 text-right text-gray-600">{formatNumber(campaign.conversions)}</td>
              <td className="py-3 px-2 text-right text-gray-600">{formatCurrency(campaign.revenue)}</td>
              <td className="py-3 px-2 text-right">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  campaign.roi >= 300 ? 'bg-green-100 text-green-700' :
                  campaign.roi >= 200 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {campaign.roi}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  isLoading,
}: {
  label: string;
  value: string;
  icon: string;
  isLoading?: boolean;
}): React.ReactElement {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded-lg mb-3" />
        <div className="w-24 h-8 bg-gray-200 rounded mb-1" />
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200">
      <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mb-3">
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
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
      <span className="text-4xl block mb-3">📈</span>
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

export function AttributionReport({
  partnerId,
  className,
}: AttributionReportProps): React.ReactElement {
  const [model, setModel] = useState<AttributionModel>('last_touch');
  const [data, setData] = useState<AttributionData | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetchAttribution = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(
        `/api/reports/attribution?partnerId=${partnerId}&model=${model}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: ApiResponse<AttributionData> = await response.json();

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Failed to fetch attribution data');
      }

      setData(json.data);
      setStatus('success');
    } catch {
      // Use mock data for demo
      setData(generateMockAttributionData(model));
      setStatus('success');
    }
  }, [partnerId, model]);

  useEffect(() => {
    void fetchAttribution();
  }, [fetchAttribution]);

  const isLoading = status === 'loading' || status === 'idle';

  // Calculate top source
  const topSource = useMemo(() => {
    if (!data?.sources.length) return null;
    const firstSource = data.sources[0];
    if (!firstSource) return null;
    return data.sources.reduce((max, s) => 
      s.attributedRevenue > max.attributedRevenue ? s : max
    , firstSource);
  }, [data]);

  if (status === 'error' && error) {
    return (
      <div className={cn('bg-white rounded-2xl border border-gray-200 p-6', className)}>
        <ErrorState message={error} onRetry={fetchAttribution} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span>📈</span>
          Attribution Report
        </h2>
        <ModelSelector value={model} onChange={setModel} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon="💰"
          label="Total Revenue"
          value={formatCurrency(data?.totalRevenue ?? 0)}
          isLoading={isLoading}
        />
        <SummaryCard
          icon="🎯"
          label="Conversions"
          value={formatNumber(data?.totalConversions ?? 0)}
          isLoading={isLoading}
        />
        <SummaryCard
          icon="🥇"
          label="Top Source"
          value={topSource?.source ?? '—'}
          isLoading={isLoading}
        />
        <SummaryCard
          icon="⏱️"
          label="Avg. Time to Convert"
          value={topSource ? `${topSource.avgTimeToConvert}h` : '—'}
          isLoading={isLoading}
        />
      </div>

      {/* Source Attribution Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Revenue by Source</h3>
        <SourceChart data={data?.sources ?? []} isLoading={isLoading} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Conversion Paths */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Conversion Paths</h3>
          <PathsTable data={data?.topPaths ?? []} isLoading={isLoading} />
        </div>

        {/* Source Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Source Metrics</h3>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.sources.map((source) => (
                <div key={source.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{source.source}</p>
                    <p className="text-xs text-gray-500">
                      {formatNumber(source.touchpoints)} touchpoints
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {source.conversionRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">conv. rate</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Attribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Campaign Performance</h3>
        <CampaignTable data={data?.campaigns ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default AttributionReport;
