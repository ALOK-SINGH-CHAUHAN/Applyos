'use client';

import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/dashboard/StatCard';
import { LineChartCard } from '../../components/dashboard/LineChartCard';
import { DonutChartCard } from '../../components/dashboard/DonutChartCard';
import { RankedListCard } from '../../components/dashboard/RankedListCard';
import { DataTableCard } from '../../components/dashboard/DataTableCard';
import { ActivityFeedCard } from '../../components/dashboard/ActivityFeedCard';
import { StatusPanelCard } from '../../components/dashboard/StatusPanelCard';
import { kpiStats } from '../../lib/mockData';

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Overview of your automation performance and activities"
    >
      {/* ── Row 1: KPI Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-5">
        {kpiStats.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            deltaPositive={stat.deltaPositive}
            icon={stat.icon}
            chipBg={stat.chipBg}
            chipText={stat.chipText}
          />
        ))}
      </div>

      {/* ── Row 2: Chart + Donut + Ranked List ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        {/* Area chart — 5 columns */}
        <div className="lg:col-span-5">
          <LineChartCard />
        </div>

        {/* Donut chart — 4 columns */}
        <div className="lg:col-span-4">
          <DonutChartCard />
        </div>

        {/* Ranked list — 3 columns */}
        <div className="lg:col-span-3">
          <RankedListCard />
        </div>
      </div>

      {/* ── Row 3: Table + Activity + Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Data table — 5 columns */}
        <div className="lg:col-span-5">
          <DataTableCard />
        </div>

        {/* Activity feed — 4 columns */}
        <div className="lg:col-span-4">
          <ActivityFeedCard />
        </div>

        {/* Status panel — 3 columns */}
        <div className="lg:col-span-3">
          <StatusPanelCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
