import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to your account to continue
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn 
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg",
              },
            }}
          />
        </div>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Don't have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

