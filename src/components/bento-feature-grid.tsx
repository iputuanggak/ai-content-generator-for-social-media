"use client";

import { motion } from "motion/react";

const features = [
  {
    testId: "feature-multi-platform",
    title: "Multi-Platform Generation",
    description:
      "Generate adapted content for all 8 social media platforms simultaneously from a single prompt. Each output is tailored to that platform's tone, format, and character limits.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
    span: "sm:col-span-2",
  },
  {
    testId: "feature-brand-settings",
    title: "Brand Settings",
    description:
      "Configure your team's brand voice, default tone, and active platforms. Every generation is automatically influenced by your brand settings for consistent output.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    span: "",
  },
  {
    testId: "feature-team-collaboration",
    title: "Team Collaboration",
    description:
      "Invite team members to a shared workspace. Your whole team shares the same generation history, brand settings, and platform configurations.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    span: "",
  },
  {
    testId: "feature-generation-history",
    title: "Generation History",
    description:
      "Every generation is saved with its inputs, intended publish date, and all platform outputs — including any edits made after generation.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    span: "",
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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function BentoFeatureGrid() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-14 tracking-tight text-foreground">
        Everything your marketing team needs
      </h2>
      <motion.div
        data-testid="bento-grid"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-8"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            data-testid={feature.testId}
            variants={cardVariants}
            className={`relative rounded-xl border border-border bg-card p-7 overflow-hidden group ${feature.span}`}
          >
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-[0.07] pointer-events-none group-hover:opacity-[0.12] transition-opacity"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.55 0.13 178) 0%, transparent 70%)",
              }}
            />
            <div className="mb-4 text-primary">{feature.icon}</div>
            <h3 className="text-lg font-semibold mb-2 text-card-foreground">
              {feature.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
