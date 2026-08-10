"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AddIssueDialog() {
  const router = useRouter();

  return (
    <Button
      className="w-full sm:w-auto"
      size="lg"
      onClick={() => router.push("/user/add-new")}
    >
      Add Issue
    </Button>
  );
}
