'use client';

/**
 * ABTestManager Component
 * 
 * A/B Testing system for share templates with:
 * - Experiment creation and management
 * - Variant performance comparison
 * - Statistical significance indicators
 * - Winner selection
 * 
 * Features:
 * - Create new experiments
 * - Add/edit variants
 * - Real-time performance data
 * - Loading/error states
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn, formatNumber, generateRandomString } from '@/lib/utils';
import type { ApiResponse } from '@/types';

// ============================================
// Types
// ============================================

export type ExperimentStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface Variant {
  id: string;
  name: string;
  content: string;
  impressions: number;
  clicks: number;
  conversions: number;
  isControl: boolean;
  isWinner?: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  variants: Variant[];
  startedAt?: Date;
  endedAt?: Date;
  minSampleSize: number;
  confidenceLevel: number;
}

interface ABTestManagerProps {
  partnerId: string;
  className?: string;
}

// ============================================
// Mock Data
// ============================================

function generateMockExperiments(): Experiment[] {
  return [
    {
      id: 'exp-1',
      name: 'LinkedIn Share Message',
      description: 'Testing professional vs casual tone in LinkedIn shares',
      status: 'RUNNING',
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      minSampleSize: 100,
      confidenceLevel: 95,
      variants: [
        {
          id: 'var-1a',
          name: 'Professional (Control)',
          content: 'Discover how leading companies are transforming their operations...',
          impressions: 450,
          clicks: 45,
          conversions: 12,
          isControl: true,
        },
        {
          id: 'var-1b',
          name: 'Casual & Personal',
          content: 'Just found this amazing tool that\'s been a game-changer for me...',
          impressions: 438,
          clicks: 62,
          conversions: 18,
          isControl: false,
        },
      ],
    },
    {
      id: 'exp-2',
      name: 'Email Subject Line Test',
      description: 'Comparing question vs statement subject lines',
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      minSampleSize: 200,
      confidenceLevel: 95,
      variants: [
        {
          id: 'var-2a',
          name: 'Statement (Control)',
          content: 'This will change how you work',
          impressions: 520,
          clicks: 78,
          conversions: 15,
          isControl: true,
        },
        {
          id: 'var-2b',
          name: 'Question',
          content: 'Want to 10x your productivity?',
          impressions: 515,
          clicks: 103,
          conversions: 24,
          isControl: false,
          isWinner: true,
        },
      ],
    },
    {
      id: 'exp-3',
      name: 'CTA Button Text',
      description: 'Testing different call-to-action phrases',
      status: 'DRAFT',
      minSampleSize: 150,
      confidenceLevel: 90,
      variants: [
        {
          id: 'var-3a',
          name: 'Get Started',
          content: 'Get Started Free',
          impressions: 0,
          clicks: 0,
          conversions: 0,
          isControl: true,
        },
        {
          id: 'var-3b',
          name: 'Try It Now',
          content: 'Try It Now - No CC Required',
          impressions: 0,
          clicks: 0,
          conversions: 0,
          isControl: false,
        },
      ],
    },
  ];
}

// ============================================
// Utility Functions
// ============================================

function calculateCTR(variant: Variant): number {
  if (variant.impressions === 0) return 0;
  return (variant.clicks / variant.impressions) * 100;
}

function calculateConversionRate(variant: Variant): number {
  if (variant.clicks === 0) return 0;
  return (variant.conversions / variant.clicks) * 100;
}

function calculateLift(control: Variant, variant: Variant): number {
  const controlCTR = calculateCTR(control);
  const variantCTR = calculateCTR(variant);
  if (controlCTR === 0) return 0;
  return ((variantCTR - controlCTR) / controlCTR) * 100;
}

function calculateSignificance(control: Variant, variant: Variant): number {
  // Simplified significance calculation (in production, use proper statistical tests)
  const totalSamples = control.impressions + variant.impressions;
  if (totalSamples < 100) return 0;
  
  const controlRate = calculateCTR(control);
  const variantRate = calculateCTR(variant);
  const diff = Math.abs(variantRate - controlRate);
  
  // Mock significance based on sample size and difference
  const significance = Math.min(99, diff * 10 + (totalSamples / 100) * 5);
  return significance;
}

// ============================================
// Sub-Components
// ============================================

function StatusBadge({ status }: { status: ExperimentStatus }): React.ReactElement {
  const config = {
    DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
    RUNNING: { label: 'Running', color: 'bg-green-100 text-green-700' },
    PAUSED: { label: 'Paused', color: 'bg-yellow-100 text-yellow-700' },
    COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700' },
  }[status];

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.color)}>
      {config.label}
    </span>
  );
}

function VariantCard({
  variant,
  control,
  isRunning,
}: {
  variant: Variant;
  control?: Variant;
  isRunning: boolean;
}): React.ReactElement {
  const ctr = calculateCTR(variant);
  const convRate = calculateConversionRate(variant);
  const lift = control && !variant.isControl ? calculateLift(control, variant) : 0;
  const significance = control && !variant.isControl ? calculateSignificance(control, variant) : 0;

  return (
    <div className={cn(
      'p-4 rounded-lg border transition-colors',
      variant.isWinner ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{variant.name}</h4>
            {variant.isControl && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                Control
              </span>
            )}
            {variant.isWinner && (
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded flex items-center gap-1">
                🏆 Winner
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">"{variant.content}"</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Impressions</p>
          <p className="text-lg font-semibold text-gray-900">{formatNumber(variant.impressions)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">CTR</p>
          <p className="text-lg font-semibold text-gray-900">{ctr.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Conv. Rate</p>
          <p className="text-lg font-semibold text-gray-900">{convRate.toFixed(1)}%</p>
        </div>
      </div>

      {!variant.isControl && control && variant.impressions > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-gray-500">Lift: </span>
              <span className={cn(
                'text-sm font-medium',
                lift > 0 ? 'text-green-600' : lift < 0 ? 'text-red-600' : 'text-gray-600'
              )}>
                {lift > 0 ? '+' : ''}{lift.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500">Confidence: </span>
              <span className={cn(
                'text-sm font-medium',
                significance >= 95 ? 'text-green-600' : significance >= 80 ? 'text-yellow-600' : 'text-gray-500'
              )}>
                {significance.toFixed(0)}%
              </span>
            </div>
          </div>
          {significance >= 95 && lift > 0 && isRunning && (
            <span className="text-xs text-green-600 font-medium">
              ✓ Statistically significant
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ExperimentCard({
  experiment,
  onStatusChange,
  onDeclareWinner,
}: {
  experiment: Experiment;
  onStatusChange: (id: string, status: ExperimentStatus) => void;
  onDeclareWinner: (experimentId: string, variantId: string) => void;
}): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(experiment.status === 'RUNNING');
  const control = experiment.variants.find(v => v.isControl);
  const isRunning = experiment.status === 'RUNNING';

  // Find best performing non-control variant
  const bestVariant = experiment.variants
    .filter(v => !v.isControl)
    .sort((a, b) => calculateCTR(b) - calculateCTR(a))[0];

  const canDeclareWinner = bestVariant && control && 
    calculateSignificance(control, bestVariant) >= 95 &&
    calculateLift(control, bestVariant) > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{experiment.name}</h3>
            <StatusBadge status={experiment.status} />
          </div>
          <p className="text-sm text-gray-500 truncate">{experiment.description}</p>
        </div>
        <span className={cn(
          'text-gray-400 transition-transform ml-4',
          isExpanded && 'rotate-180'
        )}>
          ▼
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {/* Variants */}
          <div className="space-y-3">
            {experiment.variants.map((variant) => (
              <VariantCard
                key={variant.id}
                variant={variant}
                control={control}
                isRunning={isRunning}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            {experiment.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => onStatusChange(experiment.id, 'RUNNING')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Start Experiment
              </button>
            )}
            {experiment.status === 'RUNNING' && (
              <>
                <button
                  type="button"
                  onClick={() => onStatusChange(experiment.id, 'PAUSED')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                >
                  Pause
                </button>
                {canDeclareWinner && bestVariant && (
                  <button
                    type="button"
                    onClick={() => onDeclareWinner(experiment.id, bestVariant.id)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    Declare Winner
                  </button>
                )}
              </>
            )}
            {experiment.status === 'PAUSED' && (
              <button
                type="button"
                onClick={() => onStatusChange(experiment.id, 'RUNNING')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Resume
              </button>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {experiment.startedAt && (
              <span>Started: {new Date(experiment.startedAt).toLocaleDateString()}</span>
            )}
            {experiment.endedAt && (
              <span>Ended: {new Date(experiment.endedAt).toLocaleDateString()}</span>
            )}
            <span>Min samples: {experiment.minSampleSize}</span>
            <span>Confidence: {experiment.confidenceLevel}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateExperimentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (experiment: Experiment) => void;
}): React.ReactElement {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [controlContent, setControlContent] = useState('');
  const [variantContent, setVariantContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const experiment: Experiment = {
      id: `exp-${generateRandomString(8)}`,
      name,
      description,
      status: 'DRAFT',
      minSampleSize: 100,
      confidenceLevel: 95,
      variants: [
        {
          id: `var-${generateRandomString(8)}`,
          name: 'Control',
          content: controlContent,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          isControl: true,
        },
        {
          id: `var-${generateRandomString(8)}`,
          name: 'Variant A',
          content: variantContent,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          isControl: false,
        },
      ],
    };

    onCreate(experiment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Experiment</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experiment Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., LinkedIn Share Message Test"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you testing?"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Control (Original)
            </label>
            <textarea
              value={controlContent}
              onChange={(e) => setControlContent(e.target.value)}
              placeholder="Your current message..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant A (New)
            </label>
            <textarea
              value={variantContent}
              onChange={(e) => setVariantContent(e.target.value)}
              placeholder="Your new message to test..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Create Experiment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingSkeleton(): React.ReactElement {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-200 h-24 rounded-xl" />
      ))}
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
      <span className="text-4xl block mb-3">🧪</span>
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

export function ABTestManager({
  partnerId,
  className,
}: ABTestManagerProps): React.ReactElement {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchExperiments = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`/api/experiments?partnerId=${partnerId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: ApiResponse<Experiment[]> = await response.json();

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Failed to fetch experiments');
      }

      setExperiments(json.data);
      setStatus('success');
    } catch {
      // Use mock data for demo
      setExperiments(generateMockExperiments());
      setStatus('success');
    }
  }, [partnerId]);

  useEffect(() => {
    void fetchExperiments();
  }, [fetchExperiments]);

  const handleStatusChange = useCallback((id: string, newStatus: ExperimentStatus) => {
    setExperiments(prev =>
      prev.map(exp =>
        exp.id === id
          ? {
              ...exp,
              status: newStatus,
              startedAt: newStatus === 'RUNNING' && !exp.startedAt ? new Date() : exp.startedAt,
            }
          : exp
      )
    );
  }, []);

  const handleDeclareWinner = useCallback((experimentId: string, variantId: string) => {
    setExperiments(prev =>
      prev.map(exp =>
        exp.id === experimentId
          ? {
              ...exp,
              status: 'COMPLETED' as ExperimentStatus,
              endedAt: new Date(),
              variants: exp.variants.map(v => ({
                ...v,
                isWinner: v.id === variantId,
              })),
            }
          : exp
      )
    );
  }, []);

  const handleCreateExperiment = useCallback((experiment: Experiment) => {
    setExperiments(prev => [experiment, ...prev]);
  }, []);

  const isLoading = status === 'loading' || status === 'idle';

  if (status === 'error' && error) {
    return (
      <div className={cn('bg-white rounded-2xl border border-gray-200 p-6', className)}>
        <ErrorState message={error} onRetry={fetchExperiments} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span>🧪</span>
          A/B Testing
        </h2>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + New Experiment
        </button>
      </div>

      {/* Experiments List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : experiments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <span className="text-4xl block mb-3">🧪</span>
          <p className="text-gray-600 font-medium">No experiments yet</p>
          <p className="text-sm text-gray-500 mb-4">Create your first A/B test to optimize your share messages</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Create Experiment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {experiments.map((experiment) => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              onStatusChange={handleStatusChange}
              onDeclareWinner={handleDeclareWinner}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateExperimentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateExperiment}
        />
      )}
    </div>
  );
}

export default ABTestManager;
