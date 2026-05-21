"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const, delay: 0.3 },
  },
};

const floatingLeaf = {
  animate: {
    y: [0, -14, 0],
    rotate: [0, 3, -2, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const floatingLeafSlow = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, -3, 2, 0],
    transition: { duration: 8, repeat: Infinity, ease: "easeInOut" as const },
  },
};

function BotanicalLeaf({
  className,
  style,
  color,
  size = 120,
}: {
  className?: string;
  style?: React.CSSProperties;
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path
        d="M60 10C60 10 90 30 95 60C100 90 75 110 60 110C45 110 20 90 25 60C30 30 60 10 60 10Z"
        fill={color}
        opacity="0.15"
      />
      <path
        d="M60 10C60 10 60 60 60 110"
        stroke={color}
        strokeWidth="1"
        opacity="0.25"
      />
      <path
        d="M60 40C60 40 45 50 40 65"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.2"
        fill="none"
      />
      <path
        d="M60 40C60 40 75 50 80 65"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.2"
        fill="none"
      />
      <path
        d="M60 65C60 65 42 72 38 85"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.2"
        fill="none"
      />
      <path
        d="M60 65C60 65 78 72 82 85"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.2"
        fill="none"
      />
    </svg>
  );
}

function PetalShape({
  className,
  style,
  color,
  width = 200,
  height = 300,
}: {
  className?: string;
  style?: React.CSSProperties;
  color: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 300"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path
        d="M100 0C130 40 180 100 175 170C170 240 130 280 100 300C70 280 30 240 25 170C20 100 70 40 100 0Z"
        fill={color}
        opacity="0.1"
      />
      <path
        d="M100 40C100 40 100 150 100 280"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.15"
      />
    </svg>
  );
}

function OrganicCurve({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 600 200"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
      preserveAspectRatio="none"
    >
      <path
        d="M0 100C100 20 200 180 300 80C400 -20 500 120 600 60"
        stroke="var(--green-botanical)"
        strokeWidth="1.5"
        opacity="0.15"
        fill="none"
      />
      <path
        d="M0 140C150 60 250 180 350 100C450 20 550 140 600 100"
        stroke="var(--coral)"
        strokeWidth="1"
        opacity="0.12"
        fill="none"
      />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          {...floatingLeaf}
          className="absolute -left-8 top-[8%]"
        >
          <BotanicalLeaf color="var(--green-botanical)" size={160} />
        </motion.div>

        <motion.div
          {...floatingLeafSlow}
          className="absolute right-[5%] top-[5%]"
        >
          <BotanicalLeaf
            color="var(--coral)"
            size={130}
            style={{ transform: "rotate(45deg)" }}
          />
        </motion.div>

        <motion.div
          {...floatingLeaf}
          className="absolute left-[8%] bottom-[15%]"
        >
          <BotanicalLeaf
            color="var(--amber)"
            size={100}
            style={{ transform: "rotate(-30deg)" }}
          />
        </motion.div>

        <motion.div
          {...floatingLeafSlow}
          className="absolute right-[10%] bottom-[10%]"
        >
          <BotanicalLeaf
            color="var(--green-botanical)"
            size={90}
            style={{ transform: "rotate(60deg)" }}
          />
        </motion.div>

        <PetalShape
          color="var(--coral-soft)"
          className="absolute -right-16 top-[15%] -z-10"
          width={240}
          height={360}
        />

        <PetalShape
          color="var(--amber-soft)"
          className="absolute -left-20 top-[25%] -z-10"
          width={200}
          height={300}
          style={{ transform: "rotate(25deg)" }}
        />

        <PetalShape
          color="var(--green-soft)"
          className="absolute left-[20%] -bottom-10 -z-10"
          width={300}
          height={200}
          style={{ transform: "rotate(-15deg)" }}
        />

        <OrganicCurve
          className="absolute left-0 top-[30%] w-[60%] h-auto"
        />

        <OrganicCurve
          className="absolute right-0 bottom-[20%] w-[50%] h-auto"
          style={{ transform: "scaleX(-1)" }}
        />

        <div
          className="absolute left-[30%] top-[10%] h-[300px] w-[300px] rounded-full blur-[120px]"
          style={{ backgroundColor: "var(--coral-soft)", opacity: 0.2 }}
        />
        <div
          className="absolute right-[20%] bottom-[20%] h-[250px] w-[250px] rounded-full blur-[100px]"
          style={{ backgroundColor: "var(--amber-soft)", opacity: 0.15 }}
        />
        <div
          className="absolute left-[10%] bottom-[30%] h-[200px] w-[200px] rounded-full blur-[100px]"
          style={{ backgroundColor: "var(--green-soft)", opacity: 0.15 }}
        />
      </div>

      <div className="relative px-6 pt-16 pb-4 lg:pt-24 lg:pb-6 max-w-6xl mx-auto text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-3xl mx-auto mb-10 lg:mb-14"
        >
          <motion.div variants={fadeUp} className="mb-5">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase"
              style={{
                backgroundColor: "var(--coral-soft)",
                color: "var(--coral)",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 32 32"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16 4C16 4 22 10 22 18C22 23 19 27 16 28C13 27 10 23 10 18C10 10 16 4 16 4Z" />
                <path d="M8 10C8 10 4 14 4 20C4 24 6 27 9 28C10 26 11 23 11 20C11 15 8 10 8 10Z" />
                <path d="M24 10C24 10 21 15 21 20C21 23 22 26 23 28C26 27 28 24 28 20C28 14 24 10 24 10Z" />
              </svg>
              Powered by AI
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.08] mb-6 text-foreground"
          >
            Generate social media content for every platform —{" "}
            <span
              className="relative inline-block"
              style={{ color: "var(--primary)" }}
            >
              at once
              <svg
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 8C30 2 70 2 100 6C130 10 170 4 198 8"
                  stroke="var(--coral)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-muted-foreground"
          >
            Write one prompt. Get platform-adapted posts for Twitter, LinkedIn,
            Instagram, and 5 more — each tuned to the right tone, length, and
            format.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-11 px-7 text-base font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
              style={{
                background: "var(--coral)",
                color: "white",
              }}
            >
              <Link href="/register">Start for free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 px-7 text-base font-medium rounded-xl transition-all duration-300 hover:scale-[1.03]"
            >
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="relative mx-auto"
          style={{ maxWidth: "1100px" }}
        >
          <div className="relative">
            <div
              className="absolute -inset-3 rounded-2xl blur-2xl opacity-30"
              style={{
                background: `linear-gradient(135deg, var(--primary), var(--coral-soft), var(--amber-soft))`,
              }}
              aria-hidden="true"
            />
            <div
              className="relative rounded-2xl overflow-hidden border shadow-2xl"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{
                  backgroundColor: "var(--muted)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "var(--coral)", opacity: 0.7 }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "var(--amber)", opacity: 0.7 }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "var(--green-botanical)", opacity: 0.7 }}
                  />
                </div>
                <div
                  className="flex-1 text-center text-xs font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  lotus.app/dashboard
                </div>
                <div className="w-16" />
              </div>
               <img
                src={"images/ai content generator dashboard.avif"}
                className="w-full aspect-[16/9] min-h-[300px] sm:min-h-[400px] lg:min-h-[520px]"
                width={1100}
                height={620}
              />
            </div>

            <motion.div
              {...floatingLeaf}
              className="absolute -right-6 -top-6 lg:-right-10 lg:-top-8 z-20"
            >
              <BotanicalLeaf color="var(--green-botanical)" size={80} />
            </motion.div>

            <motion.div
              {...floatingLeafSlow}
              className="absolute -left-4 -bottom-4 lg:-left-8 lg:-bottom-6 z-20"
            >
              <BotanicalLeaf
                color="var(--coral)"
                size={70}
                style={{ transform: "rotate(-45deg)" }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="relative w-full mt-[-1px]">
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: "60px" }}
          aria-hidden="true"
        >
          <path
            d="M0,40 C240,80 480,10 720,50 C960,90 1200,20 1440,45 L1440,100 L0,100 Z"
            fill="var(--background)"
          />
        </svg>
      </div>
    </section>
  );
}
