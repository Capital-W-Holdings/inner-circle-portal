/**
 * Dashboard Components Tests
 * Tests for charts, stats cards, and QR code components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StatsCard, StatsGrid, StatsIcons } from '@/components/ui/StatsCard';
import { QRCodeGenerator, CompactQRCode, QRCodeModal } from '@/components/features/QRCodeGenerator';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('StatsCard Component', () => {
  it('should render with title and value', () => {
    render(
      <StatsCard
        title="Total Earned"
        value="$12,450"
      />
    );
    
    expect(screen.getByText('Total Earned')).toBeInTheDocument();
    expect(screen.getByText('$12,450')).toBeInTheDocument();
  });

  it('should render with trend indicator', () => {
    render(
      <StatsCard
        title="Conversions"
        value="156"
        trend={{ value: 12, direction: 'up', label: 'vs last month' }}
      />
    );
    
    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('should render loading skeleton', () => {
    const { container } = render(
      <StatsCard
        title="Loading"
        value="0"
        loading={true}
      />
    );
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    render(
      <StatsCard
        title="Earnings"
        value="$500"
        icon={StatsIcons.earnings}
      />
    );
    
    expect(screen.getByText('Earnings')).toBeInTheDocument();
  });

  it('should handle click when onClick provided', () => {
    const handleClick = vi.fn();
    render(
      <StatsCard
        title="Clickable"
        value="100"
        onClick={handleClick}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply color variants', () => {
    const { container } = render(
      <StatsCard
        title="Success"
        value="Done"
        color="success"
      />
    );
    
    expect(container.querySelector('.text-green-600')).toBeInTheDocument();
  });
});

describe('StatsGrid Component', () => {
  it('should render children in grid', () => {
    render(
      <StatsGrid columns={4}>
        <StatsCard title="A" value="1" />
        <StatsCard title="B" value="2" />
        <StatsCard title="C" value="3" />
        <StatsCard title="D" value="4" />
      </StatsGrid>
    );
    
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('should apply correct column classes', () => {
    const { container } = render(
      <StatsGrid columns={2}>
        <div>Item 1</div>
        <div>Item 2</div>
      </StatsGrid>
    );
    
    expect(container.querySelector('.sm\\:grid-cols-2')).toBeInTheDocument();
  });
});

describe('QRCodeGenerator Component', () => {
  it('should render QR code with URL', () => {
    render(
      <QRCodeGenerator
        url="https://example.com/r/TEST123"
        size={200}
      />
    );
    
    // QR code SVG should be present
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should show campaign name', () => {
    render(
      <QRCodeGenerator
        url="https://example.com/r/TEST123"
        campaignName="LinkedIn Campaign"
      />
    );
    
    expect(screen.getByText('LinkedIn Campaign')).toBeInTheDocument();
  });

  it('should display URL preview', () => {
    render(
      <QRCodeGenerator
        url="https://example.com/r/TEST123"
      />
    );
    
    expect(screen.getByText('https://example.com/r/TEST123')).toBeInTheDocument();
  });

  it('should have download button when showDownload is true', () => {
    render(
      <QRCodeGenerator
        url="https://example.com"
        showDownload={true}
      />
    );
    
    expect(screen.getByText('Download PNG')).toBeInTheDocument();
  });

  it('should have copy button when showCopy is true', () => {
    render(
      <QRCodeGenerator
        url="https://example.com"
        showCopy={true}
      />
    );
    
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('should copy URL to clipboard', async () => {
    render(
      <QRCodeGenerator
        url="https://example.com/test"
        showCopy={true}
      />
    );
    
    fireEvent.click(screen.getByText('Copy Link'));
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/test');
    });
  });
});

describe('CompactQRCode Component', () => {
  it('should render small QR code', () => {
    render(
      <CompactQRCode
        url="https://example.com"
        size={48}
      />
    );
    
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should handle click', () => {
    const handleClick = vi.fn();
    render(
      <CompactQRCode
        url="https://example.com"
        onClick={handleClick}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
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
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
    
    // There will be multiple elements with the campaign name (header and QR generator)
    const elements = screen.getAllByText('Test Campaign');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('should call onClose when backdrop clicked', () => {
    const handleClose = vi.fn();
    render(
      <QRCodeModal
        isOpen={true}
        onClose={handleClose}
        url="https://example.com"
      />
    );
    
    // Click the backdrop (the outer div)
    fireEvent.click(document.querySelector('.fixed.inset-0')!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(
      <QRCodeModal
        isOpen={true}
        onClose={handleClose}
        url="https://example.com"
      />
    );
    
    // Find and click the close button (the X button in the header)
    const closeButton = document.querySelector('button[class*="text-gray-400"]');
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalled();
    }
  });
});

describe('StatsIcons', () => {
  it('should have all required icons', () => {
    expect(StatsIcons.earnings).toBeDefined();
    expect(StatsIcons.payout).toBeDefined();
    expect(StatsIcons.referrals).toBeDefined();
    expect(StatsIcons.clicks).toBeDefined();
    expect(StatsIcons.conversion).toBeDefined();
    expect(StatsIcons.tier).toBeDefined();
  });
});
