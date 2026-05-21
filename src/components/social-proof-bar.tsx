"use client";

import { motion } from "motion/react";

const companies = [
  {
    name: "Bloom Studio",
    mark: (
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6" aria-hidden="true">
        <circle cx="16" cy="12" r="4" fill="currentColor" opacity="0.7" />
        <ellipse cx="10" cy="18" rx="4" ry="3" fill="currentColor" opacity="0.5" />
        <ellipse cx="22" cy="18" rx="4" ry="3" fill="currentColor" opacity="0.5" />
        <ellipse cx="13" cy="22" rx="3.5" ry="2.5" fill="currentColor" opacity="0.4" />
        <ellipse cx="19" cy="22" rx="3.5" ry="2.5" fill="currentColor" opacity="0.4" />
        <circle cx="16" cy="18" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "Pulse Digital",
    mark: (
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6" aria-hidden="true">
        <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="2" opacity="0.55" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "Novara",
    mark: (
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6" aria-hidden="true">
        <path d="M16 4L28 16L16 28L4 16L16 4Z" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <path d="M16 10L22 16L16 22L10 16L16 10Z" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
  {
    name: "Verde Collective",
    mark: (
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6" aria-hidden="true">
        <path d="M16 6C16 6 22 12 22 18C22 21.3 19.3 24 16 26C12.7 24 10 21.3 10 18C10 12 16 6 16 6Z" fill="currentColor" opacity="0.55" />
        <path d="M16 12V20M13 16H19" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      </svg>
    ),
  },
  {
    name: "Sunstone Media",
    mark: (
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6" aria-hidden="true">
        <circle cx="16" cy="16" r="5" fill="currentColor" opacity="0.6" />
        <line x1="16" y1="4" x2="16" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        <line x1="16" y1="24" x2="16" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        <line x1="4" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        <line x1="24" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        <line x1="7.5" y1="7.5" x2="10.3" y2="10.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
        <line x1="21.7" y1="21.7" x2="24.5" y2="24.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
        <line x1="24.5" y1="7.5" x2="21.7" y2="10.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
        <line x1="10.3" y1="21.7" x2="7.5" y2="24.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
      </svg>
    ),
  },
  {
    name: "Drift Creative",
    mark: (
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6" aria-hidden="true">
        <path d="M4 20C8 14 12 24 16 18C20 12 24 22 28 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <path d="M4 24C8 18 12 28 16 22C20 16 24 26 28 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
  },
];

export function SocialProofBar() {
  const repeated = Array.from({ length: 5 }, () => companies).flat();

  return (
    <section className="py-14 bg-card overflow-hidden">
      <div className="max-w-5xl mx-auto text-center mb-8 px-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by forward-thinking teams
        </h2>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--card), transparent)" }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--card), transparent)" }}
        />

        <motion.div
          className="flex items-center gap-14 w-max"
          animate={{ x: ["0%", "-20%"] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
        >
          {repeated.map((company, i) => (
            <div
              key={`${company.name}-${i}`}
              className="flex items-center gap-2.5 text-muted-foreground/50 shrink-0 select-none"
            >
              {company.mark}
              <span className="text-sm font-medium tracking-wide whitespace-nowrap">
                {company.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
