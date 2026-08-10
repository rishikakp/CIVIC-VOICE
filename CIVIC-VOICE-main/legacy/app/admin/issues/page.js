import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { isAdminEmail } from "@/lib/isAdminEmail";
import AdminIssueCard from "@/components/AdminIssueCard";
import AdminQuickTable from "@/components/AdminQuickTable";
import AdminFiltersBar from "@/components/AdminFiltersBar";

export const dynamic = "force-dynamic";

const statusFilters = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
const severityFilters = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const buildAreaLabel = (locName) => {
  if (!locName) return null;
  const parts = locName
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts[0] || locName;
};

export default async function AdminIssuesPage({ searchParams }) {
  const user = await currentUser();
  if (!user || !isAdminEmail(user, process.env.ADMIN_EMAILS)) {
    redirect("/");
  }

  const resolvedSearchParams =
    searchParams && typeof searchParams.then === "function"
      ? await searchParams
      : searchParams || {};

  const safeParams = () => {
    const params = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (typeof key !== "string") return;
      if (typeof value === "string") {
        params.set(key, value);
      }
    });
    return params;
  };

  const {
    status,
    severity,
    type,
    q,
    queue,
    area,
    page: pageParam,
  } = resolvedSearchParams;

  const pageSize = 10;
  const page =
    pageParam && !isNaN(parseInt(pageParam, 10))
      ? Math.max(1, parseInt(pageParam, 10))
      : 1;

  const where = {};

  if (status && statusFilters.includes(status)) {
    where.status = status;
  }
  if (severity && severityFilters.includes(severity)) {
    where.severity = severity;
  }
  if (type) {
    where.issueType = type;
  }
  if (area) {
    where.locationName = {
      contains: area,
      mode: "insensitive",
    };
  }
  if (queue === "unassigned") {
    where.assignedTo = null;
  } else if (queue === "critical") {
    where.severity = "CRITICAL";
  } else if (queue === "stale") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    where.createdAt = { lte: sevenDaysAgo };
  }

  if (q) {
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { locationName: { contains: q, mode: "insensitive" } },
      { coordinates: { contains: q, mode: "insensitive" } },
      { id: { contains: q } },
      { id: { endsWith: q } },
      {
        user: {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const areaRows = await prisma.issue.findMany({
    select: { locationName: true },
    where: {
      locationName: {
        not: null,
      },
    },
    distinct: ["locationName"],
  });

  const commonAreas = Array.from(
    new Set(
      areaRows
        .map((r) => buildAreaLabel(r.locationName))
        .filter(Boolean)
    )
  ).sort();

  const totalCount = await prisma.issue.count({ where });

  const issues = await prisma.issue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      description: true,
      issueType: true,
      severity: true,
      status: true,
      assignedTo: true,
      location: true,
      coordinates: true,
      locationName: true,
      imageUrl: true,
      createdAt: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  });

  const openCount = issues.filter((i) => i.status !== "RESOLVED").length;
  const resolvedCount = issues.filter((i) => i.status === "RESOLVED").length;
  const total = totalCount;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const withShortId = issues.map((issue) => ({
    ...issue,
    shortId: issue.id.replace(/-/g, "").slice(-4),
  }));

  const quickFilters = [
    {
      key: "unassigned",
      title: "Unassigned (latest 5)",
      where: { assignedTo: null },
    },
    {
      key: "critical",
      title: "Critical (latest 5)",
      where: { severity: "CRITICAL" },
    },
    {
      key: "in_progress",
      title: "In Progress (latest 5)",
      where: { status: "IN_PROGRESS" },
    },
  ];

  const quickLists = [];
  for (const qf of quickFilters) {
    const rows = await prisma.issue.findMany({
      where: qf.where,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        description: true,
        issueType: true,
        severity: true,
        status: true,
        assignedTo: true,
        location: true,
        coordinates: true,
        locationName: true,
        imageUrl: true,
        createdAt: true,
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });
    quickLists.push({
      key: qf.key,
      title: qf.title,
      issues: rows.map((r) => ({
        ...r,
        shortId: r.id.replace(/-/g, "").slice(-4),
        createdAt: r.createdAt.toISOString(),
      })),
    });
  }

  const stats = [
    { label: "Open Issues", value: openCount },
    { label: "Resolved", value: resolvedCount },
    { label: "Total Reported", value: total },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Manage Issues</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Admin view to triage, update status, and review all submissions.
              </p>
            </div>
            <div className="sm:min-w-[200px] flex sm:justify-end">
              <Button asChild variant="ghost" size="sm" className="h-9 px-3">
                <Link href="/">← Back</Link>
              </Button>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {stats.map((card) => (
              <div
                key={card.label}
                className="rounded-lg bg-white dark:bg-zinc-900/60 px-6 py-6 shadow-sm border border-zinc-200 dark:border-zinc-800"
              >
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-white dark:bg-zinc-900/60 px-6 py-5 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
            <AdminFiltersBar
              statusFilters={statusFilters}
              commonAreas={commonAreas}
              initialStatus={status || ""}
              initialArea={area || ""}
              initialQ={q || ""}
            />

            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: "Unassigned", key: "unassigned" },
                { label: "Critical", key: "critical" },
                { label: "Stale (7+ days)", key: "stale" },
              ].map((chip) => {
                const isActive = queue === chip.key;
                const params = safeParams();
                if (isActive) {
                  params.delete("queue");
                } else {
                  params.set("queue", chip.key);
                }
                const href = `/admin/issues${params.toString() ? `?${params.toString()}` : ""}`;
                return (
                  <Link
                    key={chip.key}
                    href={href}
                    className={`rounded-full border px-3 py-1 ${
                      isActive
                        ? "bg-primary text-white border-primary"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200"
                    }`}
                  >
                    {chip.label}
                  </Link>
                );
              })}
            </div>

            {issues.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-800 px-6 py-10 text-center text-sm text-zinc-500">
                No complaints match these filters.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {withShortId.map((issue) => (
                    <AdminIssueCard
                      key={issue.id}
                      issue={{
                        ...issue,
                        createdAt: issue.createdAt.toISOString(),
                      }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                  <span>
                    Page {page} of {totalPages} &middot; {totalCount} total
                  </span>
                  <div className="flex gap-2">
                    {(() => {
                      const prevPage = Math.max(1, page - 1);
                      const params = safeParams();
                      if (prevPage === 1) {
                        params.delete("page");
                      } else {
                        params.set("page", String(prevPage));
                      }
                      const href = `/admin/issues${
                        params.toString() ? `?${params.toString()}` : ""
                      }`;
                      const disabled = page === 1;
                      return (
                        <Link
                          href={href}
                          aria-disabled={disabled}
                          className={`rounded-md border px-3 py-1 ${
                            disabled
                              ? "pointer-events-none opacity-50 border-zinc-200 dark:border-zinc-800"
                              : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          }`}
                        >
                          Prev
                        </Link>
                      );
                    })()}
                    {(() => {
                      const nextPage = Math.min(totalPages, page + 1);
                      const params = safeParams();
                      params.set("page", String(nextPage));
                      const href = `/admin/issues${
                        params.toString() ? `?${params.toString()}` : ""
                      }`;
                      const disabled = page >= totalPages;
                      return (
                        <Link
                          href={href}
                          aria-disabled={disabled}
                          className={`rounded-md border px-3 py-1 ${
                            disabled
                              ? "pointer-events-none opacity-50 border-zinc-200 dark:border-zinc-800"
                              : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          }`}
                        >
                          Next
                        </Link>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {quickLists.map((ql) => (
              <AdminQuickTable key={ql.key} title={ql.title} issues={ql.issues} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
