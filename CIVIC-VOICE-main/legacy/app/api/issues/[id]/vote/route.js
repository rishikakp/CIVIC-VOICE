import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const issuesIndex = segments.indexOf("issues");
    const id =
      issuesIndex !== -1 && segments.length > issuesIndex + 1
        ? segments[issuesIndex + 1]
        : null;

    if (!id) {
      return NextResponse.json(
        { error: "Missing issue id" },
        { status: 400 }
      );
    }

    const exists = await prisma.issue.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    await prisma.vote.create({
      data: { issueId: id },
    });

    const voteCount = await prisma.vote.count({
      where: { issueId: id },
    });

    return NextResponse.json({ success: true, voteCount });
  } catch (error) {
    console.error("Error voting on issue:", error);
    return NextResponse.json(
      { error: "Failed to vote on issue" },
      { status: 500 }
    );
  }
}


