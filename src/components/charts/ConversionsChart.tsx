/**
 * Conversions Chart Component
 * Displays clicks and conversions over time using Recharts
 */

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

// ============================================
// Types
// ============================================

interface DataPoint {
  date: string;
  clicks: number;
  conversions: number;
}

interface ConversionsChartProps {
  data: DataPoint[];
  height?: number;
  showClicks?: boolean;
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

  const clicks = payload.find(p => p.dataKey === 'clicks')?.value ?? 0;
  const conversions = payload.find(p => p.dataKey === 'conversions')?.value ?? 0;
  const conversionRate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-2">{formattedDate}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 capitalize">{entry.dataKey}</span>
          </span>
          <span className="font-medium" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Conversion Rate</span>
          <span className="font-medium text-gray-900">{conversionRate}%</span>
        </div>
      </div>
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
      <div className="flex items-end justify-around h-full p-4 gap-4">
        {[30, 50, 40, 70, 55, 80, 65].map((h, i) => (
          <div key={i} className="flex gap-1" style={{ width: '12%' }}>
            <div
              className="bg-gray-200 rounded-t"
              style={{ width: '50%', height: `${h}%` }}
            />
            <div
              className="bg-gray-300 rounded-t"
              style={{ width: '50%', height: `${h * 0.15}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Conversions Chart Component
// ============================================

export function ConversionsChart({
  data,
  height = 300,
  showClicks = true,
  loading = false,
}: ConversionsChartProps): React.ReactElement {
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
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value: string) => (
              <span className="text-sm text-gray-600 capitalize">{value}</span>
            )}
          />
          {showClicks && (
            <Bar
              dataKey="clicks"
              fill="#93c5fd"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          )}
          <Bar
            dataKey="conversions"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ConversionsChart;
