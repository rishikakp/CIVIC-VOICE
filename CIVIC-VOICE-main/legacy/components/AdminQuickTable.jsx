"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const statusOptions = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];

const statusClass = (status) => {
  switch (status) {
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
    default:
      return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100";
  }
};

export default function AdminQuickTable({ title, issues }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {issues.length === 0 ? (
          <div className="px-4 py-6 text-sm text-zinc-500 text-center">
            No items.
          </div>
        ) : (
          issues.map((issue) => <Row key={issue.id} issue={issue} />)
        )}
      </div>
    </div>
  );
}

function Row({ issue }) {
  const [status, setStatus] = useState(issue.status);
  const [assignedTo, setAssignedTo] = useState(issue.assignedTo || "");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAssignee, setSavingAssignee] = useState(false);

  const handleStatusChange = async (next) => {
    if (!next || next === status) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      setStatus(next);
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAssigneeSave = async () => {
    setSavingAssignee(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update assignee");
      }
      toast.success("Assignee updated");
    } catch (err) {
      toast.error(err.message || "Failed to update assignee");
    } finally {
      setSavingAssignee(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/70 transition-colors">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-zinc-500">#{issue.shortId}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-1">
                {issue.description}
              </div>
              <div className="text-xs text-zinc-500 line-clamp-1">
                {issue.locationName || issue.location || "-"}
              </div>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${statusClass(
                status
              )}`}
            >
              {status.replace("_", " ")}
            </span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue #{issue.shortId}</DialogTitle>
          <DialogDescription>
            Update status or assign quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {issue.description}
            </p>
            <p className="text-xs text-zinc-500">
              {issue.locationName || issue.location || "-"}
            </p>
          </div>
          <div className="text-xs text-zinc-500">
            Reporter: {issue.user?.firstName || issue.user?.email || "Anonymous"}
          </div>
          {issue.imageUrl && (
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={issue.imageUrl}
                alt="Issue"
                className="w-full max-h-64 object-cover"
              />
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                Status
              </span>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={savingStatus}
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
              {savingStatus && (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Assign to..."
                className="h-9"
              />
              <Button
                variant="secondary"
                size="sm"
                className="h-9"
                onClick={handleAssigneeSave}
                disabled={savingAssignee}
              >
                {savingAssignee ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

