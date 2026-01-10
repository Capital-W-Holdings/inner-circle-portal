/**
 * Admin Portal Tests
 * Tests for admin API endpoints and components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: () => <div data-testid="area-chart" />,
  BarChart: () => <div data-testid="bar-chart" />,
  PieChart: () => <div data-testid="pie-chart" />,
  Area: () => null,
  Bar: () => null,
  Pie: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  Cell: () => null,
  Legend: () => null,
}));

// ============================================
// Admin Dashboard Tests
// ============================================

describe('AdminDashboardClient Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        data: null,
      }),
    });
  });

  it('should render dashboard header', async () => {
    const { AdminDashboardClient } = await import(
      '../app/admin/AdminDashboardClient'
    );
    render(<AdminDashboardClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('should show stats cards', async () => {
    const { AdminDashboardClient } = await import(
      '../app/admin/AdminDashboardClient'
    );
    render(<AdminDashboardClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Partners')).toBeInTheDocument();
      expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });
  });

  it('should show quick actions', async () => {
    const { AdminDashboardClient } = await import(
      '../app/admin/AdminDashboardClient'
    );
    render(<AdminDashboardClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Review Pending')).toBeInTheDocument();
      expect(screen.getByText('Process Payouts')).toBeInTheDocument();
    });
  });
});

// ============================================
// Partners Management Tests
// ============================================

describe('PartnersClient Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        data: null,
      }),
    });
  });

  it('should render partners page header', async () => {
    const { PartnersClient } = await import(
      '../app/admin/partners/PartnersClient'
    );
    render(<PartnersClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Partners')).toBeInTheDocument();
      expect(screen.getByText('Manage your partner network')).toBeInTheDocument();
    });
  });

  it('should show add partner button', async () => {
    const { PartnersClient } = await import(
      '../app/admin/partners/PartnersClient'
    );
    render(<PartnersClient />);
    
    await waitFor(() => {
      expect(screen.getByText('+ Add Partner')).toBeInTheDocument();
    });
  });

  it('should have status filter', async () => {
    const { PartnersClient } = await import(
      '../app/admin/partners/PartnersClient'
    );
    render(<PartnersClient />);
    
    await waitFor(() => {
      const statusSelect = screen.getByDisplayValue('All Status');
      expect(statusSelect).toBeInTheDocument();
    });
  });

  it('should have tier filter', async () => {
    const { PartnersClient } = await import(
      '../app/admin/partners/PartnersClient'
    );
    render(<PartnersClient />);
    
    await waitFor(() => {
      const tierSelect = screen.getByDisplayValue('All Tiers');
      expect(tierSelect).toBeInTheDocument();
    });
  });

  it('should have search input', async () => {
    const { PartnersClient } = await import(
      '../app/admin/partners/PartnersClient'
    );
    render(<PartnersClient />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search partners...')).toBeInTheDocument();
    });
  });
});

// ============================================
// Payouts Management Tests
// ============================================

describe('PayoutsClient Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        data: null,
      }),
    });
  });

  it('should render payouts page header', async () => {
    const { PayoutsClient } = await import(
      '../app/admin/payouts/PayoutsClient'
    );
    render(<PayoutsClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Payouts')).toBeInTheDocument();
      expect(screen.getByText('Review and process partner payout requests')).toBeInTheDocument();
    });
  });

  it('should show status filter', async () => {
    const { PayoutsClient } = await import(
      '../app/admin/payouts/PayoutsClient'
    );
    render(<PayoutsClient />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
    });
  });

  it('should show select all pending button', async () => {
    const { PayoutsClient } = await import(
      '../app/admin/payouts/PayoutsClient'
    );
    render(<PayoutsClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Select All Pending')).toBeInTheDocument();
    });
  });
});

// ============================================
// Analytics Tests
// ============================================

describe('AnalyticsClient Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render analytics header', async () => {
    const { AnalyticsClient } = await import(
      '../app/admin/analytics/AnalyticsClient'
    );
    render(<AnalyticsClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });

  it('should show date range buttons', async () => {
    const { AnalyticsClient } = await import(
      '../app/admin/analytics/AnalyticsClient'
    );
    render(<AnalyticsClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 days')).toBeInTheDocument();
    });
  });
});

// ============================================
// Settings Tests
// ============================================

describe('SettingsClient Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render settings header', async () => {
    const { SettingsClient } = await import(
      '../app/admin/settings/SettingsClient'
    );
    render(<SettingsClient />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Configure your partner program settings')).toBeInTheDocument();
  });

  it('should show general tab', async () => {
    const { SettingsClient } = await import(
      '../app/admin/settings/SettingsClient'
    );
    render(<SettingsClient />);
    
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('should show tiers tab', async () => {
    const { SettingsClient } = await import(
      '../app/admin/settings/SettingsClient'
    );
    render(<SettingsClient />);
    
    expect(screen.getByText('Partner Tiers')).toBeInTheDocument();
  });

  it('should show payouts tab', async () => {
    const { SettingsClient } = await import(
      '../app/admin/settings/SettingsClient'
    );
    render(<SettingsClient />);
    
    expect(screen.getByText('Payouts')).toBeInTheDocument();
  });
});

// ============================================
// Bulk Operations Tests
// ============================================

describe('Bulk Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate bulk action schema', async () => {
    const { z } = await import('zod');
    
    const bulkActionSchema = z.object({
      action: z.enum([
        'approve_partners',
        'suspend_partners',
        'activate_partners',
        'approve_payouts',
        'reject_payouts',
      ]),
      ids: z.array(z.string()).min(1),
    });

    // Valid action
    const validResult = bulkActionSchema.safeParse({
      action: 'approve_partners',
      ids: ['partner-1', 'partner-2'],
    });
    expect(validResult.success).toBe(true);

    // Invalid action
    const invalidAction = bulkActionSchema.safeParse({
      action: 'invalid_action',
      ids: ['partner-1'],
    });
    expect(invalidAction.success).toBe(false);

    // Empty IDs
    const emptyIds = bulkActionSchema.safeParse({
      action: 'approve_partners',
      ids: [],
    });
    expect(emptyIds.success).toBe(false);
  });
});

// ============================================
// Export Functionality Tests
// ============================================

describe('Export Functionality', () => {
  it('should validate export query params', async () => {
    const { z } = await import('zod');
    
    const querySchema = z.object({
      type: z.enum(['partners', 'payouts', 'referrals']),
      status: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    });

    // Valid export params
    const validResult = querySchema.safeParse({
      type: 'partners',
      status: 'ACTIVE',
    });
    expect(validResult.success).toBe(true);

    // Invalid type
    const invalidType = querySchema.safeParse({
      type: 'invalid',
    });
    expect(invalidType.success).toBe(false);
  });

  it('should format CSV values correctly', () => {
    function escapeCSV(value: string | number | null | undefined): string {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    expect(escapeCSV('simple')).toBe('simple');
    expect(escapeCSV('with,comma')).toBe('"with,comma"');
    expect(escapeCSV('with"quote')).toBe('"with""quote"');
    expect(escapeCSV('with\nnewline')).toBe('"with\nnewline"');
    expect(escapeCSV(null)).toBe('');
    expect(escapeCSV(undefined)).toBe('');
    expect(escapeCSV(123)).toBe('123');
  });
});

// ============================================
// AdminSidebar Tests
// ============================================

describe('AdminSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sidebar with navigation links', async () => {
    const { AdminSidebar } = await import(
      '../app/admin/components/AdminSidebar'
    );
    
    render(<AdminSidebar />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Partners')).toBeInTheDocument();
    expect(screen.getByText('Payouts')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should display admin portal title', async () => {
    const { AdminSidebar } = await import(
      '../app/admin/components/AdminSidebar'
    );
    
    render(<AdminSidebar />);
    
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
  });
});
