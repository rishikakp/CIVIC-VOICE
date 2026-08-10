"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, LineChart, XAxis, YAxis } from "recharts";

export default function IssuesCharts({
  categoryData,
  categoryConfig,
  resolutionData,
  resolutionConfig,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-lg bg-white dark:bg-zinc-900/60 px-4 py-4 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-2">
        <div>
          <h2 className="text-sm font-semibold">Issues by category</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Distribution of all reported issues across categories.
          </p>
        </div>
        <ChartContainer config={categoryConfig} className="mt-2 h-64">
          <BarChart data={categoryData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>

      <div className="rounded-lg bg-white dark:bg-zinc-900/60 px-4 py-4 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-2">
        <div>
          <h2 className="text-sm font-semibold">Resolution trend (1 year)</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Issues resolved per month over the last year.
          </p>
        </div>
        <ChartContainer config={resolutionConfig} className="mt-2 h-64">
          <BarChart data={resolutionData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="resolved"
              fill="var(--color-resolved)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}


