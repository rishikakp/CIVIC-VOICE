"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const statusOptions = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

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

const buildLocationLabel = (issue) => {
  const locName =
    issue.locationName || issue.location || issue.coordinates || "";
  if (!locName) return "-";

  const parts = locName
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const main = parts[0] || locName;
  const pincodeMatch = locName.match(/(\d{5,6})/);
  const pin = pincodeMatch ? pincodeMatch[1] : null;
  return pin ? `${main} (${pin})` : main;
};

export default function AdminIssueCard({ issue }) {
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

  const createdAtFormatted = new Date(issue.createdAt).toLocaleString();
  const locationLabel = buildLocationLabel(issue);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full text-left rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow transition-all overflow-hidden">
          <div className="relative">
            <div className="w-full aspect-square bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              {issue.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={issue.imageUrl}
                  alt="Issue"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-zinc-500">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
            </div>
            <span
              className={`absolute top-2 right-2 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${statusClass(
                status
              )}`}
            >
              {status.replace("_", " ")}
            </span>
          </div>
          <div className="px-4 py-3 space-y-2">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2">
              {issue.description}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              ID: {issue.shortId}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
              {locationLabel}
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
              <Badge>{issue.severity}</Badge>
              {issue.issueType && <Badge>{issue.issueType}</Badge>}
            </div>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue details</DialogTitle>
          <DialogDescription>
            Review this complaint, assign a fixer, and update the status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {issue.description}
            </p>
            <p className="text-xs text-zinc-500">ID: {issue.shortId}</p>
            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
              <Badge>{issue.severity}</Badge>
              {issue.issueType && <Badge>{issue.issueType}</Badge>}
              {issue.assignedTo && <Badge>Assigned: {issue.assignedTo}</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-zinc-600 dark:text-zinc-300">
            <div>
              <div className="text-xs text-zinc-500">Location</div>
              <div className="text-sm text-zinc-700 dark:text-zinc-200">
                {issue.location || "-"}
              </div>
              {issue.locationName && (
                <div className="text-xs text-zinc-500">{issue.locationName}</div>
              )}
              {issue.coordinates && (
                <div className="text-xs text-zinc-500">{issue.coordinates}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-zinc-500">Submitted</div>
              <div>{createdAtFormatted}</div>
              <div className="mt-2 text-xs text-zinc-500">
                Reporter: {issue.user?.firstName || issue.user?.email || "Anonymous"}
              </div>
            </div>
          </div>

          {issue.imageUrl && (
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={issue.imageUrl}
                alt="Issue photo"
                className="w-full max-h-80 object-cover"
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

