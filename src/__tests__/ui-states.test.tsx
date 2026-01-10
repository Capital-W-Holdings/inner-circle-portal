/**
 * Tests for Loading and Error State Components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/test',
}));

describe('Loading States', () => {
  describe('Spinner Component', () => {
    it('should render spinner with default size', async () => {
      const { Spinner } = await import('../components/ui/LoadingStates');
      render(<Spinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should render spinner with different sizes', async () => {
      const { Spinner } = await import('../components/ui/LoadingStates');
      
      const { rerender } = render(<Spinner size="sm" />);
      expect(screen.getByRole('status')).toHaveClass('w-4', 'h-4');
      
      rerender(<Spinner size="lg" />);
      expect(screen.getByRole('status')).toHaveClass('w-8', 'h-8');
    });
  });

  describe('LoadingOverlay Component', () => {
    it('should render with default message', async () => {
      const { LoadingOverlay } = await import('../components/ui/LoadingStates');
      render(<LoadingOverlay />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render with custom message', async () => {
      const { LoadingOverlay } = await import('../components/ui/LoadingStates');
      render(<LoadingOverlay message="Processing..." />);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('PageLoading Component', () => {
    it('should render with loading message', async () => {
      const { PageLoading } = await import('../components/ui/LoadingStates');
      render(<PageLoading />);
      
      // Check for the container role and loading text
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      // Spinner has role="status", check it exists
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  describe('LoadingButton Component', () => {
    it('should render button with children', async () => {
      const { LoadingButton } = await import('../components/ui/LoadingStates');
      render(<LoadingButton isLoading={false}>Click me</LoadingButton>);
      
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should show spinner when loading', async () => {
      const { LoadingButton } = await import('../components/ui/LoadingStates');
      render(<LoadingButton isLoading={true}>Submit</LoadingButton>);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show loading text when provided', async () => {
      const { LoadingButton } = await import('../components/ui/LoadingStates');
      render(
        <LoadingButton isLoading={true} loadingText="Saving...">
          Save
        </LoadingButton>
      );
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should be disabled when loading', async () => {
      const { LoadingButton } = await import('../components/ui/LoadingStates');
      render(<LoadingButton isLoading={true}>Submit</LoadingButton>);
      
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Skeleton Components', () => {
    it('should render basic skeleton', async () => {
      const { Skeleton } = await import('../components/ui/LoadingStates');
      render(<Skeleton className="h-4 w-20" />);
      
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render skeleton card', async () => {
      const { SkeletonCard } = await import('../components/ui/LoadingStates');
      render(<SkeletonCard />);
      
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render skeleton table with rows', async () => {
      const { SkeletonTable } = await import('../components/ui/LoadingStates');
      render(<SkeletonTable rows={3} />);
      
      const container = document.querySelector('.rounded-xl');
      expect(container).toBeInTheDocument();
    });
  });

  describe('ProgressBar Component', () => {
    it('should render with correct progress', async () => {
      const { ProgressBar } = await import('../components/ui/LoadingStates');
      render(<ProgressBar value={50} max={100} />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should show label when enabled', async () => {
      const { ProgressBar } = await import('../components/ui/LoadingStates');
      render(<ProgressBar value={75} showLabel />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });
});

describe('Error States', () => {
  describe('ErrorDisplay Component', () => {
    it('should render error title and message', async () => {
      const { ErrorDisplay } = await import('../components/ui/ErrorStates');
      render(<ErrorDisplay title="Test Error" message="Something went wrong" />);
      
      expect(screen.getByText('Test Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show retry button when onRetry provided', async () => {
      const { ErrorDisplay } = await import('../components/ui/ErrorStates');
      const onRetry = vi.fn();
      render(<ErrorDisplay onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalled();
    });

    it('should display error from Error object', async () => {
      const { ErrorDisplay } = await import('../components/ui/ErrorStates');
      const error = new Error('Test error message');
      render(<ErrorDisplay error={error} />);
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('ApiError Component', () => {
    it('should show appropriate message for 401 error', async () => {
      const { ApiError } = await import('../components/ui/ErrorStates');
      render(<ApiError error={{ status: 401 }} />);
      
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });

    it('should show appropriate message for 403 error', async () => {
      const { ApiError } = await import('../components/ui/ErrorStates');
      render(<ApiError error={{ status: 403 }} />);
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should show appropriate message for 404 error', async () => {
      const { ApiError } = await import('../components/ui/ErrorStates');
      render(<ApiError error={{ status: 404 }} />);
      
      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });

    it('should show appropriate message for 500 error', async () => {
      const { ApiError } = await import('../components/ui/ErrorStates');
      render(<ApiError error={{ status: 500 }} />);
      
      expect(screen.getByText('Server Error')).toBeInTheDocument();
    });

    it('should show error code when provided', async () => {
      const { ApiError } = await import('../components/ui/ErrorStates');
      render(<ApiError error={{ status: 400, code: 'VALIDATION_ERROR' }} />);
      
      expect(screen.getByText(/VALIDATION_ERROR/)).toBeInTheDocument();
    });
  });

  describe('EmptyState Component', () => {
    it('should render title and description', async () => {
      const { EmptyState } = await import('../components/ui/ErrorStates');
      render(
        <EmptyState 
          title="No items" 
          description="Start by adding something" 
        />
      );
      
      expect(screen.getByText('No items')).toBeInTheDocument();
      expect(screen.getByText('Start by adding something')).toBeInTheDocument();
    });

    it('should show action button when provided', async () => {
      const { EmptyState } = await import('../components/ui/ErrorStates');
      const onClick = vi.fn();
      render(
        <EmptyState 
          title="No items" 
          action={{ label: 'Add Item', onClick }}
        />
      );
      
      const button = screen.getByText('Add Item');
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Toast Component', () => {
    it('should render success toast', async () => {
      const { Toast } = await import('../components/ui/ErrorStates');
      render(<Toast type="success" message="Operation successful" />);
      
      expect(screen.getByText('Operation successful')).toBeInTheDocument();
    });

    it('should render error toast', async () => {
      const { Toast } = await import('../components/ui/ErrorStates');
      render(<Toast type="error" message="Something failed" />);
      
      expect(screen.getByText('Something failed')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', async () => {
      const { Toast } = await import('../components/ui/ErrorStates');
      const onClose = vi.fn();
      render(<Toast type="info" message="Info" onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('ErrorBoundary', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  
  afterEach(() => {
    console.error = originalError;
  });

  it('should render children when no error', async () => {
    const { ErrorBoundary } = await import('../components/ui/ErrorStates');
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render fallback when error occurs', async () => {
    const { ErrorBoundary } = await import('../components/ui/ErrorStates');
    
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    render(
      <ErrorBoundary fallback={<div>Error fallback</div>}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Error fallback')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', async () => {
    const { ErrorBoundary } = await import('../components/ui/ErrorStates');
    const onError = vi.fn();
    
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    render(
      <ErrorBoundary onError={onError} fallback={<div>Error</div>}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalled();
  });
});

// Add missing afterEach to outer describe
import { afterEach } from 'vitest';
