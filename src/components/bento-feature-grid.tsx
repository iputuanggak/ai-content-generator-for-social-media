"use client";

import { motion } from "motion/react";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";

const cards = [
  {
    title: "Multi-Platform Generation",
    description:
      "Generate adapted content for all 8 social media platforms simultaneously from a single prompt.",
    accent: "var(--primary)",
    accentSoft: "var(--secondary)",
    label: "Product screenshot — multi-platform dashboard",
    span: "md:col-span-7",
    imageHeight: 280,
    image: "images/Multi-Platform Generation.avif",
  },
  {
    title: "Brand Settings",
    description:
      "Configure your team's brand voice, default tone, and active platforms. Every generation is automatically influenced by your brand settings.",
    accent: "var(--coral)",
    accentSoft: "var(--coral-soft)",
    label: "Product screenshot — brand settings",
    span: "md:col-span-5",
    imageHeight: 220,
    image: "images/Brand Settings.avif",
  },
  {
    title: "Team Collaboration",
    description:
      "Invite team members to a shared workspace. Your whole team shares the same generation history, brand settings, and platform configurations.",
    accent: "var(--amber)",
    accentSoft: "var(--amber-soft)",
    label: "Product screenshot — team workspace",
    span: "md:col-span-5",
    imageHeight: 220,
    image: "images/Team Collaboration.avif",
  },
  {
    title: "Generation History",
    description:
      "Every generation is saved with its inputs, intended publish date, and all platform outputs — including any edits made after generation.",
    accent: "var(--green-botanical)",
    accentSoft: "var(--green-soft)",
    label: "Product screenshot — generation history",
    span: "md:col-span-7",
    imageHeight: 220,
    image: "images/Generation History.avif",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function BentoFeatureGrid() {
  return (
    <section className="w-full py-24 px-4 sm:px-6 lg:px-8" id="features">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl font-[family-name:var(--font-heading)]">
            Everything your marketing team needs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">
            From creation to collaboration, Lotus streamlines every step of your
            social media workflow.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-5 md:grid-cols-12"
        >
          {cards.map((card) => (
            <motion.article
              key={card.title}
              variants={cardVariants}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-[var(--border)]/40 hover:-translate-y-0.5 ${card.span}`}
            >
              <svg
                className="pointer-events-none absolute -top-8 -left-8 h-32 w-32 opacity-[0.06]"
                viewBox="0 0 120 120"
                aria-hidden="true"
              >
                <path
                  d="M0,0 Q30,10 40,40 T0,80 Z"
                  fill="currentColor"
                  style={{ color: card.accent }}
                />
              </svg>
              <svg
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 opacity-[0.05]"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="30"
                  r="30"
                  fill="currentColor"
                  style={{ color: card.accent }}
                />
                <ellipse
                  cx="30"
                  cy="60"
                  rx="25"
                  ry="15"
                  fill="currentColor"
                  style={{ color: card.accent }}
                />
              </svg>

              <div className="relative">
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.label}
                    className="w-full object-cover"
                    style={{ height: card.imageHeight }}
                  />
                ) : (
                  <ImagePlaceholder
                    width={800}
                    height={card.imageHeight}
                    label={card.label}
                    bgColor={card.accentSoft}
                    className="w-full"
                  />
                )}
                <div
                  className="absolute inset-x-0 bottom-0 h-20"
                  style={{
                    background: `linear-gradient(to top, var(--card), transparent)`,
                  }}
                  aria-hidden="true"
                />
              </div>

              <div className="relative px-6 pb-6 pt-2">
                <div
                  className="mb-3 h-1 w-10 rounded-full"
                  style={{ backgroundColor: card.accent }}
                />
                <h3 className="text-lg font-semibold tracking-tight text-card-foreground">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>

              <svg
                className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 opacity-[0.04]"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <path
                  d="M100,100 Q70,90 60,60 T100,20 Z"
                  fill="currentColor"
                  style={{ color: card.accent }}
                />
              </svg>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
