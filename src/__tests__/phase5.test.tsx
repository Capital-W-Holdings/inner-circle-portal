import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Components
import { ThemeProvider, ThemeToggle, ThemeToggleButton, useTheme } from '@/components/features/ThemeProvider';
import { KeyboardShortcutsProvider, useKeyboardShortcuts } from '@/components/features/KeyboardShortcuts';
import { DataExporter, ExportDropdown, exportToCSV, exportToJSON } from '@/components/features/DataExporter';
import { AdvancedFilters, useFilters } from '@/components/features/AdvancedFilters';

// ============================================
// ThemeProvider Tests
// ============================================

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('should provide theme context', async () => {
    function TestComponent() {
      const { theme, resolvedTheme } = useTheme();
      return <div data-testid="theme">{theme} - {resolvedTheme}</div>;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toBeInTheDocument();
    });
  });

  it('should default to system theme', async () => {
    function TestComponent() {
      const { theme } = useTheme();
      return <div data-testid="theme">{theme}</div>;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });
  });

  it('should allow setting theme', async () => {
    function TestComponent() {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <div data-testid="theme">{theme}</div>
          <button onClick={() => setTheme('dark')}>Set Dark</button>
        </div>
      );
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Set Dark'));

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });
  });

  it('should persist theme to localStorage', async () => {
    function TestComponent() {
      const { setTheme } = useTheme();
      return <button onClick={() => setTheme('dark')}>Set Dark</button>;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Set Dark')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Set Dark'));

    await waitFor(() => {
      expect(localStorage.getItem('inner-circle-theme')).toBe('dark');
    });
  });
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render theme options', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle showLabel />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });
});

describe('ThemeToggleButton', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render toggle button', async () => {
    render(
      <ThemeProvider>
        <ThemeToggleButton />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});

// ============================================
// KeyboardShortcuts Tests
// ============================================

describe('KeyboardShortcutsProvider', () => {
  it('should provide shortcuts context', () => {
    function TestComponent() {
      const { shortcuts } = useKeyboardShortcuts();
      return <div data-testid="count">{shortcuts.length}</div>;
    }

    render(
      <KeyboardShortcutsProvider>
        <TestComponent />
      </KeyboardShortcutsProvider>
    );

    expect(screen.getByTestId('count')).toBeInTheDocument();
  });

  it('should register shortcuts', () => {
    function TestComponent() {
      const { shortcuts, registerShortcut } = useKeyboardShortcuts();
      
      React.useEffect(() => {
        registerShortcut({
          key: 't',
          description: 'Test shortcut',
          action: () => {},
        });
      }, [registerShortcut]);

      return <div data-testid="count">{shortcuts.length}</div>;
    }

    render(
      <KeyboardShortcutsProvider>
        <TestComponent />
      </KeyboardShortcutsProvider>
    );

    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  it('should open help modal on ? key', async () => {
    render(
      <KeyboardShortcutsProvider>
        <div>Content</div>
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(window, { key: '?' });

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  it('should close help modal on Escape', async () => {
    render(
      <KeyboardShortcutsProvider>
        <div>Content</div>
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(window, { key: '?' });

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });
});

// ============================================
// DataExporter Tests
// ============================================

describe('DataExporter', () => {
  const testData = [
    { name: 'John', email: 'john@test.com', amount: 100 },
    { name: 'Jane', email: 'jane@test.com', amount: 200 },
  ];

  const testConfig = {
    filename: 'test-export',
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'amount', header: 'Amount', format: 'currency' as const },
    ],
  };

  it('should render export buttons', () => {
    render(
      <DataExporter data={testData} config={testConfig} />
    );

    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('should disable buttons when data is empty', () => {
    render(
      <DataExporter data={[]} config={testConfig} />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should render custom formats', () => {
    render(
      <DataExporter data={testData} config={testConfig} formats={['csv', 'clipboard']} />
    );

    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.queryByText('JSON')).not.toBeInTheDocument();
  });
});

describe('ExportDropdown', () => {
  const testData = [{ name: 'Test' }];
  const testConfig = {
    filename: 'test',
    columns: [{ key: 'name', header: 'Name' }],
  };

  it('should render dropdown button', () => {
    render(
      <ExportDropdown data={testData} config={testConfig} />
    );

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should show options on click', async () => {
    render(
      <ExportDropdown data={testData} config={testConfig} />
    );

    fireEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
    });
  });
});

describe('Export utilities', () => {
  it('should generate CSV content', () => {
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const data = [{ name: 'Test', value: 100 }];
    const config = {
      filename: 'test',
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'value', header: 'Value' },
      ],
    };

    // This would trigger download - we just verify it doesn't throw
    expect(() => exportToCSV(data, config)).not.toThrow();
  });

  it('should generate JSON content', () => {
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const data = [{ name: 'Test' }];
    const config = {
      filename: 'test',
      columns: [{ key: 'name', header: 'Name' }],
    };

    expect(() => exportToJSON(data, config)).not.toThrow();
  });
});

// ============================================
// AdvancedFilters Tests
// ============================================

describe('AdvancedFilters', () => {
  const filterConfig = [
    { id: 'search', label: 'Search', type: 'text' as const },
    { id: 'status', label: 'Status', type: 'select' as const, options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ]},
    { id: 'date', label: 'Date', type: 'date' as const },
  ];

  it('should render filter header', () => {
    render(<AdvancedFilters config={filterConfig} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('should render filter inputs', () => {
    render(<AdvancedFilters config={filterConfig} />);

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('should show search input', () => {
    render(<AdvancedFilters config={filterConfig} />);

    expect(screen.getByPlaceholderText('Search search...')).toBeInTheDocument();
  });

  it('should show select options', () => {
    render(<AdvancedFilters config={filterConfig} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should call onFiltersChange when filter changes', async () => {
    const onFiltersChange = vi.fn();

    render(<AdvancedFilters config={filterConfig} onFiltersChange={onFiltersChange} />);

    const searchInput = screen.getByPlaceholderText('Search search...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalled();
    });
  });

  it('should show clear all button when filters are active', async () => {
    render(<AdvancedFilters config={filterConfig} />);

    const searchInput = screen.getByPlaceholderText('Search search...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });
  });

  it('should be collapsible', async () => {
    render(<AdvancedFilters config={filterConfig} collapsible defaultExpanded={false} />);

    // Filter inputs should not be visible when collapsed
    expect(screen.queryByPlaceholderText('Search search...')).not.toBeInTheDocument();

    // Click to expand
    const expandButton = screen.getByText('▶');
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search search...')).toBeInTheDocument();
    });
  });

  it('should render presets if provided', () => {
    const presets = [
      { id: 'preset1', name: 'Active Only', filters: [{ id: 'status', value: 'active' }] },
    ];

    render(<AdvancedFilters config={filterConfig} presets={presets} />);

    expect(screen.getByText('Quick filters:')).toBeInTheDocument();
    expect(screen.getByText('Active Only')).toBeInTheDocument();
  });
});

describe('useFilters hook', () => {
  it('should throw when used outside AdvancedFilters', () => {
    function TestComponent() {
      try {
        useFilters();
        return <div>no error</div>;
      } catch {
        return <div data-testid="error">error thrown</div>;
      }
    }

    render(<TestComponent />);

    expect(screen.getByTestId('error')).toHaveTextContent('error thrown');
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Phase 5 Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render all Phase 5 components together', async () => {
    const filterConfig = [{ id: 'search', label: 'Search', type: 'text' as const }];
    const exportConfig = {
      filename: 'test',
      columns: [{ key: 'name', header: 'Name' }],
    };

    render(
      <ThemeProvider>
        <KeyboardShortcutsProvider>
          <div>
            <ThemeToggle showLabel />
            <AdvancedFilters config={filterConfig} />
            <DataExporter data={[{ name: 'Test' }]} config={exportConfig} />
          </div>
        </KeyboardShortcutsProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
    });
  });

  it('should work with dark mode', async () => {
    function TestComponent() {
      const { setTheme, resolvedTheme } = useTheme();
      return (
        <div>
          <div data-testid="resolved">{resolvedTheme}</div>
          <button onClick={() => setTheme('dark')}>Dark Mode</button>
        </div>
      );
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dark Mode'));

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    });
  });
});

// Need to import React for the test component
import React from 'react';
