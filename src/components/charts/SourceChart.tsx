/**
 * Source Breakdown Chart Component
 * Displays traffic sources as a donut chart
 */

'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

// ============================================
// Types
// ============================================

interface SourceData {
  source: string;
  clicks: number;
  conversions: number;
}

interface SourceChartProps {
  data: SourceData[];
  height?: number;
  metric?: 'clicks' | 'conversions';
  loading?: boolean;
}

// ============================================
// Colors
// ============================================

const COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#f59e0b', // Amber
];

// ============================================
// Custom Tooltip
// ============================================

interface TooltipPayload {
  name: string;
  value: number;
  payload: {
    source: string;
    clicks: number;
    conversions: number;
    fill: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps): React.ReactElement | null {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const conversionRate = data.clicks > 0
    ? ((data.conversions / data.clicks) * 100).toFixed(1)
    : '0';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.fill }}
        />
        <span className="font-medium text-gray-900">{data.source}</span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Clicks</span>
          <span className="font-medium">{data.clicks}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Conversions</span>
          <span className="font-medium">{data.conversions}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-gray-100">
          <span className="text-gray-600">Conv. Rate</span>
          <span className="font-medium text-primary-600">{conversionRate}%</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Custom Legend
// ============================================

interface LegendPayload {
  value: string;
  color: string;
  payload: {
    value: number;
  };
}

interface CustomLegendProps {
  payload?: LegendPayload[];
}

function CustomLegend({ payload }: CustomLegendProps): React.ReactElement | null {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">{entry.value}</span>
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
      className="animate-pulse flex items-center justify-center"
      style={{ height }}
    >
      <div className="w-48 h-48 rounded-full bg-gray-200 relative">
        <div className="absolute inset-8 rounded-full bg-white" />
      </div>
    </div>
  );
}

// ============================================
// Source Chart Component
// ============================================

export function SourceChart({
  data,
  height = 300,
  metric = 'conversions',
  loading = false,
}: SourceChartProps): React.ReactElement {
  // Add colors to data
  const chartData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
    value: item[metric],
  }));

  // Calculate total
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="source"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {/* Center label */}
          <text
            x="50%"
            y="42%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-900 text-2xl font-bold"
          >
            {total}
          </text>
          <text
            x="50%"
            y="52%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-500 text-xs"
          >
            {metric === 'clicks' ? 'Total Clicks' : 'Conversions'}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SourceChart;
