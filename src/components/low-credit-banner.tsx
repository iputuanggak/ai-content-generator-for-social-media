"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useCredits } from "@/lib/use-credits";

const DISMISSED_KEY = "lotus_low_credit_dismissed";

function getInitialDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DISMISSED_KEY) === "1";
}

export function LowCreditBanner({ slug }: { slug: string }) {
  const { data } = useCredits();
  const [dismissed, setDismissed] = useState(getInitialDismissed);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  }, []);

  if (!data || data.available >= 10 || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm text-amber-800">
      <span>
        You&apos;re running low on credits.{" "}
        <Link href={`/${slug}/credits`} className="font-medium underline hover:text-amber-900">
          Top up now
        </Link>
      </span>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded p-0.5 text-amber-600 hover:text-amber-900"
        aria-label="Dismiss"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
