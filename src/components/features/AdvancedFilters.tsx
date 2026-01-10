'use client';

/**
 * AdvancedFilters Component
 * 
 * Comprehensive filtering system with:
 * - Text search
 * - Date range picker
 * - Multi-select dropdowns
 * - Numeric range filters
 * - Saved filter presets
 * 
 * Features:
 * - useFilters hook
 * - Filter chips display
 * - Clear all functionality
 * - Collapsible panel
 */

import React, { useState, useCallback, useMemo, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export type FilterType = 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: FilterType;
  placeholder?: string;
  options?: FilterOption[];
  min?: number;
  max?: number;
  defaultValue?: unknown;
}

export interface FilterValue {
  id: string;
  value: unknown;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterValue[];
}

interface FiltersContextValue {
  filters: FilterValue[];
  setFilter: (id: string, value: unknown) => void;
  clearFilter: (id: string) => void;
  clearAllFilters: () => void;
  getFilterValue: (id: string) => unknown;
  hasActiveFilters: boolean;
}

interface AdvancedFiltersProps {
  config: FilterConfig[];
  onFiltersChange?: (filters: FilterValue[]) => void;
  presets?: FilterPreset[];
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface FilterInputProps {
  config: FilterConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}

// ============================================
// Context
// ============================================

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function useFilters(): FiltersContextValue {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within AdvancedFilters');
  }
  return context;
}

// ============================================
// Filter Input Components
// ============================================

function TextFilter({
  config,
  value,
  onChange,
}: FilterInputProps): React.ReactElement {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </span>
      <input
        type="text"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={config.placeholder ?? `Search ${config.label.toLowerCase()}...`}
        className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
      />
    </div>
  );
}

function SelectFilter({
  config,
  value,
  onChange,
}: FilterInputProps): React.ReactElement {
  return (
    <select
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
    >
      <option value="">All {config.label}</option>
      {config.options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label} {option.count !== undefined && `(${option.count})`}
        </option>
      ))}
    </select>
  );
}

function MultiSelectFilter({
  config,
  value,
  onChange,
}: FilterInputProps): React.ReactElement {
  const selectedValues = (value as string[]) ?? [];
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newValues.length > 0 ? newValues : null);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-left text-sm flex items-center justify-between"
      >
        <span className={cn(
          selectedValues.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'
        )}>
          {selectedValues.length > 0
            ? `${selectedValues.length} selected`
            : `Select ${config.label.toLowerCase()}`}
        </span>
        <span className={cn('transition-transform', isOpen && 'rotate-180')}>▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {config.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {option.label}
                </span>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-400">{option.count}</span>
                )}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DateFilter({
  config: _config,
  value,
  onChange,
}: FilterInputProps): React.ReactElement {
  return (
    <input
      type="date"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
    />
  );
}

function DateRangeFilter({
  config: _config,
  value,
  onChange,
}: FilterInputProps): React.ReactElement {
  const dateRange = (value as { start?: string; end?: string }) ?? {};

  const updateRange = (key: 'start' | 'end', dateValue: string) => {
    const newRange = { ...dateRange, [key]: dateValue || undefined };
    if (!newRange.start && !newRange.end) {
      onChange(null);
    } else {
      onChange(newRange);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={dateRange.start ?? ''}
        onChange={(e) => updateRange('start', e.target.value)}
        placeholder="Start date"
        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
      />
      <span className="text-gray-400">to</span>
      <input
        type="date"
        value={dateRange.end ?? ''}
        onChange={(e) => updateRange('end', e.target.value)}
        placeholder="End date"
        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
      />
    </div>
  );
}

function NumberRangeFilter({
  config,
  value,
  onChange,
}: FilterInputProps): React.ReactElement {
  const range = (value as { min?: number; max?: number }) ?? {};

  const updateRange = (key: 'min' | 'max', numValue: string) => {
    const newRange = { ...range, [key]: numValue ? Number(numValue) : undefined };
    if (newRange.min === undefined && newRange.max === undefined) {
      onChange(null);
    } else {
      onChange(newRange);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={range.min ?? ''}
        onChange={(e) => updateRange('min', e.target.value)}
        placeholder={config.min !== undefined ? String(config.min) : 'Min'}
        min={config.min}
        max={config.max}
        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
      />
      <span className="text-gray-400">to</span>
      <input
        type="number"
        value={range.max ?? ''}
        onChange={(e) => updateRange('max', e.target.value)}
        placeholder={config.max !== undefined ? String(config.max) : 'Max'}
        min={config.min}
        max={config.max}
        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
      />
    </div>
  );
}

function FilterInput(props: FilterInputProps): React.ReactElement {
  const { config } = props;

  switch (config.type) {
    case 'text':
      return <TextFilter {...props} />;
    case 'select':
      return <SelectFilter {...props} />;
    case 'multiselect':
      return <MultiSelectFilter {...props} />;
    case 'date':
      return <DateFilter {...props} />;
    case 'daterange':
      return <DateRangeFilter {...props} />;
    case 'numberrange':
      return <NumberRangeFilter {...props} />;
    default:
      return <TextFilter {...props} />;
  }
}

// ============================================
// Filter Chips
// ============================================

function FilterChips({
  config,
  filters,
  onClear,
}: {
  config: FilterConfig[];
  filters: FilterValue[];
  onClear: (id: string) => void;
}): React.ReactElement | null {
  const activeFilters = filters.filter((f) => f.value !== null);
  
  if (activeFilters.length === 0) return null;

  const getDisplayValue = (filter: FilterValue): string => {
    const filterConfig = config.find((c) => c.id === filter.id);
    if (!filterConfig) return String(filter.value);

    if (filterConfig.type === 'multiselect' && Array.isArray(filter.value)) {
      return `${filter.value.length} selected`;
    }

    if (filterConfig.type === 'daterange') {
      const range = filter.value as { start?: string; end?: string };
      if (range.start && range.end) return `${range.start} - ${range.end}`;
      if (range.start) return `From ${range.start}`;
      if (range.end) return `Until ${range.end}`;
    }

    if (filterConfig.type === 'numberrange') {
      const range = filter.value as { min?: number; max?: number };
      if (range.min !== undefined && range.max !== undefined) return `${range.min} - ${range.max}`;
      if (range.min !== undefined) return `≥ ${range.min}`;
      if (range.max !== undefined) return `≤ ${range.max}`;
    }

    if (filterConfig.type === 'select' && filterConfig.options) {
      const option = filterConfig.options.find((o) => o.value === filter.value);
      return option?.label ?? String(filter.value);
    }

    return String(filter.value);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map((filter) => {
        const filterConfig = config.find((c) => c.id === filter.id);
        return (
          <span
            key={filter.id}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm rounded-full"
          >
            <span className="font-medium">{filterConfig?.label}:</span>
            <span>{getDisplayValue(filter)}</span>
            <button
              type="button"
              onClick={() => onClear(filter.id)}
              className="ml-1 hover:text-primary-600 dark:hover:text-primary-300"
              aria-label={`Clear ${filterConfig?.label} filter`}
            >
              ✕
            </button>
          </span>
        );
      })}
    </div>
  );
}

// ============================================
// Preset Selector
// ============================================

function PresetSelector({
  presets,
  onSelect,
}: {
  presets: FilterPreset[];
  onSelect: (preset: FilterPreset) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Quick filters:</span>
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onSelect(preset)}
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function AdvancedFilters({
  config,
  onFiltersChange,
  presets = [],
  className,
  collapsible = true,
  defaultExpanded = true,
}: AdvancedFiltersProps): React.ReactElement {
  const [filters, setFilters] = useState<FilterValue[]>(() =>
    config.map((c) => ({ id: c.id, value: c.defaultValue ?? null }))
  );
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const setFilter = useCallback((id: string, value: unknown) => {
    setFilters((prev) => {
      const newFilters = prev.map((f) =>
        f.id === id ? { ...f, value } : f
      );
      onFiltersChange?.(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const clearFilter = useCallback((id: string) => {
    setFilter(id, null);
  }, [setFilter]);

  const clearAllFilters = useCallback(() => {
    setFilters((prev) => {
      const newFilters = prev.map((f) => ({ ...f, value: null }));
      onFiltersChange?.(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const getFilterValue = useCallback((id: string) => {
    return filters.find((f) => f.id === id)?.value;
  }, [filters]);

  const hasActiveFilters = useMemo(() => {
    return filters.some((f) => f.value !== null);
  }, [filters]);

  const applyPreset = useCallback((preset: FilterPreset) => {
    setFilters((prev) => {
      const newFilters = prev.map((f) => {
        const presetFilter = preset.filters.find((pf) => pf.id === f.id);
        return { ...f, value: presetFilter?.value ?? null };
      });
      onFiltersChange?.(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const contextValue: FiltersContextValue = {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    getFilterValue,
    hasActiveFilters,
  };

  return (
    <FiltersContext.Provider value={contextValue}>
      <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {collapsible && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className={cn('transition-transform inline-block', isExpanded && 'rotate-90')}>
                  ▶
                </span>
              </button>
            )}
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🔍</span>
              Filters
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                  {filters.filter((f) => f.value !== null).length}
                </span>
              )}
            </h3>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Presets */}
            {presets.length > 0 && (
              <PresetSelector presets={presets} onSelect={applyPreset} />
            )}

            {/* Filter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {config.map((filterConfig) => (
                <div key={filterConfig.id}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {filterConfig.label}
                  </label>
                  <FilterInput
                    config={filterConfig}
                    value={getFilterValue(filterConfig.id)}
                    onChange={(value) => setFilter(filterConfig.id, value)}
                  />
                </div>
              ))}
            </div>

            {/* Active Filter Chips */}
            <FilterChips
              config={config}
              filters={filters}
              onClear={clearFilter}
            />
          </div>
        )}
      </div>
    </FiltersContext.Provider>
  );
}

export default AdvancedFilters;
