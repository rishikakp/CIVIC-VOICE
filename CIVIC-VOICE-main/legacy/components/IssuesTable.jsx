"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function IssuesTable({ issues, isAdmin = false }) {
  const [rows, setRows] = useState(issues);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [hasImage, setHasImage] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const issueTypes = useMemo(() => {
    const set = new Set(rows.map((i) => i.issueType).filter(Boolean));
    return Array.from(set);
  }, [rows]);

  const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

  const filtered = useMemo(() => {
    return rows
      .filter((i) => {
        if (typeFilter && i.issueType !== typeFilter) return false;
        if (severityFilter && i.severity !== severityFilter) return false;
        if (hasImage && !i.imageUrl) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          i.description?.toLowerCase().includes(q) ||
          i.location?.toLowerCase().includes(q) ||
          i.locationName?.toLowerCase().includes(q) ||
          i.coordinates?.toLowerCase().includes(q) ||
          i.user?.email?.toLowerCase().includes(q) ||
          i.user?.firstName?.toLowerCase().includes(q) ||
          i.issueType?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return sortAsc ? da - db : db - da;
      });
  }, [issues, typeFilter, severityFilter, hasImage, search, sortAsc]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setSeverityFilter("");
    setHasImage(false);
  };

  const statusOptions = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];

  const handleStatusChange = async (id, status) => {
    if (!status) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/issues/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, status } : row
        )
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Filters
            </span>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <div className="flex items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description, location, user..."
                className="h-9 w-64"
                icon={<Search className="h-4 w-4 text-zinc-500" />}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">All types</option>
              {issueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">All severities</option>
              {severities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={hasImage}
                onChange={(e) => setHasImage(e.target.checked)}
              />
              Has image
            </label>
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => setSortAsc((prev) => !prev)}
            >
              {sortAsc ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="ml-1 text-sm">Date</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              {!isAdmin && <TableHead>Type</TableHead>}
              <TableHead>Severity</TableHead>
              <TableHead>Location</TableHead>
              {isAdmin && <TableHead>Status</TableHead>}
              <TableHead>Submitted</TableHead>
              <TableHead>User</TableHead>
              {!isAdmin && <TableHead>Image</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 6 : 7}
                  className="text-center text-zinc-500"
                >
                  No complaints match the filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                      {issue.description}
                    </div>
                    {issue.locationName && (
                      <div className="text-xs text-zinc-500">
                        {issue.locationName}
                      </div>
                    )}
                  </div>
                </TableCell>
                {!isAdmin && (
                  <TableCell className="capitalize">
                    {issue.issueType || "-"}
                  </TableCell>
                )}
                <TableCell>
                  <Badge>{issue.severity}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{issue.location || "-"}</div>
                  {issue.coordinates && (
                    <div className="text-xs text-zinc-500">
                      {issue.coordinates}
                    </div>
                  )}
                </TableCell>
              {isAdmin && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <select
                      value={issue.status}
                      onChange={(e) =>
                        handleStatusChange(issue.id, e.target.value)
                      }
                      disabled={updatingId === issue.id}
                      className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    {updatingId === issue.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                    )}
                  </div>
                </TableCell>
              )}
                <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                  {new Date(issue.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                  {issue.user
                    ? issue.user.firstName || issue.user.email
                    : "Anonymous"}
                </TableCell>
                {!isAdmin && (
                  <TableCell>
                    {issue.imageUrl ? (
                      <a
                        href={issue.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary underline text-sm"
                      >
                        <ImageIcon className="h-4 w-4" />
                        View
                      </a>
                    ) : (
                      <span className="text-sm text-zinc-500">No image</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
