import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get("image");
    const description = formData.get("description")?.toString().trim();
    const issueType = formData.get("issueType")?.toString().trim();
    const severityRaw = formData.get("severity")?.toString().trim();
    const location = formData.get("location")?.toString().trim() || null;
    const coordinates = formData.get("coordinates")?.toString().trim() || null;
    const locationName =
      formData.get("locationName")?.toString().trim() || null;
    const clerkUserId = formData.get("userId")?.toString().trim() || null;

    const severity = severityRaw?.toUpperCase() ?? null;

    const allowedSeverity = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

    if (
      !description ||
      !issueType ||
      !severity ||
      !allowedSeverity.has(severity)
    ) {
      return NextResponse.json(
        { error: "description, issueType, and valid severity are required" },
        { status: 400 }
      );
    }

    let imageUrl = null;

    if (file && typeof file === "object") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageUrl = await uploadImage(buffer, file.name || "issue.jpg");
    }

    // Resolve DB user id from Clerk user id (optional)
    let dbUserId = null;
    if (clerkUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });
      if (dbUser) dbUserId = dbUser.id;
    }

    const issue = await prisma.issue.create({
      data: {
        description,
        issueType,
        severity,
        location,
        coordinates,
        locationName,
        imageUrl,
        userId: dbUserId,
      },
    });

    return NextResponse.json({ success: true, issue });
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}
