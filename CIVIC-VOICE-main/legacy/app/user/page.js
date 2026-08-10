import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import AddIssueDialog from "@/components/AddIssueDialog";
import UserQuickTable from "@/components/UserQuickTable";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UserPage({ searchParams }) {
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }

  const pageSize = 10;
  const page =
    searchParams?.page && !isNaN(parseInt(searchParams.page, 10))
      ? Math.max(1, parseInt(searchParams.page, 10))
      : 1;

  const buildLocationDisplay = (issue) => {
    const locName =
      issue.locationName || issue.location || issue.coordinates || "";
    if (!locName) return { label: "-", url: null };

    const parts = locName
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const main = parts[0] || locName;
    const pincodeMatch = locName.match(/(\d{5,6})/);
    const pin = pincodeMatch ? pincodeMatch[1] : null;
    const label = pin ? `${main} (${pin})` : main;

    const mapsQuery =
      issue.coordinates || issue.locationName || issue.location || locName;
    const url = mapsQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          mapsQuery
        )}`
      : null;

    return { label, url };
  };

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

  const severityClass = (sev) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200";
      case "LOW":
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200";
    }
  };

  const where = {
    user: {
      clerkId: user.id,
    },
  };

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
      location: true,
      coordinates: true,
      locationName: true,
      imageUrl: true,
      createdAt: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const serialized = issues.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
  }));

  const withExtras = serialized.map((issue) => {
    const { label } = buildLocationDisplay(issue);
    return {
      ...issue,
      shortId: issue.id.replace(/-/g, "").slice(-4),
      locationLabel: label,
    };
  });

  const openCount = serialized.filter((i) => i.status !== "RESOLVED").length;
  const resolvedCount = serialized.filter(
    (i) => i.status === "RESOLVED"
  ).length;
  const total = serialized.length;

  const stats = [
    { label: "Open Issues", value: openCount },
    { label: "Resolved", value: resolvedCount },
    { label: "Total Submitted", value: total },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Report & Track Issues</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Capture a photo, submit details, and follow your reports.
              </p>
            </div>
            <div className="sm:min-w-[200px] flex sm:justify-end">
              <AddIssueDialog />
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

          <div className="rounded-lg bg-white dark:bg-zinc-900/60 px-6 py-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-lg font-semibold">Submitted Issues</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Recent issues you’ve reported
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-zinc-600 dark:text-zinc-300">
                  <tr>
                    <th className="py-2 pr-4">Description</th>
                    <th className="py-2 pr-4 hidden sm:table-cell">Location</th>
                    <th className="py-2 pr-4 hidden md:table-cell">Category</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4 hidden sm:table-cell">Severity</th>
                    <th className="py-2 pr-4 hidden md:table-cell">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {withExtras.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-6 text-center text-zinc-500 dark:text-zinc-400"
                      >
                        No issues reported yet.
                      </td>
                    </tr>
                  ) : (
                    withExtras.map((issue) => (
                      <tr key={issue.id}>
                        <td className="py-2 pr-4">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {issue.description}
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-200 hidden sm:table-cell">
                          {issue.locationLabel}
                        </td>
                        <td className="py-2 pr-4 capitalize hidden md:table-cell">
                          {issue.issueType || "-"}
                        </td>
                        <td className="py-2 pr-4 hidden sm:table-cell">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusClass(
                              issue.status
                            )}`}
                          >
                            {issue.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${severityClass(
                              issue.severity
                            )}`}
                          >
                            {issue.severity}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                          {new Date(issue.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                Page {page} of {totalPages} &middot; {totalCount} total
              </span>
              <div className="flex gap-2">
                <Link
                  href={page <= 2 ? "/user" : `/user?page=${page - 1}`}
                  aria-disabled={page === 1}
                  className={`rounded-md border px-3 py-1 ${
                    page === 1
                      ? "pointer-events-none opacity-50 border-zinc-200 dark:border-zinc-800"
                      : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  Prev
                </Link>
                <Link
                  href={`/user?page=${Math.min(totalPages, page + 1)}`}
                  aria-disabled={page >= totalPages}
                  className={`rounded-md border px-3 py-1 ${
                    page >= totalPages
                      ? "pointer-events-none opacity-50 border-zinc-200 dark:border-zinc-800"
                      : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 w-full">
            <UserQuickTable
              title="Open issues"
              issues={withExtras.filter((i) => i.status !== "RESOLVED")}
            />
            <UserQuickTable
              title="Resolved issues"
              issues={withExtras.filter((i) => i.status === "RESOLVED")}
            />
            <UserQuickTable
              title="Critical issues"
              issues={withExtras.filter((i) => i.severity === "CRITICAL")}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
