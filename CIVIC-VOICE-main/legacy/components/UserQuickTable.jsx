"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function StatusBadge({ status }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium";
  let color =
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100";
  if (status === "RESOLVED") {
    color =
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
  } else if (status === "IN_PROGRESS") {
    color =
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200";
  } else if (status === "ASSIGNED") {
    color =
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
  }
  return <span className={`${base} ${color}`}>{status.replace("_", " ")}</span>;
}

function SeverityBadge({ severity }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium";
  let color =
    "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200";
  if (severity === "CRITICAL") {
    color =
      "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200";
  } else if (severity === "HIGH") {
    color =
      "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200";
  } else if (severity === "MEDIUM") {
    color =
      "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200";
  }
  return <span className={`${base} ${color}`}>{severity}</span>;
}

export default function UserQuickTable({ title, issues }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm w-full overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {issues.length === 0 ? (
          <div className="px-4 py-6 text-sm text-zinc-500 text-center">
            No items in this section.
          </div>
        ) : (
          issues.map((issue) => <Row key={issue.id} issue={issue} />)
        )}
      </div>
    </div>
  );
}

function Row({ issue }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/70 transition-colors">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-zinc-500">
              #{issue.shortId}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-1">
                {issue.description}
              </div>
              <div className="text-xs text-zinc-500 line-clamp-1">
                {issue.locationLabel}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={issue.status} />
              <SeverityBadge severity={issue.severity} />
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Issue #{issue.shortId}
          </DialogTitle>
          <DialogDescription>
            Full details of your reported issue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {issue.description}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {issue.locationLabel}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-zinc-600 dark:text-zinc-300">
            <div>
              <div className="text-xs text-zinc-500">Status</div>
              <StatusBadge status={issue.status} />
            </div>
            <div>
              <div className="text-xs text-zinc-500">Severity</div>
              <SeverityBadge severity={issue.severity} />
            </div>
            <div>
              <div className="text-xs text-zinc-500">Submitted</div>
              <div>{new Date(issue.createdAt).toLocaleString()}</div>
            </div>
          </div>
          {issue.imageUrl && (
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={issue.imageUrl}
                alt="Issue"
                className="w-full max-h-72 object-cover"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


