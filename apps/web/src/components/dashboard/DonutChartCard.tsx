'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../ui/Card';
import { donutData } from '../../lib/mockData';

const total = donutData.reduce((sum, d) => sum + d.value, 0);

export function DonutChartCard() {
  return (
    <Card padding="md" className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-primary">Applications by Status</h2>
      </div>

      {/* Chart + Legend */}
      <div className="flex items-center gap-4 flex-1">
        {/* Donut */}
        <div className="relative flex-shrink-0" style={{ width: 150, height: 150 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={68}
                dataKey="value"
                strokeWidth={0}
                paddingAngle={2}
              >
                {donutData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: unknown) => [
                  typeof value === 'number' ? value.toLocaleString() : String(value),
                ]}
                contentStyle={{
                  border: '1px solid #EDEEF3',
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[22px] font-bold text-primary leading-none">
              {total.toLocaleString()}
            </span>
            <span className="text-[10px] text-secondary font-medium mt-0.5">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {donutData.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[12px] text-secondary flex-1">{d.name}</span>
              <span className="text-[12px] font-semibold text-primary">{d.value.toLocaleString()}</span>
              <span className="text-[11px] text-secondary w-10 text-right">({d.pct}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer total */}
      <div className="mt-4 pt-3 border-t border-app-border flex justify-between items-center">
        <span className="text-xs text-secondary font-medium">Total</span>
        <span className="text-sm font-bold text-primary">{total.toLocaleString()}</span>
      </div>
    </Card>
  );
}
