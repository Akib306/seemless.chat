"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  const rawId = React.useId();
  const gradientId = `logoMarkGradient${rawId.replace(/[:]/g, "")}`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
      aria-label="Seemless Chat"
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* Bubble */}
      <rect x="3" y="4" width="18" height="12" rx="6" fill={`url(#${gradientId})`} />
      <rect
        x="3"
        y="4"
        width="18"
        height="12"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Tail */}
      <path d="M9 16.5l-3 2.75V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Lines */}
      <path d="M7.5 9.25h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <path d="M7.5 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={cn("text-foreground", markClassName)} />
      <span className="select-none text-base font-semibold tracking-tight text-foreground">
        Seemless
        <span className="opacity-70">.chat</span>
      </span>
    </span>
  );
}




