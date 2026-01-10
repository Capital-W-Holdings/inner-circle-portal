'use client';

/**
 * ThemeProvider Component
 * 
 * Dark mode support with:
 * - System preference detection
 * - Manual toggle
 * - Persistent preference
 * - CSS class-based theming
 * 
 * Features:
 * - useTheme hook
 * - ThemeToggle component
 * - Automatic system sync
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============================================
// Types
// ============================================

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = 'inner-circle-theme';

// ============================================
// Context
// ============================================

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============================================
// Hook
// ============================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ============================================
// Provider
// ============================================

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY,
}: ThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Get system preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Resolve theme based on preference
  const resolveTheme = useCallback((t: Theme): 'light' | 'dark' => {
    if (t === 'system') {
      return getSystemTheme();
    }
    return t;
  }, [getSystemTheme]);

  // Apply theme to document
  const applyTheme = useCallback((resolved: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    
    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolved === 'dark' ? '#1f2937' : '#6366f1');
    }
  }, []);

  // Initialize from storage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
    }
  }, [storageKey]);

  // Update resolved theme when theme changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [theme, resolveTheme, applyTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  // Set theme with persistence
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  }, [storageKey]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  }, [resolvedTheme, setTheme]);

  // Provide context to children
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================
// Theme Toggle Component
// ============================================

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  className,
  showLabel = false,
}: ThemeToggleProps): React.ReactElement {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; icon: string; label: string }[] = [
    { value: 'light', icon: '☀️', label: 'Light' },
    { value: 'dark', icon: '🌙', label: 'Dark' },
    { value: 'system', icon: '💻', label: 'System' },
  ];

  return (
    <div className={className}>
      {showLabel && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Theme
        </p>
      )}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${theme === option.value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            title={option.label}
          >
            <span className="mr-1">{option.icon}</span>
            {showLabel && option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Simple Toggle Button
// ============================================

export function ThemeToggleButton({
  className,
}: {
  className?: string;
}): React.ReactElement {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-colors
        bg-gray-100 dark:bg-gray-800
        text-gray-600 dark:text-gray-400
        hover:text-gray-900 dark:hover:text-white
        hover:bg-gray-200 dark:hover:bg-gray-700
        ${className}
      `}
      aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {resolvedTheme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeProvider;
