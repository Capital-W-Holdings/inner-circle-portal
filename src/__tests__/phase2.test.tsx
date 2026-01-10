import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';

// Components
import { StatsDashboard } from '@/components/features/StatsDashboard';
import { OnboardingWizard } from '@/components/features/OnboardingWizard';
import { Leaderboard } from '@/components/features/Leaderboard';

// Hooks
import { useFetch, usePartnerStats, usePartnerInterest } from '@/hooks';

// Types
import type { PartnerStats } from '@/types';

// ============================================
// Mock Data
// ============================================

const mockStats: PartnerStats = {
  totalEarned: 1245000,
  pendingPayout: 234000,
  totalReferrals: 156,
  referralsThisMonth: 47,
  clicksThisMonth: 892,
  conversionRate: 5.27,
  recentActivity: [
    {
      id: 'act-1',
      type: 'CONVERSION',
      title: 'New referral converted',
      description: 'John Smith signed up',
      amount: 45000,
      timestamp: new Date(),
    },
    {
      id: 'act-2',
      type: 'PAYOUT',
      title: 'Payout processed',
      description: 'Monthly payout sent',
      amount: 120000,
      timestamp: new Date(),
    },
  ],
};

// ============================================
// Hook Tests
// ============================================

describe('useFetch Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should start in idle state', () => {
    const { result } = renderHook(() => useFetch<unknown>(null));
    
    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch data successfully', async () => {
    const mockData = { foo: 'bar' };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    const { result } = renderHook(() => useFetch<typeof mockData>('/api/test'));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(() => useFetch<unknown>('/api/test'));

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toContain('500');
  });

  it('should support refetch', async () => {
    const mockData = { count: 1 };
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { count: 2 } }),
      });

    const { result } = renderHook(() => useFetch<typeof mockData>('/api/test'));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual({ count: 2 });
  });
});

describe('usePartnerStats Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should not fetch when partnerId is null', () => {
    renderHook(() => usePartnerStats(null));
    
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('should fetch stats for valid partnerId', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockStats }),
    });

    const { result } = renderHook(() => usePartnerStats('partner-123'));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/partners/partner-123/stats');
    expect(result.current.data).toEqual(mockStats);
  });
});

describe('usePartnerInterest Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should submit interest successfully', async () => {
    const mockInterest = {
      id: 'interest_123',
      email: 'test@example.com',
      status: 'WAITLIST',
      createdAt: new Date(),
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockInterest }),
    });

    const { result } = renderHook(() => usePartnerInterest());

    expect(result.current.isSubmitting).toBe(false);

    let interest;
    await act(async () => {
      interest = await result.current.submitInterest('test@example.com');
    });

    expect(interest).toEqual(mockInterest);
    expect(result.current.error).toBeNull();
  });

  it('should handle submission errors', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: 'Invalid email' } }),
    });

    const { result } = renderHook(() => usePartnerInterest());

    await act(async () => {
      await result.current.submitInterest('invalid');
    });

    expect(result.current.error).toBe('Invalid email');
  });
});

// ============================================
// StatsDashboard Tests
// ============================================

describe('StatsDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should show loading skeleton initially', () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<StatsDashboard partnerId="partner-123" />);
    
    // Should show loading state (skeleton)
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('should display stats when loaded', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockStats }),
    });

    render(<StatsDashboard partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('$12,450.00')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Earned')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText('892')).toBeInTheDocument();
    expect(screen.getByText('5.3%')).toBeInTheDocument();
  });

  it('should show error state on failure', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    render(<StatsDashboard partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('should show recent activity', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockStats }),
    });

    render(<StatsDashboard partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    expect(screen.getByText('New referral converted')).toBeInTheDocument();
    expect(screen.getByText('Payout processed')).toBeInTheDocument();
  });
});

// ============================================
// OnboardingWizard Tests
// ============================================

describe('OnboardingWizard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should render landing stage initially', () => {
    render(<OnboardingWizard />);
    
    expect(screen.getByText('Earn Generous Commissions')).toBeInTheDocument();
    expect(screen.getByText('Get Started →')).toBeInTheDocument();
  });

  it('should show commission calculator', () => {
    render(<OnboardingWizard />);
    
    expect(screen.getByText('💵 Commission Calculator')).toBeInTheDocument();
  });

  it('should show success stories', () => {
    render(<OnboardingWizard />);
    
    expect(screen.getByText('Partner Success Stories')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
  });

  it('should navigate to interest stage', () => {
    render(<OnboardingWizard />);
    
    fireEvent.click(screen.getByText('Get Started →'));
    
    expect(screen.getByText('Join the Inner Circle')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('should validate email on interest form', async () => {
    render(<OnboardingWizard />);
    
    fireEvent.click(screen.getByText('Get Started →'));
    
    const emailInput = screen.getByLabelText('Email Address');
    
    // Enter invalid email (no @ symbol)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    // Submit the form directly
    const form = emailInput.closest('form');
    expect(form).toBeTruthy();
    if (form) {
      fireEvent.submit(form);
    }

    // The form uses Zod validation which shows "Please enter a valid email address"
    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it('should show invite code field when clicked', () => {
    render(<OnboardingWizard />);
    
    fireEvent.click(screen.getByText('Get Started →'));
    fireEvent.click(screen.getByText('Have an invite code?'));
    
    expect(screen.getByLabelText('Invite Code (optional)')).toBeInTheDocument();
  });

  it('should proceed to setup after valid submission', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: '1', email: 'test@example.com', status: 'INSTANT_ACCESS' },
      }),
    });

    render(<OnboardingWizard />);
    
    fireEvent.click(screen.getByText('Get Started →'));
    
    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Join Waitlist'));

    await waitFor(() => {
      expect(screen.getByText("What's your name?")).toBeInTheDocument();
    });
  });
});

// ============================================
// Leaderboard Tests
// ============================================

describe('Leaderboard Component', () => {
  it('should render leaderboard header', () => {
    render(<Leaderboard />);
    
    expect(screen.getByText('Partner Leaderboard')).toBeInTheDocument();
  });

  it('should show time period tabs', () => {
    render(<Leaderboard />);
    
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('This Quarter')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('should show opt-in toggle', () => {
    render(<Leaderboard />);
    
    expect(screen.getByText('✓ Participating')).toBeInTheDocument();
  });

  it('should toggle opt-in status', () => {
    render(<Leaderboard />);
    
    const toggleButton = screen.getByText('✓ Participating');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Join Leaderboard')).toBeInTheDocument();
  });

  it('should display leaderboard entries', () => {
    render(<Leaderboard />);
    
    // Should show top entries with names
    expect(screen.getByText('Alex M.')).toBeInTheDocument();
    expect(screen.getByText('Jordan K.')).toBeInTheDocument();
  });

  it('should show rank badges for top 3', () => {
    render(<Leaderboard />);
    
    // Top 3 should have medal emojis
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('should switch time periods', () => {
    render(<Leaderboard />);
    
    const quarterlyTab = screen.getByText('This Quarter');
    fireEvent.click(quarterlyTab);
    
    // Tab should be highlighted (button will have different styling)
    expect(quarterlyTab.className).toContain('bg-primary-600');
  });

  it('should show current user summary when provided', () => {
    render(<Leaderboard currentPartnerId="partner-8" />);
    
    // Should show "You" indicator
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Your Rank')).toBeInTheDocument();
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Phase 2 Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should handle full onboarding flow', async () => {
    const onComplete = vi.fn();

    // Mock API responses
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: '1', email: 'test@example.com', status: 'INSTANT_ACCESS' },
      }),
    });

    render(<OnboardingWizard onComplete={onComplete} />);

    // Stage 1: Landing
    fireEvent.click(screen.getByText('Get Started →'));

    // Stage 2: Interest
    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Join Waitlist'));

    // Stage 3: Setup - Step 1
    await waitFor(() => {
      expect(screen.getByText("What's your name?")).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Your full name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.click(screen.getByText('Continue'));

    // Step 2: Company
    await waitFor(() => {
      expect(screen.getByText('Tell us about your business')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Continue'));

    // Step 3: Referral Source
    await waitFor(() => {
      expect(screen.getByText('How did you hear about us?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Friend or Colleague'));
    fireEvent.click(screen.getByText('Continue'));

    // Step 4: Goals
    await waitFor(() => {
      expect(screen.getByText('What are your goals?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Generate passive income'));
    fireEvent.click(screen.getByText('Complete Setup'));

    // Verify completion callback
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'John Doe',
          referralSource: 'friend',
          goals: ['passive_income'],
        })
      );
    });
  });
});
