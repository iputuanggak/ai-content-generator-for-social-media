"use client";

import { motion } from "motion/react";

const stats = [
  {
    value: "10,000+",
    label: "Posts generated",
    accent: "var(--green-botanical)",
    accentSoft: "var(--green-soft)",
    testId: "stat-posts",
  },
  {
    value: "500+",
    label: "Marketing teams",
    accent: "var(--primary)",
    accentSoft: "var(--secondary)",
    testId: "stat-teams",
  },
  {
    value: "8",
    label: "Platforms supported",
    accent: "var(--green-botanical)",
    accentSoft: "var(--green-soft)",
    testId: "stat-platforms",
  },
  {
    value: "98%",
    label: "Satisfaction rate",
    accent: "var(--primary)",
    accentSoft: "var(--secondary)",
    testId: "stat-satisfaction",
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
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const leafPaths = [
  "M30,5 C30,5 45,20 45,35 C45,50 35,55 30,55 C25,55 15,50 15,35 C15,20 30,5 30,5 Z",
  "M25,8 C25,8 40,22 40,38 C40,54 30,58 25,58 C20,58 10,54 10,38 C10,22 25,8 25,8 Z",
  "M28,2 C28,2 48,18 48,36 C48,54 34,60 28,60 C22,60 8,54 8,36 C8,18 28,2 28,2 Z",
];

export function StatsSection() {
  return (
    <section
      data-testid="stats-section"
      className="relative py-28 px-6 overflow-hidden"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.92 0.025 175 / 50%), transparent)",
          }}
        />
        <motion.svg
          width="120"
          height="140"
          viewBox="0 0 60 65"
          className="absolute top-[8%] left-[5%] opacity-[0.06]"
          style={{ color: "var(--green-botanical)" }}
          initial={{ rotate: -15, y: 0 }}
          animate={{ rotate: [-15, -10, -15], y: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d={leafPaths[0]} fill="currentColor" />
        </motion.svg>
        <motion.svg
          width="100"
          height="120"
          viewBox="0 0 50 60"
          className="absolute top-[15%] right-[8%] opacity-[0.05]"
          style={{ color: "var(--coral)" }}
          initial={{ rotate: 25, y: 0 }}
          animate={{ rotate: [25, 30, 25], y: [0, -10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d={leafPaths[1]} fill="currentColor" />
        </motion.svg>
        <motion.svg
          width="90"
          height="110"
          viewBox="0 0 56 62"
          className="absolute bottom-[10%] left-[12%] opacity-[0.04]"
          style={{ color: "var(--amber)" }}
          initial={{ rotate: -30, y: 0 }}
          animate={{ rotate: [-30, -25, -30], y: [0, -6, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d={leafPaths[2]} fill="currentColor" />
        </motion.svg>
        <motion.svg
          width="80"
          height="100"
          viewBox="0 0 50 60"
          className="absolute bottom-[15%] right-[15%] opacity-[0.05]"
          style={{ color: "var(--green-botanical)" }}
          initial={{ rotate: 40, y: 0 }}
          animate={{ rotate: [40, 45, 40], y: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d={leafPaths[1]} fill="currentColor" />
        </motion.svg>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
            Trusted by growing teams
          </h2>
        </motion.div>

        <motion.div
          data-testid="stats-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              data-testid={stat.testId}
              data-placeholder
              variants={cardVariants}
              className="relative rounded-2xl border border-border bg-card p-8 text-center overflow-hidden group"
            >
              <div
                aria-hidden="true"
                className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none transition-transform duration-500 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle, ${stat.accentSoft} 0%, transparent 70%)`,
                }}
              />
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-[3px] opacity-60"
                style={{ background: stat.accent }}
              />
              <div className="relative z-10">
                <p
                  className="text-5xl sm:text-6xl font-heading font-bold tracking-tight mb-3"
                  style={{ color: stat.accent }}
                >
                  {stat.value}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
