import React from 'react';
import { Card } from '../ui/Card';
import { topPlatforms } from '../../lib/mockData';

const totalApps = topPlatforms.reduce((sum, p) => sum + p.applications, 0);

function getBarColor(rate: number): string {
  if (rate >= 80) return 'bg-success';
  if (rate >= 70) return 'bg-info';
  return 'bg-warning';
}

export function RankedListCard() {
  return (
    <Card padding="md" className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-primary">Top Job Platforms</h2>
        <button className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">
          View All
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Platform</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary text-right">Apps</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary w-24 text-right">Success Rate</span>
      </div>

      {/* Rows */}
      <div className="space-y-3 flex-1">
        {topPlatforms.map((platform) => (
          <div key={platform.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
            {/* Platform icon + name */}
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ backgroundColor: platform.color }}
              >
                {platform.letter}
              </div>
              <span className="text-[13px] font-medium text-primary truncate">{platform.name}</span>
            </div>

            {/* Application count */}
            <span className="text-[13px] text-secondary font-medium text-right">
              {platform.applications.toLocaleString()}
            </span>

            {/* Success rate + bar */}
            <div className="flex items-center gap-2 w-24 justify-end">
              <span className="text-[12px] font-semibold text-primary flex-shrink-0">{platform.successRate}%</span>
              <div className="w-16 h-1.5 bg-app-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(platform.successRate)}`}
                  style={{ width: `${platform.successRate}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer total */}
      <div className="mt-4 pt-3 border-t border-app-border flex justify-between items-center">
        <span className="text-xs font-semibold text-secondary">Total</span>
        <span className="text-sm font-bold text-primary">{totalApps.toLocaleString()}</span>
      </div>
    </Card>
  );
}
