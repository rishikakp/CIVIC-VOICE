"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, LineChart, MapPin, Users } from "lucide-react";

export default function HeroVisual() {
  const [transform, setTransform] = useState({
    rotateX: 6,
    rotateY: -8,
    translateX: 0,
    translateY: 6,
  });

  const rootRef = useRef(null);

  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;

    const heroSection = rootEl.closest("section");
    if (!heroSection) return;

    const handleMove = (event) => {
      const rect = heroSection.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      setTransform({
        rotateX: y * -10,
        rotateY: x * 12,
        translateX: x * 12,
        translateY: y * 12,
      });
    };

    const handleLeave = () => {
      setTransform({
        rotateX: 6,
        rotateY: -8,
        translateX: 0,
        translateY: 6,
      });
    };

    heroSection.addEventListener("mousemove", handleMove);
    heroSection.addEventListener("mouseleave", handleLeave);

    return () => {
      heroSection.removeEventListener("mousemove", handleMove);
      heroSection.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const style = {
    transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) translate3d(${transform.translateX}px, ${transform.translateY}px, 0)`,
  };

  const iconOffset = (factorX, factorY = factorX) => ({
    transform: `translate3d(${transform.translateX * factorX}px, ${
      transform.translateY * factorY
    }px, 0)`,
  });

  return (
    <div ref={rootRef} className="relative hidden lg:block lg:translate-x-6">
      {/* floating icons */}
      <div
        className="pointer-events-none absolute -left-6 top-6 h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm transition-transform duration-200 ease-out"
        style={iconOffset(0.4, 0.4)}
      >
        <MapPin className="h-5 w-5" />
      </div>
      <div
        className="pointer-events-none absolute -right-4 top-24 h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm transition-transform duration-200 ease-out"
        style={iconOffset(-0.3, 0.2)}
      >
        <Users className="h-4 w-4" />
      </div>
      <div
        className="pointer-events-none absolute -left-4 bottom-10 h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm transition-transform duration-200 ease-out"
        style={iconOffset(0.35, -0.2)}
      >
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div
        className="pointer-events-none absolute -right-10 bottom-4 h-11 w-11 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shadow-sm transition-transform duration-200 ease-out"
        style={iconOffset(-0.45, -0.3)}
      >
        <LineChart className="h-5 w-5" />
      </div>

      {/* 3D card */}
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-lg border border-zinc-100 dark:border-zinc-800 p-4 space-y-3 lg:translate-y-2 transition-transform duration-200 ease-out will-change-transform"
        style={style}
      >
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="font-medium">Recent Issues</span>
          <span>Live</span>
        </div>
        <div className="space-y-2">
          {[
            {
              title: "Pothole on Main Street",
              category: "Roads",
              severity: "HIGH",
              status: "IN PROGRESS",
            },
            {
              title: "Garbage overflow at corner",
              category: "Garbage",
              severity: "CRITICAL",
              status: "SUBMITTED",
            },
          ].map((issue) => (
            <div
              key={issue.title}
              className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 space-y-1"
            >
              <div className="flex justify-between text-xs">
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {issue.title}
                </div>
                <div className="flex items-center gap-1 text-zinc-500">
                  <Users className="h-3 w-3" />
                  <span>24</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-zinc-500">{issue.category}</span>
                <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5">
                  {issue.severity}
                </span>
                <span className="rounded-full bg-sky-100 text-sky-700 px-2 py-0.5">
                  {issue.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          <div className="flex-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-100 border border-amber-100 dark:border-amber-800">
            <div className="font-semibold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Ignored (7+ days)
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-amber-200">
              <div className="h-1.5 w-3/4 rounded-full bg-amber-500" />
            </div>
          </div>
          <div className="flex-1 rounded-lg bg-sky-50 dark:bg-sky-900/20 px-3 py-2 text-[11px] text-sky-900 dark:text-sky-100 border border-sky-100 dark:border-sky-800">
            <div className="font-semibold flex items-center gap-1">
              <LineChart className="h-3 w-3" /> Resolution trend
            </div>
            <div className="mt-1 flex items-end gap-0.5 h-8">
              {[2, 4, 3, 5, 4, 6].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-full bg-sky-500"
                  style={{ height: `${h * 6}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


