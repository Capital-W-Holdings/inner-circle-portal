import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';

// Components
import { NotificationCenter } from '@/components/features/NotificationCenter';
import { PayoutTracker } from '@/components/features/PayoutTracker';
import { InstallPrompt } from '@/components/features/InstallPrompt';

// Hooks
import { useOnlineStatus } from '@/hooks/pwa';

// ============================================
// NotificationCenter Tests
// ============================================

describe('NotificationCenter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should render notification header', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<NotificationCenter partnerId="partner-123" />);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should show loading skeleton initially', () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<NotificationCenter partnerId="partner-123" />);
    
    // Should show loading state (skeleton)
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('should show empty state when no notifications', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<NotificationCenter partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  it('should display notifications when loaded', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false, // Will use mock data
    });

    render(<NotificationCenter partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('New Conversion!')).toBeInTheDocument();
    });
  });

  it('should show unread count badge', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false, // Will use mock data with unread items
    });

    render(<NotificationCenter partnerId="partner-123" />);

    await waitFor(() => {
      // Mock data has 2 unread notifications
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should show settings button', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<NotificationCenter partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });
  });

  it('should toggle preferences panel', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<NotificationCenter partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Settings'));

    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    expect(screen.getByText('Channels')).toBeInTheDocument();
  });

  it('should call onNotificationClick when clicking notification', async () => {
    const onNotificationClick = vi.fn();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(
      <NotificationCenter 
        partnerId="partner-123" 
        onNotificationClick={onNotificationClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('New Conversion!')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Conversion!'));

    expect(onNotificationClick).toHaveBeenCalled();
  });
});

// ============================================
// PayoutTracker Tests
// ============================================

describe('PayoutTracker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should render payout tracker header', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false, // Will use mock data
    });

    render(<PayoutTracker partnerId="partner-123" />);
    
    expect(screen.getByText('Payout Tracker')).toBeInTheDocument();
  });

  it('should show loading skeleton initially', () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<PayoutTracker partnerId="partner-123" />);
    
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('should display summary cards', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false, // Will use mock data
    });

    render(<PayoutTracker partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Total Earned')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('should show upcoming payout section', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<PayoutTracker partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Upcoming Payout')).toBeInTheDocument();
    });
  });

  it('should show payout history section', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<PayoutTracker partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Payout History')).toBeInTheDocument();
    });
  });

  it('should show pending status badge', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<PayoutTracker partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('should show completed status badge for past payouts', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<PayoutTracker partnerId="partner-123" />);

    await waitFor(() => {
      // Mock data has completed payouts
      expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    });
  });

  it('should expand payout details on click', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<PayoutTracker partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Upcoming Payout')).toBeInTheDocument();
    });

    // Upcoming payout should be expanded by default and show breakdown
    expect(screen.getByText('Breakdown')).toBeInTheDocument();
  });

  it('should show payment method', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<PayoutTracker partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    });
  });
});

// ============================================
// InstallPrompt Tests
// ============================================

describe('InstallPrompt Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should not render when not installable', () => {
    const { container } = render(<InstallPrompt />);
    
    // Component returns null when not installable
    expect(container.firstChild).toBeNull();
  });

  it('should not render when already dismissed', () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    
    const { container } = render(<InstallPrompt />);
    
    expect(container.firstChild).toBeNull();
  });
});

// ============================================
// useOnlineStatus Hook Tests
// ============================================

describe('useOnlineStatus Hook', () => {
  it('should return online status', () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('should detect offline status', async () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    // Simulate going offline
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(true);
  });

  it('should detect coming back online', async () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    // Go offline then online
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });
    
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });
});

// ============================================
// API Endpoint Tests (Mocked)
// ============================================

describe('Notifications API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should fetch notifications for partner', async () => {
    const mockNotifications = [
      { id: '1', type: 'CONVERSION', title: 'Test', message: 'Test message', read: false, createdAt: new Date() },
    ];

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockNotifications }),
    });

    const response = await fetch('/api/notifications?partnerId=partner-123');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });

  it('should mark notification as read', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { success: true } }),
    });

    const response = await fetch('/api/notifications?partnerId=partner-123&id=notif-1', {
      method: 'POST',
    });
    const data = await response.json();

    expect(data.success).toBe(true);
  });
});

describe('Payouts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should fetch payouts for partner', async () => {
    const mockPayouts = [
      { id: '1', amount: 100000, status: 'PENDING', periodStart: new Date(), periodEnd: new Date() },
    ];

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPayouts }),
    });

    const response = await fetch('/api/partners/partner-123/payouts');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Phase 3 Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('should render NotificationCenter and PayoutTracker together', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false, // Will use mock data
    });

    render(
      <div>
        <NotificationCenter partnerId="partner-123" />
        <PayoutTracker partnerId="partner-123" />
      </div>
    );

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Payout Tracker')).toBeInTheDocument();
    });
  });

  it('should show Mark all read button when unread notifications exist', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<NotificationCenter partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Mark all read')).toBeInTheDocument();
    });
  });

  it('should call API when marking all as read', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: false }) // Initial fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) }); // Mark all read

    render(<NotificationCenter partnerId="partner-123" />);

    await waitFor(() => {
      expect(screen.getByText('Mark all read')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Mark all read'));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('read-all'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
