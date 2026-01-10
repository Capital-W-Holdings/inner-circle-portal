import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  writable: true,
  value: vi.fn(),
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Mock crypto.getRandomValues
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint32Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 0xFFFFFFFF);
      }
      return arr;
    },
  },
});

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(() => Promise.resolve()),
}));

// Mock fetch
globalThis.fetch = vi.fn();

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
