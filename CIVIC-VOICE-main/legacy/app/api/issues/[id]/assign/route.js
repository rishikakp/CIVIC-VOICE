import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function isAdmin(user) {
  const env = process.env.ADMIN_EMAILS || "";
  const list = env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  return email && list.includes(email);
}

export async function PATCH(req, { params }) {
  try {
    const user = await currentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const assignedToRaw = body.assignedTo;
    const assignedTo =
      typeof assignedToRaw === "string" && assignedToRaw.trim().length > 0
        ? assignedToRaw.trim()
        : null;

    const updated = await prisma.issue.update({
      where: { id },
      data: { assignedTo },
    });

    return NextResponse.json({ success: true, issue: updated });
  } catch (error) {
    console.error("Error updating assignee:", error);
    return NextResponse.json(
      { error: "Failed to update assignee" },
      { status: 500 }
    );
  }
}

