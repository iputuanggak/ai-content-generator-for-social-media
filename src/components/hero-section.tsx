"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrganicBlobs } from "@/components/organic-blobs";
import { HeroBeamIllustration } from "@/components/hero-beam-illustration";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function HeroSection() {
  return (
    <section className="relative px-6 py-20 lg:py-28 max-w-6xl mx-auto">
      <OrganicBlobs />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
      >
        <motion.div variants={itemVariants}>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight mb-6 text-foreground">
            Generate social media content for every platform — at once
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed">
            Write one prompt. Get platform-adapted posts for Twitter, LinkedIn,
            Instagram, and 5 more — each tuned to the right tone, length, and
            format.
          </p>
          <Button asChild size="lg">
            <Link href="/register">Start for free</Link>
          </Button>
        </motion.div>
        <motion.div variants={itemVariants} className="flex justify-center">
          <HeroBeamIllustration />
        </motion.div>
      </motion.div>
    </section>
  );
}
