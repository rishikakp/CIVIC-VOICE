"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMemo, useState } from "react";

export default function IgnoredIssuesSection({ issues }) {
  const [severityFilter, setSeverityFilter] = useState("HIGH");
  const [search, setSearch] = useState("");

  const severities = useMemo(
    () =>
      Array.from(
        new Set(issues.map((i) => i.severity).filter(Boolean))
      ).sort(),
    [issues]
  );

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (severityFilter && issue.severity !== severityFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        issue.description?.toLowerCase().includes(q) ||
        issue.locationName?.toLowerCase().includes(q)
      );
    });
  }, [issues, severityFilter, search]);

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900/60 px-6 py-5 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ignored issues</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Issues that have been open for 7+ days without resolution.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description or area..."
            className="h-9 w-full sm:w-60 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">All severities</option>
            {severities.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No ignored issues match these filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((issue) => (
            <Dialog key={issue.id}>
              <DialogTrigger asChild>
                <button className="text-left rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 px-4 py-3 flex flex-col gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2">
                      {issue.description}
                    </p>
                    {issue.locationName && (
                      <p className="text-xs text-zinc-500 line-clamp-1">
                        {issue.locationName}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500">
                      Submitted on{" "}
                      {new Date(issue.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs font-medium">
                      {issue.severity}
                    </span>
                    {issue.status && (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs font-medium">
                        {issue.status.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{issue.description}</DialogTitle>
                  <DialogDescription>
                    Submitted on {new Date(issue.createdAt).toLocaleString()}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  {issue.locationName && (
                    <p>
                      <span className="font-medium">Location: </span>
                      {issue.locationName}
                    </p>
                  )}
                  {issue.location && (
                    <p>
                      <span className="font-medium">Address: </span>
                      {issue.location}
                    </p>
                  )}
                  {issue.coordinates && (
                    <p>
                      <span className="font-medium">Coordinates: </span>
                      {issue.coordinates}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Severity: </span>
                    {issue.severity}
                  </p>
                  {issue.status && (
                    <p>
                      <span className="font-medium">Status: </span>
                      {issue.status.replace("_", " ")}
                    </p>
                  )}
                  {issue.issueType && (
                    <p>
                      <span className="font-medium">Category: </span>
                      {issue.issueType}
                    </p>
                  )}
                  {issue.imageUrl && (
                    <p>
                      <span className="font-medium">Image: </span>
                      <a
                        href={issue.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        View attachment
                      </a>
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}


