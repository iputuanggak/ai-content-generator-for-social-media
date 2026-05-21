"use client";

import { motion } from "motion/react";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

const testimonials = [
  {
    quote:
      "Content used to take our team an entire afternoon. Now it takes 10 minutes. The platform-specific adaptations are surprisingly good.",
    name: "Sarah Chen",
    role: "Marketing Lead at Bloom Studio",
    avatarLabel: "Photo — Sarah Chen",
    accent: "var(--primary)",
    accentSoft: "var(--secondary)",
    image: "images/avatar 1.avif",
  },
  {
    quote:
      "I manage 6 client accounts across different platforms. This tool alone cut my workload in half. The brand settings feature is a game-changer.",
    name: "Marcus Rivera",
    role: "Social Media Manager at Pulse Digital",
    avatarLabel: "Photo — Marcus Rivera",
    accent: "var(--coral)",
    accentSoft: "var(--coral-soft)",
    image: "images/avatar 2.avif",
  },
  {
    quote:
      "Finally a tool that understands that a LinkedIn post should not read like a tweet. Each output actually feels native to the platform.",
    name: "Priya Patel",
    role: "Content Strategist at Novara",
    avatarLabel: "Photo — Priya Patel",
    accent: "var(--amber)",
    accentSoft: "var(--amber-soft)",
    image: "images/avatar 3.avif",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function BotanicalCorner({
  position,
  color,
}: {
  position: "top-right" | "bottom-left";
  color: string;
}) {
  const transform =
    position === "top-right"
      ? "translate(12px, -8px)"
      : "translate(-12px, 8px)";
  const d =
    position === "top-right"
      ? "M40,0 C35,10 25,15 20,18 C15,21 8,22 0,24 C4,18 10,14 15,10 C20,6 30,3 40,0Z M30,8 C28,14 22,18 16,20 M24,4 C20,10 14,14 8,16"
      : "M0,40 C10,35 15,25 18,20 C21,15 22,8 24,0 C18,4 14,10 10,15 C6,20 3,30 0,40Z M8,30 C14,28 18,22 20,16 M4,24 C10,20 14,14 16,8";

  return (
    <svg
      className="pointer-events-none absolute h-16 w-16 opacity-[0.12]"
      style={{
        [position === "top-right" ? "right" : "left"]: 0,
        [position === "top-right" ? "top" : "bottom"]: 0,
        transform,
        color,
      }}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path d={d} fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

export function TestimonialCards() {
  return (
    <section
      data-testid="testimonial-section"
      className="w-full py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl font-[family-name:var(--font-heading)]">
            What marketers are saying
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-lg">
            Real results from real teams using Lotus every day.
          </p>
        </motion.div>

        <motion.div
          data-testid="testimonial-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.article
              key={t.name}
              data-testid="testimonial-card"
              variants={cardVariants}
              whileHover={{
                y: -6,
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              className="group relative flex flex-col rounded-2xl border border-border bg-card p-7 pt-0 overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-lg"
            >
              <div
                className="h-1.5 w-full rounded-t-2xl"
                style={{ backgroundColor: t.accent }}
              />

              <BotanicalCorner position="top-right" color={t.accent} />
              <BotanicalCorner position="bottom-left" color={t.accent} />

              <div className="relative z-10 flex flex-col flex-1 pt-6">
                <div className="mb-5 flex items-center gap-4">
                  <div
                    className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-card"
                    style={
                      { "--tw-ring-color": t.accent } as React.CSSProperties
                    }
                  >
                    <img
                      className="h-full w-full rounded-full"
                      src={t.image}
                      alt={t.avatarLabel}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground text-sm">
                      {t.name}
                    </p>
                    <p className="text-muted-foreground text-xs">{t.role}</p>
                  </div>
                </div>

                <span
                  data-testid="decorative-quote"
                  aria-hidden="true"
                  className="pointer-events-none select-none font-heading text-6xl leading-none"
                  style={{ color: t.accent, opacity: 0.15 }}
                >
                  &ldquo;
                </span>

                <blockquote className="-mt-3 mb-4 flex-1 text-card-foreground text-sm leading-relaxed">
                  {t.quote}
                </blockquote>

                <div
                  aria-hidden="true"
                  className="mt-auto h-px w-12 rounded-full"
                  style={{ backgroundColor: t.accent, opacity: 0.3 }}
                />
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
