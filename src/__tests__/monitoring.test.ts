/**
 * Monitoring Tests
 * Tests for logging and error reporting utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logger,
  reportError,
  reportMessage,
  setUserContext,
  addBreadcrumb,
  trackApiRequest,
} from '@/lib/monitoring';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(() => 'mock-event-id'),
  captureMessage: vi.fn(() => 'mock-event-id'),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  setContext: vi.fn(),
  setTag: vi.fn(),
  startSpan: vi.fn((_, callback) => callback()),
  metrics: {
    gauge: vi.fn(),
  },
}));

describe('Logger', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log debug messages in development', () => {
    logger.debug('Test debug message');
    expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] Test debug message', '');
  });

  it('should log debug messages with context', () => {
    logger.debug('Test debug message', { foo: 'bar' });
    expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] Test debug message', { foo: 'bar' });
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test info message', '');
  });

  it('should log warning messages', () => {
    logger.warn('Test warning message');
    expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Test warning message', '');
  });

  it('should log error messages', () => {
    const error = new Error('Test error');
    logger.error('Test error message', error);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Test error message', error, '');
  });
});

describe('Error Reporting', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should report errors to console', () => {
    const error = new Error('Test error');
    reportError(error);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should report string errors', () => {
    reportError('String error message');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should report with user context', () => {
    const error = new Error('Test error');
    reportError(error, {
      user: { id: 'user-123', email: 'test@example.com' },
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe('Message Reporting', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should report info messages', () => {
    reportMessage('Test message', 'info');
    // In test mode without Sentry, it logs to console
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should report warning messages', () => {
    reportMessage('Warning message', 'warning');
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});

describe('User Context', () => {
  it('should set user context', () => {
    // This should not throw
    expect(() => {
      setUserContext({
        id: 'user-123',
        email: 'test@example.com',
        partnerId: 'partner-456',
      });
    }).not.toThrow();
  });

  it('should clear user context', () => {
    expect(() => {
      setUserContext(null);
    }).not.toThrow();
  });
});

describe('Breadcrumbs', () => {
  it('should add breadcrumb', () => {
    expect(() => {
      addBreadcrumb('User clicked button', 'ui', { buttonId: 'submit' });
    }).not.toThrow();
  });
});

describe('API Request Tracking', () => {
  it('should track successful API request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: 'test' });
    
    const result = await trackApiRequest('test-api', mockFetch);
    
    expect(mockFetch).toHaveBeenCalled();
    expect(result).toEqual({ data: 'test' });
  });

  it('should track failed API request', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(trackApiRequest('test-api', mockFetch)).rejects.toThrow('Network error');
  });
});
