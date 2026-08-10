import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import IssuesCharts from "@/components/IssuesCharts";
import IgnoredIssuesSection from "@/components/IgnoredIssuesSection";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IssuesPage() {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const [
    openCount,
    resolvedCount,
    totalCount,
    ignoredIssues,
    bestIssues,
    worstIssues,
    trendingIssues,
    resolvedThisWeek,
    categoryGroups,
    recentResolved,
  ] = await Promise.all([
    prisma.issue.count({
      where: { status: { not: "RESOLVED" } },
    }),
    prisma.issue.count({
      where: { status: "RESOLVED" },
    }),
    prisma.issue.count(),
    prisma.issue.findMany({
      where: {
        status: { not: "RESOLVED" },
        createdAt: { lte: sevenDaysAgo },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.issue.findMany({
      where: {
        status: "RESOLVED",
      },
      orderBy: [
        {
          votes: {
            _count: "desc",
          },
        },
        { createdAt: "desc" },
      ],
      take: 3,
      select: {
        id: true,
        description: true,
        severity: true,
        status: true,
        locationName: true,
        createdAt: true,
        votes: {
          select: { id: true },
        },
      },
    }),
    prisma.issue.findMany({
      where: {
        status: { not: "RESOLVED" },
      },
      orderBy: [
        {
          votes: {
            _count: "desc",
          },
        },
        { createdAt: "asc" },
      ],
      take: 3,
      select: {
        id: true,
        description: true,
        severity: true,
        status: true,
        locationName: true,
        createdAt: true,
        votes: {
          select: { id: true },
        },
      },
    }),
    prisma.issue.findMany({
      where: {
        createdAt: { gte: weekAgo },
      },
      orderBy: [
        {
          votes: {
            _count: "desc",
          },
        },
        { createdAt: "desc" },
      ],
      take: 6,
      include: {
        _count: { select: { votes: true } },
      },
    }),
    prisma.issue.findMany({
      where: {
        status: "RESOLVED",
        createdAt: { gte: weekAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        _count: { select: { votes: true } },
      },
    }),
    prisma.issue.groupBy({
      by: ["issueType"],
      _count: { _all: true },
    }),
    prisma.issue.findMany({
      where: {
        status: "RESOLVED",
        createdAt: { gte: yearAgo },
      },
      select: {
        createdAt: true,
      },
    }),
  ]);

  const ignoredSerialized = ignoredIssues.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
  }));

  const bestSerialized = bestIssues.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    votesCount: i.votes.length,
  }));

  const worstSerialized = worstIssues.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    votesCount: i.votes.length,
  }));

  const trendingSerialized = trendingIssues.map((i) => ({
    id: i.id,
    description: i.description,
    locationName: i.locationName,
    createdAt: i.createdAt.toISOString(),
    status: i.status,
    severity: i.severity,
    votesCount: i._count.votes,
  }));

  const resolvedWeekSerialized = resolvedThisWeek.map((i) => ({
    id: i.id,
    description: i.description,
    locationName: i.locationName,
    createdAt: i.createdAt.toISOString(),
    status: i.status,
    severity: i.severity,
    votesCount: i._count.votes,
  }));

  const categoryChartData = categoryGroups
    .map((g) => ({
      category: g.issueType,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const categoryChartConfig = {
    count: {
      label: "Issues",
      color: "hsl(var(--primary))",
    },
  };

  // Build month buckets for the last 12 months (YYYY-MM -> count)
  const monthCounts = new Map();
  for (const row of recentResolved) {
    const d = row.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
  }

  const resolutionTrendData = [];
  // Last 12 months including current month, aggregated per month
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const label = `${d.toLocaleString("default", {
      month: "short",
    })} ${String(d.getFullYear()).slice(-2)}`;
    resolutionTrendData.push({
      date: label,
      resolved: monthCounts.get(key) || 0,
    });
  }

  const resolutionTrendConfig = {
    resolved: {
      label: "Resolved",
      color: "hsl(var(--primary))",
    },
  };

  const resolutionRate =
    totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  const stats = [
    {
      label: "Open Issues",
      value: openCount,
      icon: AlertTriangle,
      accent: "bg-amber-50 text-amber-700",
    },
    {
      label: "Resolved",
      value: resolvedCount,
      icon: CheckCircle2,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total Reported",
      value: totalCount,
      icon: Activity,
      accent: "bg-sky-50 text-sky-700",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto max-w-8xl px-4 py-10 space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-primary mb-1 uppercase">
                Insights
              </p>
              <h1 className="text-3xl font-semibold">Reported Complaints</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                View and track all complaints reported in your area, with live
                analytics.
              </p>
            </div>
            <div className="sm:min-w-[200px] flex sm:justify-end">
              <Button asChild variant="ghost" size="sm" className="h-9 px-3">
                <Link href="/">← Back</Link>
              </Button>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Hide heavy charts on very small screens to keep the page light */}
          <div className="hidden sm:block">
            <IssuesCharts
              categoryData={categoryChartData}
              categoryConfig={categoryChartConfig}
              resolutionData={resolutionTrendData}
              resolutionConfig={resolutionTrendConfig}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {stats.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-xl bg-white dark:bg-zinc-900/60 px-6 py-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.accent}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {card.label}
                    </div>
                  </div>
                  <p className="text-2xl font-semibold">{card.value}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800">
              <CheckCircle2 className="h-3 w-3" />
              <span>
                Approx. <span className="font-semibold">{resolutionRate}%</span>{" "}
                of reported issues have been resolved.
              </span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sky-700 dark:bg-sky-900/20 dark:text-sky-200 border border-sky-100 dark:border-sky-800">
              <TrendingUp className="h-3 w-3" />
              <span>
                Use votes to push the most important issues to the top.
              </span>
            </div>
          </div>

          {ignoredSerialized.length > 0 && (
            <IgnoredIssuesSection issues={ignoredSerialized} />
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg bg-white dark:bg-zinc-900/60 px-6 py-5 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Trending this week</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Top 6 issues with the most votes in the last 7 days.
                </p>
              </div>
              {trendingSerialized.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No trending issues yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {trendingSerialized.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 px-4 py-3"
                    >
                      <p className="font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2">
                        {issue.description}
                      </p>
                      {issue.locationName && (
                        <p className="text-xs text-zinc-500 line-clamp-1">
                          {issue.locationName}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-zinc-500">
                        Submitted on{" "}
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        Votes:{" "}
                        <span className="font-semibold">
                          {issue.votesCount}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-white dark:bg-zinc-900/60 px-6 py-5 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Resolved this week</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  6 issues most recently resolved in the last 7 days.
                </p>
              </div>
              {resolvedWeekSerialized.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No issues resolved this week yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {resolvedWeekSerialized.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 px-4 py-3"
                    >
                      <p className="font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2">
                        {issue.description}
                      </p>
                      {issue.locationName && (
                        <p className="text-xs text-zinc-500 line-clamp-1">
                          {issue.locationName}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-zinc-500">
                        Resolved on{" "}
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        Votes:{" "}
                        <span className="font-semibold">
                          {issue.votesCount}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg bg-white dark:bg-zinc-900/60 px-6 py-5 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Best work</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Top 3 resolved issues with the most community votes.
                </p>
              </div>
              {bestSerialized.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No resolved issues yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bestSerialized.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 px-4 py-3"
                    >
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {issue.description}
                      </p>
                      {issue.locationName && (
                        <p className="text-xs text-zinc-500">
                          {issue.locationName}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-zinc-500">
                        Resolved on{" "}
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        Votes:{" "}
                        <span className="font-semibold">
                          {issue.votesCount}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-white dark:bg-zinc-900/60 px-6 py-5 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Worst work</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Top 3 unresolved issues with the most community votes.
                </p>
              </div>
              {worstSerialized.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No unresolved issues yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {worstSerialized.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 px-4 py-3"
                    >
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {issue.description}
                      </p>
                      {issue.locationName && (
                        <p className="text-xs text-zinc-500">
                          {issue.locationName}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-zinc-500">
                        Submitted on{" "}
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        Votes:{" "}
                        <span className="font-semibold">
                          {issue.votesCount}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
