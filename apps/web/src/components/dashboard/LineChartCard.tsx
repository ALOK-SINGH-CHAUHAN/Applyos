'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
} from 'recharts';
import { Card } from '../ui/Card';
import { applicationChartData } from '../../lib/mockData';

const series = [
  { key: 'applications', label: 'Applications', color: '#6C5CE7', dashed: false },
  { key: 'submitted', label: 'Submitted', color: '#22C55E', dashed: false },
  { key: 'interviews', label: 'Interviews', color: '#3B82F6', dashed: false },
  { key: 'offers', label: 'Offers', color: '#F59E0B', dashed: false },
];

const dateRanges = ['Last 7 Days', 'Last 14 Days', 'Last 30 Days'];
const groupBy = ['Day', 'Week', 'Month'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-app-border rounded-xl shadow-card p-3 text-xs">
      <p className="font-semibold text-primary mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-secondary capitalize">{entry.name}:</span>
          <span className="font-semibold text-primary">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChartCard() {
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [group, setGroup] = useState('Day');

  return (
    <Card padding="md" className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-primary">Applications Overview</h2>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="text-xs border border-app-border rounded-lg px-2 py-1.5 text-secondary bg-white focus:outline-none focus:ring-1 focus:ring-accent/30 cursor-pointer"
          >
            {dateRanges.map(r => <option key={r}>{r}</option>)}
          </select>
          <select
            value={group}
            onChange={e => setGroup(e.target.value)}
            className="text-xs border border-app-border rounded-lg px-2 py-1.5 text-secondary bg-white focus:outline-none focus:ring-1 focus:ring-accent/30 cursor-pointer"
          >
            {groupBy.map(g => <option key={g}>Group by: {g}</option>)}
          </select>
        </div>
      </div>

      {/* Legend dots */}
      <div className="flex items-center gap-5 mb-4">
        {series.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-secondary">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={applicationChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#6C5CE7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDEEF3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#8B8FA3' }}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#8B8FA3' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#EDEEF3', strokeWidth: 1 }} />

            {/* Primary series with area fill */}
            <Area
              type="monotone"
              dataKey="applications"
              stroke="#6C5CE7"
              strokeWidth={2}
              fill="url(#primaryGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#6C5CE7', stroke: '#fff', strokeWidth: 2 }}
            />
            {/* Secondary series — lines only */}
            {series.slice(1).map(s => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill="none"
                dot={false}
                activeDot={{ r: 4, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
