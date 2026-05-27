"use client";

import { motion } from "motion/react";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

const headingVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const leftCardVariants = {
  hidden: { opacity: 0, x: -40, rotate: -2 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: -1.5,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const rightCardVariants = {
  hidden: { opacity: 0, x: 40, y: 12 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const, delay: 0.15 },
  },
};

const vsBadgeVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 18,
      delay: 0.4,
    },
  },
};

function LeafDecoration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M60 20C60 20 55 45 35 55C20 62 10 58 10 58C10 58 15 33 35 23C50 15 60 20 60 20Z"
        fill="var(--green-soft)"
        opacity="0.5"
      />
      <path
        d="M60 20C60 20 55 45 35 55"
        stroke="var(--green-botanical)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export function ComparisonSection() {
  return (
    <section
      data-testid="comparison-section"
      className="relative py-20 sm:py-28 px-6 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground text-center mb-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={headingVariants}
        >
          Stop juggling. Start generating.
        </motion.h2>
        <motion.p
          className="text-center text-muted-foreground text-base sm:text-lg mb-14 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          See the difference one platform makes.
        </motion.p>

        <div
          data-testid="comparison-grid"
          className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-0 items-center"
        >
          <motion.div
            data-testid="before-panel"
            className="relative rounded-2xl border-2 border-dashed p-6 sm:p-8 origin-center"
            style={{
              borderColor: "oklch(0.78 0.01 200)",
              background:
                "linear-gradient(135deg, oklch(0.95 0.008 200) 0%, oklch(0.92 0.01 210) 100%)",
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={leftCardVariants}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl opacity-[0.04]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, oklch(0.4 0.01 200) 0px, oklch(0.4 0.01 200) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(45deg, oklch(0.4 0.01 200) 0px, oklch(0.4 0.01 200) 1px, transparent 1px, transparent 8px)",
              }}
            />

            <div className="relative z-10">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-5"
                style={{
                  backgroundColor: "oklch(0.88 0.01 200)",
                  color: "oklch(0.45 0.02 200)",
                }}
              >
                Before Lotus
              </span>

              <p
                className="text-sm sm:text-base leading-relaxed mb-6"
                style={{ color: "oklch(0.42 0.02 210)" }}
              >
                Switch between 8 tabs. Copy-paste across platforms. Spend hours
                reformatting. Miss your posting schedule.
              </p>

              <img
                alt="Chaotic multi-tool workflow"
                className="rounded-xl w-full aspect-[16/9]"
                src={"/images/multitask.avif"}
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Chat GPT",
                  "Gemini",
                  "Google Docs",
                  "Calendar",
                  "Spreadsheet",
                ].map((tool) => (
                  <span
                    key={tool}
                    className="text-[10px] font-medium px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: "oklch(0.87 0.01 210)",
                      color: "oklch(0.50 0.02 210)",
                      border: "1px solid oklch(0.82 0.01 210)",
                    }}
                  >
                    {tool}
                  </span>
                ))}
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "oklch(0.87 0.01 210)",
                    color: "oklch(0.50 0.02 210)",
                    border: "1px solid oklch(0.82 0.01 210)",
                  }}
                >
                  and more
                </span>
              </div>
            </div>
          </motion.div>

          <div className="flex lg:flex-col items-center justify-center lg:px-6 py-2 lg:py-0">
            <motion.div
              data-testid="vs-badge"
              className="flex items-center justify-center w-14 h-14 rounded-full font-heading text-lg font-bold text-white shadow-lg relative z-20"
              style={{
                background:
                  "linear-gradient(135deg, var(--coral) 0%, var(--amber) 100%)",
                boxShadow: "0 4px 20px oklch(0.65 0.14 50 / 0.35)",
              }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={vsBadgeVariants}
            >
              VS
            </motion.div>
          </div>

          <motion.div
            data-testid="after-panel"
            className="relative rounded-2xl border-2 p-6 sm:p-8 shadow-xl"
            style={{
              borderColor: "var(--primary)",
              background:
                "linear-gradient(135deg, oklch(0.98 0.01 178) 0%, oklch(0.96 0.02 178) 100%)",
              boxShadow:
                "0 8px 40px oklch(0.48 0.08 178 / 0.12), 0 2px 12px oklch(0.48 0.08 178 / 0.08)",
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={rightCardVariants}
          >
            <div
              aria-hidden="true"
              className="absolute -top-px left-10 right-10 h-2 rounded-b-2xl "
              style={{
                background:
                  "linear-gradient(90deg, var(--primary), var(--green-botanical), var(--primary))",
              }}
            />

            <LeafDecoration className="absolute -top-4 -right-4 w-20 h-20 -rotate-12 pointer-events-none" />
            <LeafDecoration className="absolute -bottom-3 -left-3 w-16 h-16 rotate-45 pointer-events-none opacity-60" />

            <div className="relative z-10">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-5"
                style={{
                  backgroundColor: "var(--green-soft)",
                  color: "var(--primary)",
                }}
              >
                With Lotus
              </span>

              <p className="text-sm sm:text-base leading-relaxed mb-6 text-foreground">
                One prompt generates platform-native content for all 8 networks.
                Edit, schedule, done.
              </p>

              <img
                alt="Lotus dashboard — all platforms"
                className="rounded-xl w-full aspect-[16/9]"
                src={"/images/Lotus Generate Snapshot.avif"}
              />

              <div className="mt-4 flex items-center gap-3">
                <div
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.844 4.656a.75.75 0 010 1.062l-4.25 4.25a.75.75 0 01-1.062 0l-2.126-2.125a.75.75 0 111.062-1.062L7.094 9.438l3.688-3.688a.75.75 0 011.062 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  One prompt
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--green-soft)",
                    color: "var(--green-botanical)",
                  }}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.844 4.656a.75.75 0 010 1.062l-4.25 4.25a.75.75 0 01-1.062 0l-2.126-2.125a.75.75 0 111.062-1.062L7.094 9.438l3.688-3.688a.75.75 0 011.062 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  8 platforms
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--amber-soft)",
                    color: "var(--amber)",
                  }}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.844 4.656a.75.75 0 010 1.062l-4.25 4.25a.75.75 0 01-1.062 0l-2.126-2.125a.75.75 0 111.062-1.062L7.094 9.438l3.688-3.688a.75.75 0 011.062 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Minutes, not hours
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
