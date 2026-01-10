'use client';

/**
 * KeyboardShortcuts Component & Hook
 * 
 * Global keyboard shortcuts with:
 * - Customizable key bindings
 * - Help modal (? key)
 * - Scope-based activation
 * - Conflict prevention
 * 
 * Features:
 * - useKeyboardShortcut hook
 * - KeyboardShortcutsHelp modal
 * - KeyboardShortcutsProvider
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// Types
// ============================================

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  scope?: string;
  enabled?: boolean;
}

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

interface KeyboardShortcutsContextValue {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => () => void;
  unregisterShortcut: (key: string, modifiers?: ShortcutConfig) => void;
  isHelpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  activeScope: string | null;
  setActiveScope: (scope: string | null) => void;
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  defaultShortcuts?: KeyboardShortcut[];
}

// ============================================
// Context
// ============================================

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

// ============================================
// Hook to access context
// ============================================

export function useKeyboardShortcuts(): KeyboardShortcutsContextValue {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
}

// ============================================
// Hook to register a single shortcut
// ============================================

export function useKeyboardShortcut(
  config: ShortcutConfig,
  action: () => void,
  description: string,
  options?: { scope?: string; enabled?: boolean }
): void {
  const { registerShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    const shortcut: KeyboardShortcut = {
      ...config,
      description,
      action,
      scope: options?.scope,
      enabled: options?.enabled ?? true,
    };

    const unregister = registerShortcut(shortcut);
    return unregister;
  }, [config, action, description, options, registerShortcut]);
}

// ============================================
// Utility Functions
// ============================================

function getShortcutKey(config: ShortcutConfig): string {
  const parts: string[] = [];
  if (config.ctrl) parts.push('Ctrl');
  if (config.alt) parts.push('Alt');
  if (config.shift) parts.push('Shift');
  if (config.meta) parts.push('⌘');
  parts.push(config.key.toUpperCase());
  return parts.join('+');
}

function matchesShortcut(event: KeyboardEvent, config: ShortcutConfig): boolean {
  const keyMatch = event.key.toLowerCase() === config.key.toLowerCase();
  const ctrlMatch = !!config.ctrl === (event.ctrlKey || event.metaKey);
  const shiftMatch = !!config.shift === event.shiftKey;
  const altMatch = !!config.alt === event.altKey;
  
  return keyMatch && ctrlMatch && shiftMatch && altMatch;
}

function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable
  );
}

// ============================================
// Default Shortcuts
// ============================================

const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: '/', description: 'Focus search' },
  { key: 'Escape', description: 'Close modal / Cancel' },
  { key: 'n', ctrl: true, description: 'New campaign' },
  { key: 's', ctrl: true, description: 'Share referral link' },
  { key: 'd', ctrl: true, description: 'Go to dashboard' },
  { key: 'p', ctrl: true, description: 'Go to payouts' },
  { key: 'l', ctrl: true, description: 'Go to leaderboard' },
];

// ============================================
// Provider
// ============================================

export function KeyboardShortcutsProvider({
  children,
  defaultShortcuts = [],
}: KeyboardShortcutsProviderProps): React.ReactElement {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(defaultShortcuts);
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [activeScope, setActiveScope] = useState<string | null>(null);
  const shortcutsRef = useRef(shortcuts);

  // Keep ref in sync
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Register shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => [...prev, shortcut]);
    
    // Return unregister function
    return () => {
      setShortcuts(prev => 
        prev.filter(s => 
          !(s.key === shortcut.key && 
            s.ctrl === shortcut.ctrl && 
            s.shift === shortcut.shift &&
            s.alt === shortcut.alt)
        )
      );
    };
  }, []);

  // Unregister shortcut
  const unregisterShortcut = useCallback((key: string, modifiers?: ShortcutConfig) => {
    setShortcuts(prev =>
      prev.filter(s =>
        !(s.key === key &&
          s.ctrl === modifiers?.ctrl &&
          s.shift === modifiers?.shift &&
          s.alt === modifiers?.alt)
      )
    );
  }, []);

  // Global keyboard listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in input
      if (isInputElement(event.target)) {
        // Allow Escape in inputs
        if (event.key !== 'Escape') return;
      }

      // Check for ? key to open help
      if (event.key === '?' && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setHelpOpen(true);
        return;
      }

      // Check for Escape to close help
      if (event.key === 'Escape') {
        if (isHelpOpen) {
          event.preventDefault();
          setHelpOpen(false);
          return;
        }
      }

      // Find matching shortcut
      const currentShortcuts = shortcutsRef.current;
      for (const shortcut of currentShortcuts) {
        if (shortcut.enabled === false) continue;
        if (shortcut.scope && shortcut.scope !== activeScope) continue;
        
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen, activeScope]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcuts,
        registerShortcut,
        unregisterShortcut,
        isHelpOpen,
        setHelpOpen,
        activeScope,
        setActiveScope,
      }}
    >
      {children}
      {isHelpOpen && <KeyboardShortcutsHelp onClose={() => setHelpOpen(false)} />}
    </KeyboardShortcutsContext.Provider>
  );
}

// ============================================
// Help Modal
// ============================================

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

export function KeyboardShortcutsHelp({
  onClose,
}: KeyboardShortcutsHelpProps): React.ReactElement {
  const { shortcuts } = useKeyboardShortcuts();

  // Group shortcuts by scope
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    const scope = shortcut.scope ?? 'General';
    if (!groups[scope]) {
      groups[scope] = [];
    }
    groups[scope].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  // Add default shortcuts for display
  const allGroups = {
    General: DEFAULT_SHORTCUTS,
    ...groupedShortcuts,
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {Object.entries(allGroups).map(([scope, scopeShortcuts]) => (
            <div key={scope} className="mb-6 last:mb-0">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {scope}
              </h3>
              <div className="space-y-2">
                {scopeShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono text-gray-600 dark:text-gray-400">
                      {getShortcutKey(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsProvider;
