export function isAdminEmail(user, envString) {
  if (!user) return false;

  const env =
    envString ??
    (typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_ADMIN_EMAILS
      : "") ??
    process.env.ADMIN_EMAILS ??
    "";

  const list = env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const email =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() ||
    user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

  if (process.env.NODE_ENV === "development") {
    // Helpful debug in dev to see why admin check fails
    // console.log("Admin check:", {
    //   envString: env,
    //   list,
    //   email,
    //   compared: { email, list },
    //   isAdmin: email ? list.includes(email) : false,
    // });
  }

  return email ? list.includes(email) : false;
}
