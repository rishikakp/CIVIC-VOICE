"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Shield, Menu } from "lucide-react";
import { isAdminEmail } from "@/lib/isAdminEmail";

export default function Topbar() {
  const { user, isSignedIn } = useUser();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isAdmin = useMemo(() => isAdminEmail(user), [user]);

  const NavLinks = (
    <>
      <Link
        href="/"
        className={`text-base md:text-sm font-semibold transition pr-2 md:pr-0 ${
          pathname === "/"
            ? "text-primary"
            : "text-zinc-700/70 dark:text-zinc-200/70 hover:text-primary dark:hover:text-primary"
        }`}
      >
        Home
      </Link>
      <Link
        href="/explore"
        className={`text-base md:text-sm font-semibold transition pr-2 md:pr-0 ${
          pathname === "/explore"
            ? "text-primary"
            : "text-zinc-700/70 dark:text-zinc-200/70 hover:text-primary dark:hover:text-primary"
        }`}
      >
        Explore
      </Link>
      <Link
        href="/issues"
        className={`text-base md:text-sm font-semibold transition pr-2 md:pr-0 ${
          pathname === "/issues"
            ? "text-primary"
            : "text-zinc-700/70 dark:text-zinc-200/70 hover:text-primary dark:hover:text-primary"
        }`}
      >
        Issues
      </Link>
      <Link
        href="/user"
        className={`text-base md:text-sm font-semibold transition pr-2 md:pr-0 ${
          pathname === "/user"
            ? "text-primary"
            : "text-zinc-700/70 dark:text-zinc-200/70 hover:text-primary dark:hover:text-primary"
        }`}
      >
        User
      </Link>
      {isAdmin && (
        <Link
          href="/admin/issues"
          className={`text-base md:text-sm font-semibold transition pr-2 md:pr-0 ${
            pathname === "/admin/issues"
              ? "text-primary"
              : "text-zinc-700/70 dark:text-zinc-200/70 hover:text-primary dark:hover:text-primary"
          }`}
        >
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <Link href="/" className="text-xl font-semibold">
            Civic Voice
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden flex-1 justify-center items-center gap-6 md:flex">
          {NavLinks}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {isSignedIn && user ? (
            <>
              <span className="hidden sm:inline text-sm text-zinc-600 dark:text-zinc-400">
                {user.firstName ||
                  user.primaryEmailAddress?.emailAddress ||
                  user.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <div className="hidden sm:flex gap-2">
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-2 py-1 text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 md:hidden"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile dropdown with smooth slide / fade */}
      <div
        className={`md:hidden bg-white px-4 text-sm shadow-sm dark:bg-black transition-all duration-200 ease-out overflow-hidden ${
          open
            ? "border-t border-zinc-200 dark:border-zinc-800 pt-2 pb-3 max-h-64 opacity-100 translate-y-0"
            : "border-transparent pt-0 pb-0 max-h-0 opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="ml-auto flex flex-col items-end gap-2 text-right">
          {NavLinks}
          {!isSignedIn && (
            <div className="mt-2 flex w-full justify-end gap-2">
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
