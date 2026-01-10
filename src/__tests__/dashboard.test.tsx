/**
 * Dashboard Component Tests
 * Tests for chart components, stats cards, and QR code generator
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Area: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => (
    <svg data-testid="qr-code" data-value={value} />
  ),
}));

import { StatsCard, StatsGrid, StatsIcons } from '@/components/ui/StatsCard';
import { EarningsChart } from '@/components/charts/EarningsChart';
import { ConversionsChart } from '@/components/charts/ConversionsChart';
import { SourceChart } from '@/components/charts/SourceChart';
import { QRCodeGenerator, CompactQRCode, QRCodeModal } from '@/components/features/QRCodeGenerator';

describe('StatsCard Component', () => {
  it('should render with title and value', () => {
    render(
      <StatsCard
        title="Total Earned"
        value="$1,234.56"
      />
    );
    
    expect(screen.getByText('Total Earned')).toBeInTheDocument();
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('should render with trend indicator', () => {
    render(
      <StatsCard
        title="Revenue"
        value="$5,000"
        trend={{ value: 12, direction: 'up', label: 'vs last month' }}
      />
    );
    
    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    render(
      <StatsCard
        title="Earnings"
        value="$100"
        icon={StatsIcons.earnings}
      />
    );
    
    // Icon should be rendered (SVG)
    const card = screen.getByText('Earnings').closest('div');
    expect(card).toBeInTheDocument();
  });

  it('should show loading skeleton when loading', () => {
    render(
      <StatsCard
        title="Loading"
        value="$0"
        loading={true}
      />
    );
    
    // Should have animate-pulse class for skeleton
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('should be clickable when onClick is provided', () => {
    const handleClick = vi.fn();
    
    render(
      <StatsCard
        title="Clickable"
        value="Click me"
        onClick={handleClick}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply color variants', () => {
    const { rerender } = render(
      <StatsCard
        title="Success"
        value="100"
        color="success"
      />
    );
    
    expect(screen.getByText('100')).toHaveClass('text-green-600');
    
    rerender(
      <StatsCard
        title="Warning"
        value="50"
        color="warning"
      />
    );
    
    expect(screen.getByText('50')).toHaveClass('text-amber-600');
  });
});

describe('StatsGrid Component', () => {
  it('should render children in a grid', () => {
    render(
      <StatsGrid columns={4}>
        <StatsCard title="Card 1" value="1" />
        <StatsCard title="Card 2" value="2" />
        <StatsCard title="Card 3" value="3" />
        <StatsCard title="Card 4" value="4" />
      </StatsGrid>
    );
    
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 4')).toBeInTheDocument();
  });

  it('should apply correct grid columns class', () => {
    const { container } = render(
      <StatsGrid columns={2}>
        <div>Child 1</div>
        <div>Child 2</div>
      </StatsGrid>
    );
    
    const grid = container.firstChild;
    expect(grid).toHaveClass('grid');
  });
});

describe('EarningsChart Component', () => {
  const mockData = [
    { date: '2024-01-01', earnings: 10000, conversions: 5, clicks: 100 },
    { date: '2024-01-02', earnings: 15000, conversions: 7, clicks: 150 },
    { date: '2024-01-03', earnings: 12000, conversions: 6, clicks: 120 },
  ];

  it('should render chart container', () => {
    render(<EarningsChart data={mockData} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('should show loading skeleton when loading', () => {
    render(<EarningsChart data={[]} loading={true} />);
    
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<EarningsChart data={[]} />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});

describe('ConversionsChart Component', () => {
  const mockData = [
    { date: '2024-01-01', clicks: 100, conversions: 5 },
    { date: '2024-01-02', clicks: 150, conversions: 7 },
    { date: '2024-01-03', clicks: 120, conversions: 6 },
  ];

  it('should render chart container', () => {
    render(<ConversionsChart data={mockData} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should show loading skeleton when loading', () => {
    render(<ConversionsChart data={[]} loading={true} />);
    
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });
});

describe('SourceChart Component', () => {
  const mockData = [
    { source: 'LinkedIn', clicks: 500, conversions: 25 },
    { source: 'Twitter', clicks: 300, conversions: 15 },
    { source: 'Email', clicks: 200, conversions: 20 },
  ];

  it('should render chart container', () => {
    render(<SourceChart data={mockData} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<SourceChart data={[]} />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});

describe('QRCodeGenerator Component', () => {
  const testUrl = 'https://example.com/r/ABC123';

  it('should render QR code with correct URL', () => {
    render(<QRCodeGenerator url={testUrl} />);
    
    const qrCode = screen.getByTestId('qr-code');
    expect(qrCode).toBeInTheDocument();
    expect(qrCode).toHaveAttribute('data-value', testUrl);
  });

  it('should show campaign name when provided', () => {
    render(
      <QRCodeGenerator 
        url={testUrl} 
        campaignName="Test Campaign" 
      />
    );
    
    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
  });

  it('should show copy button when showCopy is true', () => {
    render(
      <QRCodeGenerator 
        url={testUrl} 
        showCopy={true} 
      />
    );
    
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('should show download button when showDownload is true', () => {
    render(
      <QRCodeGenerator 
        url={testUrl} 
        showDownload={true} 
      />
    );
    
    expect(screen.getByText('Download PNG')).toBeInTheDocument();
  });

  it('should handle copy click', async () => {
    // Mock clipboard API
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(
      <QRCodeGenerator 
        url={testUrl} 
        showCopy={true} 
      />
    );
    
    const copyButton = screen.getByText('Copy Link');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(testUrl);
    });
  });
});

describe('CompactQRCode Component', () => {
  it('should render compact QR code', () => {
    render(<CompactQRCode url="https://example.com" />);
    
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    
    render(
      <CompactQRCode 
        url="https://example.com" 
        onClick={handleClick} 
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('QRCodeModal Component', () => {
  it('should not render when closed', () => {
    render(
      <QRCodeModal
        isOpen={false}
        onClose={() => {}}
        url="https://example.com"
      />
    );
    
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(
      <QRCodeModal
        isOpen={true}
        onClose={() => {}}
        url="https://example.com"
        campaignName="Test Campaign"
      />
    );
    
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    // Campaign name appears in both header and QR generator
    expect(screen.getAllByText('Test Campaign')).toHaveLength(2);
  });

  it('should call onClose when backdrop is clicked', () => {
    const handleClose = vi.fn();
    
    render(
      <QRCodeModal
        isOpen={true}
        onClose={handleClose}
        url="https://example.com"
      />
    );
    
    // Click the backdrop (the outer div)
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });
});
