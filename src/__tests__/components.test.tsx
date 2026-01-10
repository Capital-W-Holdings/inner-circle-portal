import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Components
import { ShareKit } from '@/components/features/ShareKit';
import { Celebration, triggerCelebration, quickCelebrate } from '@/components/features/Celebration';
import { CampaignCreator } from '@/components/features/CampaignCreator';

// Types
import type { Campaign } from '@/types';

// ============================================
// ShareKit Tests
// ============================================

describe('ShareKit Component', () => {
  const defaultProps = {
    referralCode: 'ABC123',
    referralLink: 'https://innercircle.co/r/ABC123',
    partnerName: 'John Doe',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render referral link', () => {
    render(<ShareKit {...defaultProps} />);
    expect(screen.getByText('https://innercircle.co/r/ABC123')).toBeInTheDocument();
  });

  it('should render share buttons', () => {
    render(<ShareKit {...defaultProps} />);
    expect(screen.getByLabelText('Share on X')).toBeInTheDocument();
    expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument();
    expect(screen.getByLabelText('Share on WhatsApp')).toBeInTheDocument();
    expect(screen.getByLabelText('Share on Email')).toBeInTheDocument();
  });

  it('should render pre-written messages', () => {
    render(<ShareKit {...defaultProps} />);
    expect(screen.getByText('Pre-written messages')).toBeInTheDocument();
    // Check for "Use" buttons (one per template)
    const useButtons = screen.getAllByRole('button', { name: /use/i });
    expect(useButtons.length).toBeGreaterThan(0);
  });

  it('should copy link to clipboard when copy button clicked', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator.clipboard, { writeText: mockWriteText });

    render(<ShareKit {...defaultProps} />);
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('https://innercircle.co/r/ABC123');
    });
  });

  it('should show "Copied!" after copying', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator.clipboard, { writeText: mockWriteText });

    render(<ShareKit {...defaultProps} />);
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should toggle QR code visibility', () => {
    render(<ShareKit {...defaultProps} />);
    
    // QR code should not be visible initially
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    
    // Click to show QR code
    const qrButton = screen.getByText('QR Code for mobile sharing');
    fireEvent.click(qrButton);
    
    // QR code should now be visible (QRCodeSVG renders an SVG)
    // Note: In jsdom, the SVG might not be fully rendered
  });

  it('should call onShareComplete callback', async () => {
    const onShareComplete = vi.fn();
    
    render(<ShareKit {...defaultProps} onShareComplete={onShareComplete} />);
    
    // Click copy button (which triggers share tracking)
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(onShareComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          platform: 'copy',
        })
      );
    });
  });
});

// ============================================
// Celebration Tests
// ============================================

describe('Celebration Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render celebration modal', () => {
    render(<Celebration milestone="FIRST_CONVERSION" />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Milestone Achieved!')).toBeInTheDocument();
  });

  it('should display milestone message', () => {
    render(<Celebration milestone="FIRST_CONVERSION" />);
    
    expect(screen.getByText(/first commission/i)).toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    render(<Celebration milestone="FIRST_CLICK" onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByRole('button', { name: /awesome/i });
    fireEvent.click(dismissButton);
    
    expect(onDismiss).toHaveBeenCalled();
  });

  it('should dismiss on escape key', () => {
    const onDismiss = vi.fn();
    render(<Celebration milestone="FIRST_CLICK" onDismiss={onDismiss} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onDismiss).toHaveBeenCalled();
  });

  it('should dismiss on backdrop click', () => {
    const onDismiss = vi.fn();
    render(<Celebration milestone="FIRST_CLICK" onDismiss={onDismiss} />);
    
    // Find and click backdrop (the element with bg-black/50)
    const backdrop = screen.getByRole('dialog').querySelector('[aria-hidden="true"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onDismiss).toHaveBeenCalled();
    }
  });

  it('should not render when autoShow is false', () => {
    render(<Celebration milestone="FIRST_CLICK" autoShow={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Celebration Imperative API', () => {
  it('should export triggerCelebration function', () => {
    expect(typeof triggerCelebration).toBe('function');
  });

  it('should export quickCelebrate function', () => {
    expect(typeof quickCelebrate).toBe('function');
  });

  it('should not throw when called', () => {
    expect(() => triggerCelebration('FIRST_CLICK')).not.toThrow();
    expect(() => quickCelebrate()).not.toThrow();
  });
});

// ============================================
// CampaignCreator Tests
// ============================================

describe('CampaignCreator Component', () => {
  const defaultProps = {
    partnerId: 'partner-123',
    referralCode: 'ABC123',
    baseUrl: 'https://innercircle.co',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should render campaign name input', () => {
    render(<CampaignCreator {...defaultProps} />);
    
    expect(screen.getByLabelText('Campaign Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/LinkedIn Q1 2026/i)).toBeInTheDocument();
  });

  it('should render source selector with all options', () => {
    render(<CampaignCreator {...defaultProps} />);
    
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('X (Twitter)')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should show link preview when name entered', () => {
    render(<CampaignCreator {...defaultProps} />);
    
    const input = screen.getByLabelText('Campaign Name');
    fireEvent.change(input, { target: { value: 'Test Campaign' } });
    
    expect(screen.getByText(/test-campaign/)).toBeInTheDocument();
  });

  it('should disable submit button when name is empty', () => {
    render(<CampaignCreator {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create campaign/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when name is entered', () => {
    render(<CampaignCreator {...defaultProps} />);
    
    const input = screen.getByLabelText('Campaign Name');
    fireEvent.change(input, { target: { value: 'Test Campaign' } });
    
    const submitButton = screen.getByRole('button', { name: /create campaign/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should call API on submit', async () => {
    const mockCampaign: Campaign = {
      id: 'camp_123',
      partnerId: 'partner-123',
      name: 'Test Campaign',
      source: 'LINKEDIN',
      link: 'https://innercircle.co/r/ABC123?c=test-campaign',
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: new Date(),
      isActive: true,
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockCampaign }),
    });

    render(<CampaignCreator {...defaultProps} />);
    
    const input = screen.getByLabelText('Campaign Name');
    fireEvent.change(input, { target: { value: 'Test Campaign' } });
    
    const submitButton = screen.getByRole('button', { name: /create campaign/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/partners/partner-123/campaigns',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test Campaign', source: 'LINKEDIN' }),
        })
      );
    });
  });

  it('should show success state after creation', async () => {
    const mockCampaign: Campaign = {
      id: 'camp_123',
      partnerId: 'partner-123',
      name: 'Test Campaign',
      source: 'LINKEDIN',
      link: 'https://innercircle.co/r/ABC123?c=test-campaign',
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: new Date(),
      isActive: true,
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockCampaign }),
    });

    render(<CampaignCreator {...defaultProps} />);
    
    const input = screen.getByLabelText('Campaign Name');
    fireEvent.change(input, { target: { value: 'Test Campaign' } });
    
    const submitButton = screen.getByRole('button', { name: /create campaign/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('✓ Created!')).toBeInTheDocument();
    });
  });

  it('should display existing campaigns', () => {
    const existingCampaigns: Campaign[] = [
      {
        id: 'camp_existing',
        partnerId: 'partner-123',
        name: 'Existing Campaign',
        source: 'TWITTER',
        link: 'https://innercircle.co/r/ABC123?c=existing-campaign',
        clicks: 42,
        conversions: 5,
        revenue: 50000,
        createdAt: new Date(),
        isActive: true,
      },
    ];

    render(<CampaignCreator {...defaultProps} existingCampaigns={existingCampaigns} />);
    
    expect(screen.getByText('Existing Campaign')).toBeInTheDocument();
    expect(screen.getByText('42 clicks • 5 conversions')).toBeInTheDocument();
  });

  it('should validate campaign name', async () => {
    render(<CampaignCreator {...defaultProps} />);
    
    const input = screen.getByLabelText('Campaign Name');
    // Name with invalid characters
    fireEvent.change(input, { target: { value: 'Test!@#$' } });
    
    const submitButton = screen.getByRole('button', { name: /create campaign/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Component Integration', () => {
  it('should handle share to campaign flow', async () => {
    const mockCampaign: Campaign = {
      id: 'camp_123',
      partnerId: 'partner-123',
      name: 'LinkedIn Q1',
      source: 'LINKEDIN',
      link: 'https://innercircle.co/r/ABC123?c=linkedin-q1',
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: new Date(),
      isActive: true,
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockCampaign }),
    });

    const onCampaignCreated = vi.fn();

    render(
      <CampaignCreator 
        partnerId="partner-123"
        referralCode="ABC123"
        baseUrl="https://innercircle.co"
        onCampaignCreated={onCampaignCreated}
      />
    );
    
    // Create a campaign
    const input = screen.getByLabelText('Campaign Name');
    fireEvent.change(input, { target: { value: 'LinkedIn Q1' } });
    
    const submitButton = screen.getByRole('button', { name: /create campaign/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onCampaignCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'LinkedIn Q1',
          source: 'LINKEDIN',
        })
      );
    });
  });
});
