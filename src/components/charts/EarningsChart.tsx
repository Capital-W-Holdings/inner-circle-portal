/**
 * Earnings Chart Component
 * Displays earnings over time using Recharts
 */

'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

// ============================================
// Types
// ============================================

interface DataPoint {
  date: string;
  earnings: number;
  conversions?: number;
  clicks?: number;
}

interface EarningsChartProps {
  data: DataPoint[];
  height?: number;
  showConversions?: boolean;
  loading?: boolean;
}

// ============================================
// Custom Tooltip
// ============================================

interface TooltipPayload {
  value: number;
  dataKey: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps): React.ReactElement | null {
  if (!active || !payload || !label) return null;

  const date = parseISO(label);
  const formattedDate = format(date, 'MMM d, yyyy');

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-2">{formattedDate}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <span className="text-gray-600 capitalize">
            {entry.dataKey === 'earnings' ? 'Earnings' : entry.dataKey}
          </span>
          <span className="font-medium" style={{ color: entry.color }}>
            {entry.dataKey === 'earnings'
              ? `$${(entry.value / 100).toFixed(2)}`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Loading Skeleton
// ============================================

function ChartSkeleton({ height }: { height: number }): React.ReactElement {
  return (
    <div 
      className="animate-pulse bg-gray-100 rounded-lg"
      style={{ height }}
    >
      <div className="flex items-end justify-around h-full p-4 gap-2">
        {[40, 60, 45, 80, 65, 90, 75].map((h, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-t"
            style={{ width: '10%', height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Earnings Chart Component
// ============================================

export function EarningsChart({
  data,
  height = 300,
  showConversions = false,
  loading = false,
}: EarningsChartProps): React.ReactElement {
  // Transform data for display
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      displayEarnings: point.earnings / 100, // Convert cents to dollars
    }));
  }, [data]);

  // Format Y-axis ticks
  const formatYAxis = (value: number): string => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };

  // Format X-axis ticks
  const formatXAxis = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return <ChartSkeleton height={height} />;
  }

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg text-gray-500"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            {showConversions && (
              <linearGradient id="conversionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="displayEarnings"
            name="earnings"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#earningsGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1' }}
          />
          {showConversions && (
            <Area
              type="monotone"
              dataKey="conversions"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#conversionsGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EarningsChart;
