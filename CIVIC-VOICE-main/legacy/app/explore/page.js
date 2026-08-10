import { prisma } from "@/lib/prisma";
import ExploreIssueCard from "@/components/ExploreIssueCard";
import AdminFiltersBar from "@/components/AdminFiltersBar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const buildAreaLabel = (issue) => {
  const locName =
    issue.locationName || issue.location || issue.coordinates || "";
  if (!locName) return null;

  const parts = locName
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts[0] || locName;
};

export default async function ExplorePage({ searchParams }) {
  const resolvedSearchParams =
    searchParams && typeof searchParams.then === "function"
      ? await searchParams
      : searchParams || {};

  const { q, area, page: pageParam } = resolvedSearchParams;

  const pageSize = 12;
  const page =
    pageParam && !isNaN(parseInt(pageParam, 10))
      ? Math.max(1, parseInt(pageParam, 10))
      : 1;

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
        .map((r) =>
          r.locationName
            ? r.locationName.split(",")[0].trim()
            : null
        )
        .filter(Boolean)
    )
  ).sort();

  const where = {};

  if (area) {
    where.locationName = {
      contains: area,
      mode: "insensitive",
    };
  }

  if (q) {
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { locationName: { contains: q, mode: "insensitive" } },
      { coordinates: { contains: q, mode: "insensitive" } },
    ];
  }

  const totalCount = await prisma.issue.count({ where });

  const issues = await prisma.issue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      _count: { select: { votes: true } },
    },
  });

  const mapped = issues.map((issue) => ({
    id: issue.id,
    description: issue.description,
    issueType: issue.issueType,
    severity: issue.severity,
    status: issue.status,
    location: issue.location,
    coordinates: issue.coordinates,
    locationName: issue.locationName,
    imageUrl: issue.imageUrl,
    createdAt: issue.createdAt.toISOString(),
    mainArea: buildAreaLabel(issue),
    voteCount: issue._count.votes,
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Explore Issues Nearby</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                See what others have reported around you and support important issues
                with a vote.
              </p>
            </div>
            <div className="sm:min-w-[200px] flex sm:justify-end gap-2">
              <Button asChild variant="ghost" size="sm" className="h-9 px-3">
                <Link href="/">← Home</Link>
              </Button>
              <Button asChild size="sm" className="h-9 px-3">
                <Link href="/user">My issues</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-white dark:bg-zinc-900/60 px-6 py-5 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
            <AdminFiltersBar
              basePath="/explore"
              statusFilters={[]}
              commonAreas={commonAreas}
              initialStatus=""
              initialArea={area || ""}
              initialQ={q || ""}
            />
          </div>

          {mapped.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-800 px-6 py-10 text-center text-sm text-zinc-500">
              No issues match these filters yet.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {mapped.map((issue) => (
                  <ExploreIssueCard key={issue.id} issue={issue} />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                <span>
                  Page {page} of {totalPages} &middot; {totalCount} total
                </span>
                <div className="flex gap-2">
                  {(() => {
                    const prevPage = Math.max(1, page - 1);
                    const params = new URLSearchParams(
                      new URLSearchParams(
                        Object.entries(resolvedSearchParams).reduce(
                          (acc, [key, value]) => {
                            if (typeof value === "string") {
                              acc[key] = value;
                            }
                            return acc;
                          },
                          {}
                        )
                      ).toString()
                    );
                    if (prevPage === 1) {
                      params.delete("page");
                    } else {
                      params.set("page", String(prevPage));
                    }
                    const href = `/explore${
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
                    const params = new URLSearchParams(
                      new URLSearchParams(
                        Object.entries(resolvedSearchParams).reduce(
                          (acc, [key, value]) => {
                            if (typeof value === "string") {
                              acc[key] = value;
                            }
                            return acc;
                          },
                          {}
                        )
                      ).toString()
                    );
                    params.set("page", String(nextPage));
                    const href = `/explore${
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
      </main>
    </div>
  );
}


