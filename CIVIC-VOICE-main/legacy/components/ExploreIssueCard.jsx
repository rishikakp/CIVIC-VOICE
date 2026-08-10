"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const statusClass = (status) => {
  switch (status) {
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
    default:
      return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100";
  }
};

export default function ExploreIssueCard({ issue }) {
  const [votes, setVotes] = useState(issue.voteCount || 0);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `civic_voice_voted_${issue.id}`;
    setHasVoted(!!window.localStorage.getItem(key));
  }, [issue.id]);

  const handleVote = async () => {
    if (loading) return;
    const key = `civic_voice_voted_${issue.id}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(key)) {
      toast.message("You already voted for this issue on this device.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/vote`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to vote");
      }
      setVotes(data.voteCount ?? votes + 1);
      setHasVoted(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, "1");
      }
      toast.success("Vote recorded");
    } catch (err) {
      toast.error(err.message || "Failed to vote");
    } finally {
      setLoading(false);
    }
  };

  const createdAtFormatted = new Date(issue.createdAt).toLocaleString();

  return (
    <Dialog>
      <div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
        <DialogTrigger asChild>
          <button className="w-full text-left">
            <div className="relative">
              <div className="w-full aspect-[4/3] bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                {issue.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={issue.imageUrl}
                    alt="Issue"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-500">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <span
                className={`absolute top-2 right-2 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${statusClass(
                  issue.status
                )}`}
              >
                {issue.status.replace("_", " ")}
              </span>
            </div>
            <div className="px-4 pt-3 pb-2 space-y-1.5">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2">
                {issue.description}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                {issue.mainArea}
              </p>
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>{issue.severity}</span>
                <span>
                  {votes} vote{votes === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </button>
        </DialogTrigger>
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">
            {votes} vote{votes === 1 ? "" : "s"}
          </span>
          <Button
            type="button"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={handleVote}
            disabled={loading}
          >
            {loading ? "Voting..." : hasVoted ? "Voted" : "Vote"}
          </Button>
        </div>
      </div>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue around you</DialogTitle>
          <DialogDescription>
            See details and support this issue with a vote.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {issue.description}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{issue.mainArea}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-zinc-600 dark:text-zinc-300">
            <div>
              <div className="text-xs text-zinc-500">Status</div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${statusClass(
                  issue.status
                )}`}
              >
                {issue.status.replace("_", " ")}
              </span>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Severity</div>
              <span className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800">
                {issue.severity}
              </span>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Submitted</div>
              <div>{createdAtFormatted}</div>
            </div>
          </div>
          {issue.imageUrl && (
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={issue.imageUrl}
                alt="Issue"
                className="w-full max-h-80 object-cover"
              />
            </div>
          )}
        </div>

        {/* Voting is on the card itself for quick access */}
      </DialogContent>
    </Dialog>
  );
}


