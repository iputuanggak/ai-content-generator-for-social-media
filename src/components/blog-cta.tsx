import React from "react";
import Link from "next/link";

export function BlogCta() {
  return (
    <div
      className="rounded-2xl p-8 sm:p-12 text-center"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.55 0.14 170) 0%, oklch(0.45 0.12 175) 100%)",
        boxShadow: "0 8px 40px oklch(0.40 0.10 170 / 0.15)",
      }}
    >
      <p
        className="text-xs font-semibold tracking-widest uppercase mb-4"
        style={{ color: "oklch(0.92 0.04 170)" }}
      >
        Ready to level up?
      </p>
      <h2 className="font-heading text-3xl sm:text-4xl text-white mb-4 leading-tight">
        Generate platform-perfect content
        <br className="hidden sm:block" /> in seconds.
      </h2>
      <p className="text-white/70 text-base sm:text-lg max-w-md mx-auto mb-8 leading-relaxed">
        Lotus turns a single prompt into posts adapted for every social platform
        — tone, format, and character limits handled automatically.
      </p>
      <Link
        href="/register"
        className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-100"
        style={{
          background: "oklch(0.99 0.005 170)",
          color: "oklch(0.35 0.12 170)",
        }}
      >
        Get Started
      </Link>
    </div>
  );
}
