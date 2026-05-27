"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

function BotanicalLeaf({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 120 200"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M60 200C60 200 60 120 20 80C-10 50 10 10 60 0C110 10 130 50 100 80C60 120 60 200 60 200Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M60 190C60 190 60 110 30 75C5 50 20 15 60 5"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.18"
        fill="none"
      />
      <path
        d="M55 160C40 145 25 130 35 110"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.12"
        fill="none"
      />
      <path
        d="M65 140C80 125 95 110 85 90"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.12"
        fill="none"
      />
      <path
        d="M52 100C38 88 28 78 40 62"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.12"
        fill="none"
      />
      <path
        d="M68 80C82 68 92 58 80 42"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.12"
        fill="none"
      />
    </svg>
  );
}

function VineDecor({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 60 300"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M30 0C30 0 15 50 25 100C35 150 10 200 20 250C25 275 35 300 30 300"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.1"
        fill="none"
        strokeDasharray="4 6"
      />
      <circle cx="22" cy="60" r="3" fill="currentColor" opacity="0.08" />
      <circle cx="30" cy="130" r="4" fill="currentColor" opacity="0.06" />
      <circle cx="18" cy="200" r="3" fill="currentColor" opacity="0.08" />
      <circle cx="28" cy="260" r="2.5" fill="currentColor" opacity="0.06" />
    </svg>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const textItemVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

const imageItemVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" as const },
  },
};

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/60 bg-card">
      <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border/60">
        <div className="flex gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "var(--coral)" }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "var(--amber)" }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "var(--green-botanical)" }}
          />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-4 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground/60 max-w-xs w-full text-center">
            lotus
          </div>
        </div>
        <div className="w-9" />
      </div>
      {children}
    </div>
  );
}

export function FeatureShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <section
      ref={ref}
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.97 0.015 90) 0%, oklch(0.94 0.03 155) 50%, oklch(0.92 0.04 170) 100%)",
      }}
    >
      <BotanicalLeaf className="absolute -top-8 -left-4 w-28 lg:w-40 text-green-botanical rotate-[-20deg]" />
      <BotanicalLeaf className="absolute -bottom-12 -right-6 w-32 lg:w-48 text-green-botanical rotate-[160deg] scale-x-[-1]" />
      <VineDecor className="absolute top-1/4 -right-3 w-8 h-60 text-green-botanical" />
      <VineDecor className="absolute bottom-1/4 -left-2 w-8 h-48 text-coral rotate-180" />

      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-[0.08] pointer-events-none"
        style={{ backgroundColor: "var(--coral)" }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-[0.07] pointer-events-none"
        style={{ backgroundColor: "var(--amber)" }}
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ backgroundColor: "var(--green-botanical)" }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
      >
        <div className="order-2 lg:order-1">
          <motion.div variants={textItemVariants}>
            <span
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-full mb-6"
              style={{
                color: "var(--primary)",
                backgroundColor: "var(--secondary)",
              }}
            >
              See it in action
            </span>
          </motion.div>

          <motion.h2
            variants={textItemVariants}
            className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-foreground mb-6"
          >
            One prompt.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--primary), var(--coral))",
              }}
            >
              Eight platform-perfect
            </span>{" "}
            posts.
          </motion.h2>

          <motion.p
            variants={textItemVariants}
            className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md"
          >
            Watch your idea transform into tailored content for every social
            network — each post optimized for its platform&apos;s unique
            audience and format.
          </motion.p>

          <motion.div variants={textItemVariants} className="flex gap-3 mt-8">
            {[
              "Twitter",
              "LinkedIn",
              "Instagram",
              "TikTok",
              "Facebook",
              "Threads",
              "Pinterest",
              "YouTube",
            ].map((platform) => (
              <span
                key={platform}
                className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-border/50 text-muted-foreground/70 bg-card/60"
              >
                {platform}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="order-1 lg:order-2">
          <motion.div variants={imageItemVariants}>
            <BrowserFrame>
              <img
                src={"/images/Lotus Generate Snapshot.avif"}
                alt="Product screenshot — AI content generation dashboard"
                className="w-full aspect-16/10"
              />
            </BrowserFrame>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
