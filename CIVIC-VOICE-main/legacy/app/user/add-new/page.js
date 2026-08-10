import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import SimpleIssueForm from "@/components/SimpleIssueForm";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AddNewIssuePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  // Ensure user exists in DB (best-effort)
  await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {},
    create: {
      clerkId: user.id,
      email:
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses[0]?.emailAddress ||
        "",
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      imageUrl: user.imageUrl || null,
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/user">← Back</Link>
          </Button>
        </div>
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold">Report an Issue</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Upload a photo, add details, and submit your report.
          </p>
        </div>
        <Suspense fallback={<div className="text-sm text-zinc-500">Loading form...</div>}>
          <SimpleIssueForm />
        </Suspense>
      </main>
    </div>
  );
}

