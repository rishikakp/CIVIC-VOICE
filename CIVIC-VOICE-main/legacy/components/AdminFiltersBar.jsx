"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export default function AdminFiltersBar({
  basePath = "/admin/issues",
  statusFilters = [],
  commonAreas = [],
  initialStatus = "",
  initialArea = "",
  initialQ = "",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState(initialStatus || "");
  const [area, setArea] = useState(initialArea || "");
  const [q, setQ] = useState(initialQ || "");

  const buildUrl = (next) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Reset page when filters change
    params.delete("page");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const apply = (next) => {
    startTransition(() => {
      router.replace(buildUrl(next));
    });
  };

  // live search on type (debounced)
  useEffect(() => {
    const handle = setTimeout(() => {
      apply({ q, status, area });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const onStatusChange = (value) => {
    setStatus(value);
    apply({ q, status: value, area });
  };

  const onAreaChange = (value) => {
    setArea(value);
    apply({ q, status, area: value });
  };

  const onClear = () => {
    setQ("");
    setStatus("");
    setArea("");
    apply({ q: "", status: "", area: "" });
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <Filter className="h-4 w-4" />
        <span>Quick filters</span>
        {isPending && (
          <span className="text-xs text-zinc-400">Updating…</span>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full lg:w-auto">
        <Input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search id, description, location, reporter"
          className="h-9 w-full sm:w-64"
        />
        <select
          name="status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">All status</option>
          {statusFilters.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          name="area"
          value={area}
          onChange={(e) => onAreaChange(e.target.value)}
          className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">All areas</option>
          {commonAreas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          onClick={onClear}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

