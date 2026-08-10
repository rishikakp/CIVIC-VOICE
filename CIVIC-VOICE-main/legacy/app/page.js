import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import HeroVisual from "@/components/HeroVisual";

export default async function Home() {
  const user = await currentUser();

  const primaryCtaHref = user ? "/user" : "/sign-up";

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fb] dark:bg-black font-sans text-zinc-900 dark:text-zinc-50">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)] pointer-events-none" />
          <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-24 relative">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16 hero-intro-animate">
              <div className="space-y-6 max-w-xl text-center lg:text-left mx-auto lg:mx-0">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Civic tech for real impact
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                  Turn local complaints
                  <br />
                  <span className="text-primary">into visible action</span>
                </h1>
                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-xl">
                  Citizens report issues with photos, severity, and location.
                  Neighbors vote on what matters most. Admins get powerful
                  dashboards and analytics to prioritize and resolve problems
                  faster.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="h-11 px-8 text-sm font-semibold"
                  >
                    <Link href={primaryCtaHref}>Start reporting</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-11 px-8 text-sm font-semibold"
                  >
                    <Link href="/explore">View live issues</Link>
                  </Button>
                </div>
                <div className="hidden sm:flex gap-6 pt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">High resolution focus</div>
                      <div className="text-xs">
                        Best work vs worst work views
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/10 text-sky-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Community votes</div>
                      <div className="text-xs">Trending issues each week</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero mocked dashboard */}
              <HeroVisual />
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href="#why-transparency"
                className="scroll-indicator flex flex-col items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400"
              >
                <span>Scroll to explore</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Why transparency matters */}
        <section
          id="why-transparency"
          className="container mx-auto max-w-6xl px-4 py-20 lg:py-24"
        >
          <div className="max-w-6xl mx-auto rounded-3xl bg-white dark:bg-zinc-900/70 shadow-sm border border-zinc-100 dark:border-zinc-800 px-8 py-10 sm:px-12 sm:py-12 lg:px-16">
            <div className="text-center space-y-3 max-w-2xl mx-auto mb-10">
              <p className="text-xs font-semibold tracking-[0.2em] text-primary">
                WHY TRANSPARENCY MATTERS
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Why transparency matters
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300">
                Designed for city teams who want fewer emails and more
                structured insight. Built for residents who are tired of
                shouting into the void.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">Fewer ignored complaints</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Every issue is tracked with timestamps. Nothing slips through
                  the cracks after 7 days without automatic flagging.
                </p>
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">Community-driven priorities</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Voting ensures limited resources go where they matter most—
                  decided by residents, not guesswork.
                </p>
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">Transparent progress</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  12‑month resolution trends and category breakdowns show
                  exactly what&apos;s getting fixed and what isn&apos;t.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="container mx-auto max-w-6xl px-4 py-20 lg:py-24 space-y-10">
            <div className="text-center space-y-3">
              <p className="text-xs font-semibold tracking-[0.2em] text-primary">
                FEATURES
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Everything you need for civic transparency
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
                Built for citizens who want to be heard and administrators who
                want to deliver.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<MapPin className="h-5 w-5" />}
                title="Smart Reporting"
                description="Rich reports with photo evidence, exact location, category selection, and severity from low to critical."
              />
              <FeatureCard
                icon={<Activity className="h-5 w-5" />}
                title="Community Signal"
                description="Voting surfaces what matters most. See trending issues and worst work at a glance."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Admin Dashboard"
                description="Filter by status, severity, area, or queue. Quick lists and inline status updates."
              />
              <FeatureCard
                icon={<BarChart3 className="h-5 w-5" />}
                title="Accountable Analytics"
                description="Ignored issues, trending, best/worst work, and one‑year resolution charts."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto max-w-6xl px-4 py-20 lg:py-24">
          <div className="text-center space-y-3 mb-12">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary">
              HOW IT WORKS
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Three steps to civic action
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
              From spotting a problem to seeing it fixed—Civic Voice makes the
              entire journey transparent.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <StepCard
              number="01"
              title="Report"
              description="Snap a photo, select a category, set severity, and pin your location. Done in under a minute."
            />
            <StepCard
              number="02"
              title="Support"
              description="Neighbors browse and vote on issues. The most important problems rise to the top."
            />
            <StepCard
              number="03"
              title="Resolve"
              description="Admins triage via powerful filters and update statuses as work progresses."
            />
          </div>
        </section>

        {/* For citizens / admins */}
        <section className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="container mx-auto max-w-6xl px-4 py-20 lg:py-24 space-y-10">
            <div className="text-center space-y-3">
              <p className="text-xs font-semibold tracking-[0.2em] text-primary">
                BUILT FOR EVERYONE
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Two sides, one platform
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
                Whether you&apos;re a resident with a complaint or an admin with
                a to‑do list, Civic Voice works for you.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              <AudienceCard
                label="For Citizens"
                icon={<MapPin className="h-5 w-5" />}
                points={[
                  "Report problems in seconds with photo, location, and severity.",
                  "Track the status of every issue you’ve submitted.",
                  "Vote on issues others have raised to push priorities.",
                ]}
              />
              <AudienceCard
                label="For Admins"
                icon={<ShieldCheck className="h-5 w-5" />}
                points={[
                  "Filter by queue: unassigned, critical, stale.",
                  "One‑click status updates from Submitted → Resolved.",
                  "See top resolved issues and surface worst work automatically.",
                ]}
              />
            </div>
          </div>
        </section>

        {/* Insights */}
        <section className="container mx-auto max-w-6xl px-4 py-20 lg:py-24 space-y-10">
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary">
              INSIGHTS
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Accountability built in
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
              Automatic insights that keep everyone honest—from ignored
              complaints to celebrated wins.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Ignored Issues"
              description="Issues open for 7+ days get flagged. Filter by severity and search to find what’s been overlooked."
            />
            <FeatureCard
              icon={<Activity className="h-5 w-5" />}
              title="Trending This Week"
              description="Top 6 issues with the most votes this week. Community priorities, surfaced automatically."
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Best Work"
              description="Top 3 resolved issues with the most votes. Celebrate wins and recognize effective action."
            />
            <FeatureCard
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Worst Work"
              description="Top 3 unresolved issues with the most votes. See where accountability is needed most."
            />
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-zinc-200 dark:border-zinc-800 bg-[#f5f7fb] dark:bg-black">
          <div className="container mx-auto max-w-6xl px-4 py-20 lg:py-24 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to make your city listen?
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto">
              Try Civic Voice as a resident or as a city admin. See how
              structured civic feedback can transform local governance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-11 px-8 text-sm font-semibold"
              >
                <Link href={primaryCtaHref}>Report an issue</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 px-8 text-sm font-semibold"
              >
                <Link href="/admin/issues">See admin demo</Link>
              </Button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No credit card required • Start in seconds
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500">
        © 2024 Civic Voice. Built for better cities.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-6 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-100 bg-white px-6 py-6 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="absolute -left-2 -top-4 text-5xl font-bold text-primary/5">
        {number}
      </div>
      <div className="space-y-2 relative">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {description}
        </p>
      </div>
    </div>
  );
}

function AudienceCard({ label, icon, points }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-6 py-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{label}</h3>
      </div>
      <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
