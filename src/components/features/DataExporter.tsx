'use client';

/**
 * DataExporter Component & Utilities
 * 
 * Export data to various formats:
 * - CSV export
 * - JSON export
 * - PDF export (via print)
 * - Clipboard copy
 * 
 * Features:
 * - Generic data export
 * - Column configuration
 * - Loading states
 * - Success/error feedback
 */

import React, { useState, useCallback } from 'react';
import { cn, formatCurrency, formatDate, formatNumber } from '@/lib/utils';

// ============================================
// Types
// ============================================

export type ExportFormat = 'csv' | 'json' | 'pdf' | 'clipboard';

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  accessor?: (row: T) => string | number;
  format?: 'currency' | 'date' | 'number' | 'percentage' | 'text';
}

export interface ExportConfig<T> {
  filename: string;
  columns: ExportColumn<T>[];
  title?: string;
  subtitle?: string;
}

interface DataExporterProps<T> {
  data: T[];
  config: ExportConfig<T>;
  formats?: ExportFormat[];
  className?: string;
  buttonVariant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

interface ExportButtonProps {
  format: ExportFormat;
  onClick: () => void;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

// ============================================
// Format Icons & Labels
// ============================================

const FORMAT_CONFIG: Record<ExportFormat, { icon: string; label: string }> = {
  csv: { icon: '📊', label: 'CSV' },
  json: { icon: '{ }', label: 'JSON' },
  pdf: { icon: '📄', label: 'PDF' },
  clipboard: { icon: '📋', label: 'Copy' },
};

// ============================================
// Export Utilities
// ============================================

function formatValue<T>(
  row: T,
  column: ExportColumn<T>
): string {
  let value: unknown;
  
  if (column.accessor) {
    value = column.accessor(row);
  } else {
    value = (row as Record<string, unknown>)[column.key as string];
  }

  if (value === null || value === undefined) {
    return '';
  }

  switch (column.format) {
    case 'currency':
      return formatCurrency(Number(value));
    case 'date':
      return formatDate(new Date(value as string | number | Date));
    case 'number':
      return formatNumber(Number(value));
    case 'percentage':
      return `${Number(value).toFixed(2)}%`;
    default:
      return String(value);
  }
}

function escapeCSV(value: string): string {
  // If value contains comma, newline, or quote, wrap in quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCSV<T>(
  data: T[],
  config: ExportConfig<T>
): void {
  const headers = config.columns.map(col => col.header);
  const rows = data.map(row =>
    config.columns.map(col => escapeCSV(formatValue(row, col)))
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  downloadFile(csvContent, `${config.filename}.csv`, 'text/csv');
}

export function exportToJSON<T>(
  data: T[],
  config: ExportConfig<T>
): void {
  const formattedData = data.map(row => {
    const obj: Record<string, string> = {};
    config.columns.forEach(col => {
      obj[col.header] = formatValue(row, col);
    });
    return obj;
  });

  const jsonContent = JSON.stringify(formattedData, null, 2);
  downloadFile(jsonContent, `${config.filename}.json`, 'application/json');
}

export function exportToPDF<T>(
  data: T[],
  config: ExportConfig<T>
): void {
  // Create a printable HTML document
  const headers = config.columns.map(col => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${col.header}</th>`).join('');
  const rows = data.map(row =>
    `<tr>${config.columns.map(col => 
      `<td style="border: 1px solid #ddd; padding: 8px;">${formatValue(row, col)}</td>`
    ).join('')}</tr>`
  ).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${config.title ?? config.filename}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
        h1 { margin-bottom: 8px; }
        h2 { color: #666; font-weight: normal; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #f5f5f5; font-weight: 600; }
        tr:nth-child(even) { background-color: #fafafa; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      ${config.title ? `<h1>${config.title}</h1>` : ''}
      ${config.subtitle ? `<h2>${config.subtitle}</h2>` : ''}
      <table>
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export async function exportToClipboard<T>(
  data: T[],
  config: ExportConfig<T>
): Promise<boolean> {
  const headers = config.columns.map(col => col.header);
  const rows = data.map(row =>
    config.columns.map(col => formatValue(row, col))
  );

  const textContent = [
    headers.join('\t'),
    ...rows.map(row => row.join('\t')),
  ].join('\n');

  try {
    await navigator.clipboard.writeText(textContent);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = textContent;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// Export Button Component
// ============================================

function ExportButton({
  format,
  onClick,
  isLoading,
  variant = 'secondary',
  disabled,
}: ExportButtonProps): React.ReactElement {
  const config = FORMAT_CONFIG[format];
  
  const baseClasses = 'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(baseClasses, variantClasses[variant])}
    >
      {isLoading ? (
        <span className="animate-spin">⏳</span>
      ) : (
        <span>{config.icon}</span>
      )}
      <span>{config.label}</span>
    </button>
  );
}

// ============================================
// Main Component
// ============================================

export function DataExporter<T>({
  data,
  config,
  formats = ['csv', 'json', 'clipboard'],
  className,
  buttonVariant = 'secondary',
  disabled = false,
}: DataExporterProps<T>): React.ReactElement {
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  }, []);

  const handleExport = useCallback(async (format: ExportFormat) => {
    if (data.length === 0) {
      showFeedback('error', 'No data to export');
      return;
    }

    setLoadingFormat(format);

    try {
      switch (format) {
        case 'csv':
          exportToCSV(data, config);
          showFeedback('success', 'CSV downloaded');
          break;
        case 'json':
          exportToJSON(data, config);
          showFeedback('success', 'JSON downloaded');
          break;
        case 'pdf':
          exportToPDF(data, config);
          showFeedback('success', 'Print dialog opened');
          break;
        case 'clipboard':
          await exportToClipboard(data, config);
          showFeedback('success', 'Copied to clipboard');
          break;
      }
    } catch (error) {
      showFeedback('error', 'Export failed');
      console.error('Export error:', error);
    } finally {
      setLoadingFormat(null);
    }
  }, [data, config, showFeedback]);

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        {formats.map(format => (
          <ExportButton
            key={format}
            format={format}
            onClick={() => handleExport(format)}
            isLoading={loadingFormat === format}
            variant={buttonVariant}
            disabled={disabled || data.length === 0}
          />
        ))}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={cn(
            'absolute top-full left-0 mt-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-10 animate-in fade-in slide-in-from-top-2',
            feedback.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          )}
        >
          {feedback.type === 'success' ? '✓' : '✕'} {feedback.message}
        </div>
      )}
    </div>
  );
}

// ============================================
// Dropdown Export Menu
// ============================================

interface ExportDropdownProps<T> {
  data: T[];
  config: ExportConfig<T>;
  formats?: ExportFormat[];
  className?: string;
  disabled?: boolean;
}

export function ExportDropdown<T>({
  data,
  config,
  formats = ['csv', 'json', 'pdf', 'clipboard'],
  className,
  disabled = false,
}: ExportDropdownProps<T>): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (data.length === 0) return;

    setLoadingFormat(format);

    try {
      switch (format) {
        case 'csv':
          exportToCSV(data, config);
          break;
        case 'json':
          exportToJSON(data, config);
          break;
        case 'pdf':
          exportToPDF(data, config);
          break;
        case 'clipboard':
          await exportToClipboard(data, config);
          setFeedback('Copied!');
          setTimeout(() => setFeedback(null), 2000);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoadingFormat(null);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || data.length === 0}
        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <span>📥</span>
        <span>{feedback ?? 'Export'}</span>
        <span className={cn('transition-transform', isOpen && 'rotate-180')}>▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
            {formats.map(format => {
              const formatConfig = FORMAT_CONFIG[format];
              return (
                <button
                  key={format}
                  type="button"
                  onClick={() => handleExport(format)}
                  disabled={loadingFormat === format}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
                >
                  {loadingFormat === format ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <span>{formatConfig.icon}</span>
                  )}
                  <span>{formatConfig.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default DataExporter;
