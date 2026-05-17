"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Content used to take our team an entire afternoon. Now it takes 10 minutes. The platform-specific adaptations are surprisingly good.",
    name: "Sarah Chen",
    role: "Marketing Lead at Bloom Studio",
  },
  {
    quote:
      "I manage 6 client accounts across different platforms. This tool alone cut my workload in half. The brand settings feature is a game-changer.",
    name: "Marcus Rivera",
    role: "Social Media Manager at Pulse Digital",
  },
  {
    quote:
      "Finally a tool that understands that a LinkedIn post should not read like a tweet. Each output actually feels native to the platform.",
    name: "Priya Patel",
    role: "Content Strategist at Novara",
  },
];

const rotations = ["-1deg", "0deg", "1deg"];

export function TestimonialCards() {
  return (
    <section data-testid="testimonial-section" className="py-20 px-6 max-w-6xl mx-auto">
      <motion.h2
        className="font-heading text-3xl text-center mb-14 tracking-tight text-foreground"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
      >
        What marketers are saying
      </motion.h2>

      <div
        data-testid="testimonial-grid"
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {testimonials.map((t, i) => (
          <motion.article
            key={t.name}
            data-testid="testimonial-card"
            className="relative rounded-2xl bg-card p-8 shadow-lg overflow-hidden"
            style={{ transform: `rotate(${rotations[i]})` }}
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.6,
            }}
          >
            <span
              data-testid="decorative-quote"
              aria-hidden="true"
              className="absolute top-2 left-4 font-heading text-8xl leading-none text-primary/10 select-none pointer-events-none"
            >
              &ldquo;
            </span>

            <blockquote className="relative z-10 text-foreground text-sm leading-relaxed mb-6">
              {t.quote}
            </blockquote>

            <footer className="relative z-10">
              <p className="font-semibold text-foreground text-sm">{t.name}</p>
              <p className="text-muted-foreground text-xs">{t.role}</p>
            </footer>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
