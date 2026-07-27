import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { recentApplications, type ApplicationStatus } from '../../lib/mockData';

function statusVariant(status: ApplicationStatus) {
  switch (status) {
    case 'Submitted': return 'success';
    case 'Pending': return 'pending';
    case 'In Review': return 'in-review';
    case 'Rejected': return 'rejected';
    default: return 'default';
  }
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-success font-bold';
  if (score >= 70) return 'text-info font-semibold';
  return 'text-danger font-semibold';
}

export function DataTableCard() {
  return (
    <Card padding="md" className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-primary">Recent Applications</h2>
        <button className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">
          View All
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full">
          <thead>
            <tr>
              {['Job Title', 'Company', 'Platform', 'Status', 'Submitted At', 'Match Score'].map((h) => (
                <th
                  key={h}
                  className="text-left pb-2.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-secondary whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentApplications.map((app) => (
              <tr
                key={app.id}
                className="border-t border-app-border hover:bg-app-bg transition-colors group cursor-pointer"
              >
                {/* Job Title */}
                <td className="py-2.5 px-1">
                  <span className="text-[13px] font-medium text-primary whitespace-nowrap">{app.jobTitle}</span>
                </td>

                {/* Company */}
                <td className="py-2.5 px-1">
                  <span className="text-[13px] text-secondary whitespace-nowrap">{app.company}</span>
                </td>

                {/* Platform with color dot */}
                <td className="py-2.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ backgroundColor: app.platformColor }}
                    >
                      {app.platform[0]}
                    </div>
                    <span className="text-[13px] text-secondary whitespace-nowrap">{app.platform}</span>
                  </div>
                </td>

                {/* Status badge */}
                <td className="py-2.5 px-1">
                  <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
                </td>

                {/* Submitted At */}
                <td className="py-2.5 px-1">
                  <span className="text-[12px] text-secondary whitespace-nowrap">{app.submittedAt}</span>
                </td>

                {/* Match Score */}
                <td className="py-2.5 px-1 text-right">
                  <span className={`text-[13px] ${getScoreColor(app.matchScore)}`}>{app.matchScore}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
