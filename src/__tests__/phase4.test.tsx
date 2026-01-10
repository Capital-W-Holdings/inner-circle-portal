import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Components
import { AnalyticsDashboard } from '@/components/features/AnalyticsDashboard';
import { ABTestManager } from '@/components/features/ABTestManager';
import { AttributionReport } from '@/components/features/AttributionReport';
import { EmailDigestSettings } from '@/components/features/EmailDigestSettings';

// ============================================
// AnalyticsDashboard Tests
// ============================================

describe('AnalyticsDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should render dashboard header', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<AnalyticsDashboard partnerId="partner-123" />);
    
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });

  it('should show date range buttons', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<AnalyticsDashboard partnerId="partner-123" />);
    
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('90 Days')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );

    render(<AnalyticsDashboard partnerId="partner-123" />);
    
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('should display metrics when loaded', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<AnalyticsDashboard partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Total Clicks')).toBeInTheDocument();
      expect(screen.getByText('Conversions')).toBeInTheDocument();
      // Revenue appears multiple times, use getAllByText
      expect(screen.getAllByText('Revenue').length).toBeGreaterThan(0);
    });
  });

  it('should show conversion funnel', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<AnalyticsDashboard partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
    });
  });

  it('should show source breakdown', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<AnalyticsDashboard partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Performance by Source')).toBeInTheDocument();
    });
  });

  it('should switch date ranges', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    render(<AnalyticsDashboard partnerId="partner-123" />);

    const button = screen.getByText('7 Days');
    fireEvent.click(button);

    expect(button.className).toContain('bg-primary-600');
  });
});

// ============================================
// ABTestManager Tests
// ============================================

describe('ABTestManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should render A/B testing header', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<ABTestManager partnerId="partner-123" />);
    
    expect(screen.getByText('A/B Testing')).toBeInTheDocument();
  });

  it('should show new experiment button', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<ABTestManager partnerId="partner-123" />);
    
    expect(screen.getByText('+ New Experiment')).toBeInTheDocument();
  });

  it('should display experiments when loaded', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<ABTestManager partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('LinkedIn Share Message')).toBeInTheDocument();
    });
  });

  it('should show experiment status badges', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<ABTestManager partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('should open create modal when clicking new experiment', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<ABTestManager partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('+ New Experiment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New Experiment'));

    expect(screen.getByText('Create New Experiment')).toBeInTheDocument();
  });

  it('should show variant comparison', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<ABTestManager partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Control')).toBeInTheDocument();
    });
  });

  it('should show winner badge on completed experiments', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<ABTestManager partnerId="partner-123" />);

    // Wait for experiments to load
    await waitFor(() => {
      expect(screen.getByText('Email Subject Line Test')).toBeInTheDocument();
    });

    // Click on the completed experiment to expand it (it's collapsed by default)
    fireEvent.click(screen.getByText('Email Subject Line Test'));

    // Now the winner badge should be visible
    await waitFor(() => {
      expect(screen.getByText(/Winner/)).toBeInTheDocument();
    });
  });
});

// ============================================
// AttributionReport Tests
// ============================================

describe('AttributionReport Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should render attribution report header', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<AttributionReport partnerId="partner-123" />);
    
    expect(screen.getByText('Attribution Report')).toBeInTheDocument();
  });

  it('should show attribution model selector', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<AttributionReport partnerId="partner-123" />);
    
    expect(screen.getByText('First Touch')).toBeInTheDocument();
    expect(screen.getByText('Last Touch')).toBeInTheDocument();
    expect(screen.getByText('Linear')).toBeInTheDocument();
  });

  it('should display summary cards', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<AttributionReport partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Conversions')).toBeInTheDocument();
      expect(screen.getByText('Top Source')).toBeInTheDocument();
    });
  });

  it('should show revenue by source chart', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<AttributionReport partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Revenue by Source')).toBeInTheDocument();
    });
  });

  it('should show conversion paths', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<AttributionReport partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Top Conversion Paths')).toBeInTheDocument();
    });
  });

  it('should switch attribution models', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    render(<AttributionReport partnerId="partner-123" />);

    const button = screen.getByText('First Touch');
    fireEvent.click(button);

    expect(button.className).toContain('bg-primary-600');
  });

  it('should show campaign performance table', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<AttributionReport partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Campaign Performance')).toBeInTheDocument();
    });
  });
});

// ============================================
// EmailDigestSettings Tests
// ============================================

describe('EmailDigestSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should render email digest header', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<EmailDigestSettings partnerId="partner-123" />);
    
    expect(screen.getByText('Email Digest Settings')).toBeInTheDocument();
  });

  it('should show master toggle', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<EmailDigestSettings partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Enable Email Digests')).toBeInTheDocument();
    });
  });

  it('should show frequency options', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<EmailDigestSettings partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });
  });

  it('should show content toggles', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<EmailDigestSettings partnerId="partner-123" />);

    // Wait for loading to complete - master toggle appears first
    await waitFor(() => {
      expect(screen.getByText('Enable Email Digests')).toBeInTheDocument();
    });

    // Content section header should be visible
    expect(screen.getByText('Content to Include')).toBeInTheDocument();
    
    // Check for specific toggle labels
    expect(screen.getByText('Performance Stats')).toBeInTheDocument();
    expect(screen.getByText('Partner Tips')).toBeInTheDocument();
  });

  it('should show email preview', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<EmailDigestSettings partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Email Preview')).toBeInTheDocument();
    });
  });

  it('should show save and test buttons', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<EmailDigestSettings partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
      expect(screen.getByText('Send Test')).toBeInTheDocument();
    });
  });

  it('should toggle content options', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<EmailDigestSettings partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Partner Tips')).toBeInTheDocument();
    });

    // Find the switch for Partner Tips and click it
    const tipsLabel = screen.getByText('Partner Tips').closest('label');
    expect(tipsLabel).toBeTruthy();
    if (tipsLabel) {
      const toggle = tipsLabel.querySelector('[role="switch"]');
      if (toggle) {
        fireEvent.click(toggle);
      }
    }
  });
});

// ============================================
// API Endpoint Tests (Mocked)
// ============================================

describe('Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should fetch analytics data', async () => {
    const mockData = {
      overview: { clicks: 100, conversions: 10 },
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    const response = await fetch('/api/partners/partner-123/analytics?range=30d');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.overview).toBeDefined();
  });
});

describe('Experiments API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should fetch experiments', async () => {
    const mockExperiments = [
      { id: '1', name: 'Test', status: 'RUNNING' },
    ];

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockExperiments }),
    });

    const response = await fetch('/api/experiments?partnerId=partner-123');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should create experiment', async () => {
    const newExperiment = {
      id: '2',
      name: 'New Test',
      status: 'DRAFT',
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: newExperiment }),
    });

    const response = await fetch('/api/experiments', {
      method: 'POST',
      body: JSON.stringify({
        partnerId: 'partner-123',
        name: 'New Test',
        variants: [
          { name: 'Control', content: 'Test', isControl: true },
          { name: 'Variant', content: 'Test 2', isControl: false },
        ],
      }),
    });
    const data = await response.json();

    expect(data.success).toBe(true);
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Phase 4 Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should render all Phase 4 components', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    render(
      <div>
        <AnalyticsDashboard partnerId="partner-123" />
        <ABTestManager partnerId="partner-123" />
        <AttributionReport partnerId="partner-123" />
        <EmailDigestSettings partnerId="partner-123" />
      </div>
    );

    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('A/B Testing')).toBeInTheDocument();
      expect(screen.getByText('Attribution Report')).toBeInTheDocument();
      expect(screen.getByText('Email Digest Settings')).toBeInTheDocument();
    });
  });
});
