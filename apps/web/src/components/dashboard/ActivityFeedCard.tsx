import React from 'react';
import { Card } from '../ui/Card';
import { activityFeed, type ActivityType } from '../../lib/mockData';

// Icon-in-circle for each event type
function ActivityIcon({ type }: { type: ActivityType }) {
  const styles: Record<ActivityType, { bg: string; icon: React.ReactNode }> = {
    success: {
      bg: 'bg-green-100',
      icon: (
        <svg className="w-3 h-3 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-blue-100',
      icon: (
        <svg className="w-3 h-3 text-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-yellow-100',
      icon: (
        <svg className="w-3 h-3 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-100',
      icon: (
        <svg className="w-3 h-3 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
  };

  const style = styles[type];
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}>
      {style.icon}
    </div>
  );
}

export function ActivityFeedCard() {
  return (
    <Card padding="md" className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-primary">Activity Feed</h2>
        <button className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">
          View All
        </button>
      </div>

      {/* Feed items */}
      <div className="flex flex-col gap-4 flex-1">
        {activityFeed.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <ActivityIcon type={item.type} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-primary leading-tight truncate">{item.title}</p>
              <p className="text-[11px] text-secondary mt-0.5 truncate">{item.subtitle}</p>
            </div>
            <span className="text-[11px] text-secondary flex-shrink-0 mt-0.5">{item.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
