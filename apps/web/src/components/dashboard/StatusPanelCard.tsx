import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { automationStatus, systemUsage } from '../../lib/mockData';

export function StatusPanelCard() {
  return (
    <div className="flex flex-col gap-4">

      {/* ── Automation Status ── */}
      <Card padding="md" className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-primary">Automation Status</h2>
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Running
          </span>
        </div>

        {/* 2×2 mini-metric grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-secondary mb-0.5">Active Tasks</p>
            <p className="text-xl font-bold text-primary">{automationStatus.activeTasks}</p>
          </div>
          <div>
            <p className="text-[11px] text-secondary mb-0.5">Success Rate</p>
            <p className="text-xl font-bold text-primary">{automationStatus.successRate}</p>
          </div>
          <div>
            <p className="text-[11px] text-secondary mb-0.5">Avg Response Time</p>
            <p className="text-xl font-bold text-primary">{automationStatus.avgResponseTime}</p>
          </div>
          <div>
            <p className="text-[11px] text-secondary mb-0.5">Next Run</p>
            <p className="text-xl font-bold text-primary">{automationStatus.nextRun}</p>
          </div>
        </div>

        {/* CTA */}
        <Button variant="primary" fullWidth size="md">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          View All Tasks
        </Button>
      </Card>

      {/* ── System Usage ── */}
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-primary">System Usage</h2>
          <button className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">
            View Details
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {systemUsage.map((item) => (
            <ProgressBar
              key={item.label}
              label={item.label}
              value={item.value}
              showValue
            />
          ))}
        </div>
      </Card>

    </div>
  );
}
