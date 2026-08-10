import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const user = await currentUser();

    if (!user) {
      console.error("❌ No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress || "";

    // Sync user to database
    const dbUser = await prisma.user.upsert({
      where: { clerkId: user.id },
      update: {
        email: email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        imageUrl: user.imageUrl || null,
        updatedAt: new Date(),
      },
      create: {
        clerkId: user.id,
        email: email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        imageUrl: user.imageUrl || null,
      },
    });

    return NextResponse.json({ success: true, user: dbUser });
  } catch (error) {
    console.error("❌ Error syncing user:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || "Failed to sync user" },
      { status: 500 }
    );
  }
}
