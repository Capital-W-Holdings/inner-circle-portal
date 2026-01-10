'use client';

/**
 * OnboardingWizard Component
 * 
 * Progressive onboarding flow with three stages:
 * 1. Landing - Value preview, success stories, commission calculator
 * 2. Interest - Email capture, waitlist/instant access
 * 3. Setup - 4-step guided wizard
 * 
 * Features:
 * - Step progress indicator
 * - Form validation
 * - Loading/error states
 * - Commission calculator
 * - Animated transitions
 */

import React, { useState, useMemo } from 'react';
import { z } from 'zod';
import { cn, formatCurrency } from '@/lib/utils';
import { usePartnerInterest } from '@/hooks';

// ============================================
// Types
// ============================================

type OnboardingStage = 'landing' | 'interest' | 'setup';
type SetupStep = 1 | 2 | 3 | 4;

interface OnboardingWizardProps {
  onComplete?: (data: OnboardingData) => void;
  className?: string;
}

interface OnboardingData {
  email: string;
  name: string;
  company?: string;
  website?: string;
  referralSource: string;
  goals: string[];
}

interface FormErrors {
  email?: string;
  name?: string;
  company?: string;
  website?: string;
  referralSource?: string;
  goals?: string;
}

// ============================================
// Validation Schemas
// ============================================

const emailSchema = z.string().email('Please enter a valid email address');

// ============================================
// Constants
// ============================================

const SUCCESS_STORIES = [
  {
    name: 'Sarah Chen',
    role: 'Financial Advisor',
    quote: 'I earned $12,400 in my first three months just by sharing with my network.',
    avatar: '👩‍💼',
    earnings: 1240000,
  },
  {
    name: 'Marcus Johnson',
    role: 'Business Consultant',
    quote: 'The passive income from referrals has become a significant part of my business.',
    avatar: '👨‍💼',
    earnings: 2850000,
  },
  {
    name: 'Elena Rodriguez',
    role: 'Tech Entrepreneur',
    quote: 'Simple to share, easy to track, and the commissions are substantial.',
    avatar: '👩‍💻',
    earnings: 890000,
  },
];

const REFERRAL_SOURCES = [
  { value: 'friend', label: 'Friend or Colleague' },
  { value: 'social', label: 'Social Media' },
  { value: 'search', label: 'Search Engine' },
  { value: 'blog', label: 'Blog or Article' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'other', label: 'Other' },
];

const PARTNER_GOALS = [
  { value: 'passive_income', label: 'Generate passive income' },
  { value: 'help_network', label: 'Help my network access great services' },
  { value: 'grow_business', label: 'Grow my business offerings' },
  { value: 'side_hustle', label: 'Build a side hustle' },
  { value: 'replace_income', label: 'Eventually replace my income' },
];

// ============================================
// Sub-Components
// ============================================

function CommissionCalculator(): React.ReactElement {
  const [referrals, setReferrals] = useState(10);
  const [conversionRate] = useState(5);
  
  const monthlyEarnings = useMemo(() => {
    const conversions = Math.floor(referrals * (conversionRate / 100));
    const avgCommission = 35000; // $350 average
    return conversions * avgCommission;
  }, [referrals, conversionRate]);

  const yearlyEarnings = monthlyEarnings * 12;

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        💵 Commission Calculator
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referrals per month: <span className="text-primary-600 font-bold">{referrals}</span>
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={referrals}
            onChange={(e) => setReferrals(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>100</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary-200">
          <div>
            <p className="text-xs text-gray-500">Monthly Earnings</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyEarnings)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Yearly Earnings</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(yearlyEarnings)}
            </p>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 italic">
          *Based on {conversionRate}% conversion rate and $350 avg commission
        </p>
      </div>
    </div>
  );
}

function SuccessStoryCard({ 
  story 
}: { 
  story: typeof SUCCESS_STORIES[0];
}): React.ReactElement {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-2xl">
          {story.avatar}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{story.name}</p>
          <p className="text-sm text-gray-500">{story.role}</p>
        </div>
      </div>
      <p className="text-gray-600 text-sm italic mb-3">"{story.quote}"</p>
      <div className="flex items-center gap-2 text-green-600">
        <span className="text-lg">💰</span>
        <span className="font-bold">{formatCurrency(story.earnings)} earned</span>
      </div>
    </div>
  );
}

function StepIndicator({ 
  currentStep, 
  totalSteps 
}: { 
  currentStep: number; 
  totalSteps: number;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
              step < currentStep && 'bg-green-500 text-white',
              step === currentStep && 'bg-primary-600 text-white',
              step > currentStep && 'bg-gray-200 text-gray-500'
            )}
          >
            {step < currentStep ? '✓' : step}
          </div>
          {step < totalSteps && (
            <div
              className={cn(
                'w-8 h-1 mx-1',
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Stage Components
// ============================================

function LandingStage({ 
  onContinue 
}: { 
  onContinue: () => void;
}): React.ReactElement {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Earn Generous Commissions
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Join the Inner Circle partner program and earn up to 30% commission 
          on every referral. No limits, no caps, just earnings.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '💵', title: 'Up to 30% Commission', desc: 'Industry-leading rates' },
          { icon: '⚡', title: 'Instant Tracking', desc: 'Real-time click & conversion data' },
          { icon: '📅', title: 'Monthly Payouts', desc: 'Reliable, on-time payments' },
        ].map((benefit) => (
          <div key={benefit.title} className="text-center p-4">
            <div className="text-3xl mb-2">{benefit.icon}</div>
            <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
            <p className="text-sm text-gray-500">{benefit.desc}</p>
          </div>
        ))}
      </div>

      {/* Calculator */}
      <CommissionCalculator />

      {/* Success Stories */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Partner Success Stories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUCCESS_STORIES.map((story) => (
            <SuccessStoryCard key={story.name} story={story} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          type="button"
          onClick={onContinue}
          className={cn(
            'px-8 py-4 rounded-xl font-semibold text-lg',
            'bg-primary-600 text-white',
            'hover:bg-primary-700 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          )}
        >
          Get Started →
        </button>
        <p className="text-sm text-gray-500 mt-3">
          Free to join • No credit card required
        </p>
      </div>
    </div>
  );
}

function InterestStage({ 
  onContinue,
  onBack,
}: { 
  onContinue: (email: string, hasInvite: boolean) => void;
  onBack: () => void;
}): React.ReactElement {
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteField, setShowInviteField] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { submitInterest, isSubmitting, error: apiError } = usePartnerInterest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid email');
      return;
    }

    // Submit interest
    const interest = await submitInterest(email, inviteCode || undefined);
    
    if (interest) {
      const hasInstantAccess = interest.status === 'INSTANT_ACCESS' || interest.status === 'APPROVED';
      onContinue(email, hasInstantAccess);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        ← Back
      </button>

      <div className="text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Join the Inner Circle
        </h2>
        <p className="text-gray-600">
          Enter your email to get started. Have an invite code? 
          Skip the waitlist!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={cn(
              'w-full px-4 py-3 rounded-xl border text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'placeholder:text-gray-400',
              error || apiError ? 'border-red-300' : 'border-gray-200'
            )}
            required
          />
          {(error || apiError) && (
            <p className="mt-1 text-sm text-red-600">{error || apiError}</p>
          )}
        </div>

        {!showInviteField ? (
          <button
            type="button"
            onClick={() => setShowInviteField(true)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Have an invite code?
          </button>
        ) : (
          <div>
            <label htmlFor="invite" className="block text-sm font-medium text-gray-700 mb-1">
              Invite Code (optional)
            </label>
            <input
              id="invite"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="INNER2026"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 font-mono"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full px-6 py-3 rounded-xl font-semibold',
            'bg-primary-600 text-white',
            'hover:bg-primary-700 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : (
            inviteCode ? 'Get Instant Access' : 'Join Waitlist'
          )}
        </button>
      </form>

      <p className="text-xs text-center text-gray-500">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}

function SetupStage({ 
  email,
  onComplete,
  onBack,
}: { 
  email: string;
  onComplete: (data: OnboardingData) => void;
  onBack: () => void;
}): React.ReactElement {
  const [step, setStep] = useState<SetupStep>(1);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    website: '',
    referralSource: '',
    goals: [] as string[],
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = <K extends keyof typeof formData>(
    field: K, 
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal],
    }));
    setErrors(prev => ({ ...prev, goals: undefined }));
  };

  const validateStep = (): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (formData.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
    }

    if (step === 2) {
      if (formData.website && !formData.website.startsWith('http')) {
        newErrors.website = 'URL must start with http:// or https://';
      }
    }

    if (step === 3) {
      if (!formData.referralSource) {
        newErrors.referralSource = 'Please select an option';
      }
    }

    if (step === 4) {
      if (formData.goals.length === 0) {
        newErrors.goals = 'Please select at least one goal';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (step < 4) {
      setStep((step + 1) as SetupStep);
    } else {
      onComplete({
        email,
        ...formData,
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as SetupStep);
    } else {
      onBack();
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        ← Back
      </button>

      <StepIndicator currentStep={step} totalSteps={4} />

      {/* Step 1: Name */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">👋</div>
            <h2 className="text-xl font-bold text-gray-900">What's your name?</h2>
          </div>
          <div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Your full name"
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-gray-900 text-center text-lg',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                errors.name ? 'border-red-300' : 'border-gray-200'
              )}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 text-center">{errors.name}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Company (optional) */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🏢</div>
            <h2 className="text-xl font-bold text-gray-900">Tell us about your business</h2>
            <p className="text-sm text-gray-500">Optional, but helps us personalize your experience</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => updateField('company', e.target.value)}
              placeholder="Acme Inc."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://example.com"
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                errors.website ? 'border-red-300' : 'border-gray-200'
              )}
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-600">{errors.website}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Referral Source */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🔍</div>
            <h2 className="text-xl font-bold text-gray-900">How did you hear about us?</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {REFERRAL_SOURCES.map((source) => (
              <button
                key={source.value}
                type="button"
                onClick={() => updateField('referralSource', source.value)}
                className={cn(
                  'px-4 py-3 rounded-xl border text-sm font-medium transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  formData.referralSource === source.value
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                )}
              >
                {source.label}
              </button>
            ))}
          </div>
          {errors.referralSource && (
            <p className="text-sm text-red-600 text-center">{errors.referralSource}</p>
          )}
        </div>
      )}

      {/* Step 4: Goals */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🎯</div>
            <h2 className="text-xl font-bold text-gray-900">What are your goals?</h2>
            <p className="text-sm text-gray-500">Select all that apply</p>
          </div>
          <div className="space-y-2">
            {PARTNER_GOALS.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => toggleGoal(goal.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border text-left font-medium transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  formData.goals.includes(goal.value)
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center',
                    formData.goals.includes(goal.value)
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-gray-300'
                  )}>
                    {formData.goals.includes(goal.value) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {goal.label}
                </span>
              </button>
            ))}
          </div>
          {errors.goals && (
            <p className="text-sm text-red-600 text-center">{errors.goals}</p>
          )}
        </div>
      )}

      {/* Continue Button */}
      <button
        type="button"
        onClick={handleNext}
        className={cn(
          'w-full px-6 py-3 rounded-xl font-semibold',
          'bg-primary-600 text-white',
          'hover:bg-primary-700 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
        )}
      >
        {step === 4 ? 'Complete Setup' : 'Continue'}
      </button>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function OnboardingWizard({
  onComplete,
  className,
}: OnboardingWizardProps): React.ReactElement {
  const [stage, setStage] = useState<OnboardingStage>('landing');
  const [email, setEmail] = useState('');

  const handleInterestSubmit = (submittedEmail: string, hasInstantAccess: boolean) => {
    setEmail(submittedEmail);
    if (hasInstantAccess) {
      setStage('setup');
    } else {
      // Show waitlist confirmation (could be a separate stage)
      setStage('setup'); // For demo, proceed to setup
    }
  };

  const handleSetupComplete = (data: OnboardingData) => {
    onComplete?.(data);
  };

  return (
    <div className={cn('py-8 px-4', className)}>
      {stage === 'landing' && (
        <LandingStage onContinue={() => setStage('interest')} />
      )}
      {stage === 'interest' && (
        <InterestStage 
          onContinue={handleInterestSubmit}
          onBack={() => setStage('landing')}
        />
      )}
      {stage === 'setup' && (
        <SetupStage 
          email={email}
          onComplete={handleSetupComplete}
          onBack={() => setStage('interest')}
        />
      )}
    </div>
  );
}

export default OnboardingWizard;
