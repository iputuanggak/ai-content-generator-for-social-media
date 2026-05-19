"use client";

import { motion } from "motion/react";
import Link from "next/link";

function LotusEmblem({ className }: { className?: string }) {
  const outerAngles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
  const middleAngles = [15, 66, 117, 168, 219, 270, 321];
  const innerAngles = [0, 72, 144, 216, 288];

  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <g opacity="1">
        {outerAngles.map((angle) => (
          <path
            key={`o${angle}`}
            d="M250,250 C225,168 224,98 250,68 C276,98 275,168 250,250Z"
            transform={`rotate(${angle} 250 250)`}
            fill="currentColor"
          />
        ))}
      </g>
      <g opacity="1">
        {middleAngles.map((angle) => (
          <path
            key={`m${angle}`}
            d="M250,250 C234,195 232,155 250,125 C268,155 266,195 250,250Z"
            transform={`rotate(${angle} 250 250)`}
            fill="currentColor"
          />
        ))}
      </g>
      <g opacity="1">
        {innerAngles.map((angle) => (
          <path
            key={`i${angle}`}
            d="M250,250 C240,215 239,195 250,175 C261,195 260,215 250,250Z"
            transform={`rotate(${angle} 250 250)`}
            fill="currentColor"
          />
        ))}
      </g>
      <circle cx="250" cy="250" r="10" fill="currentColor" />
      <circle cx="250" cy="250" r="4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function FloatingLeaf({
  className,
  delay,
  duration,
}: {
  className?: string;
  delay: number;
  duration: number;
}) {
  return (
    <motion.svg
      viewBox="0 0 30 50"
      className={className}
      aria-hidden="true"
      animate={{
        y: [0, -14, 0],
        rotate: [0, 10, -6, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      <path
        d="M15 2C15 2 26 14 26 28C26 36 21 44 15 48C9 44 4 36 4 28C4 14 15 2 15 2Z"
        fill="currentColor"
      />
      <path
        d="M15 8V44"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.3"
      />
    </motion.svg>
  );
}

function BotanicalLine({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 200 60"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d="M0,30 C30,30 50,25 80,22 C110,19 140,24 170,28 C185,30 195,32 200,34"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.06"
      />
      <path
        d="M75,22 C72,16 68,12 65,8"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.04"
      />
      <path
        d="M85,20 C88,14 92,10 95,6"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.04"
      />
      <path
        d="M135,25 C132,18 128,14 125,10"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.04"
      />
      <circle cx="80" cy="22" r="2" fill="currentColor" opacity="0.04" />
      <circle cx="140" cy="26" r="1.5" fill="currentColor" opacity="0.04" />
    </svg>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const emblemVariant = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function CtaSection() {
  return (
    <section className="relative overflow-hidden">
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="w-full block -mb-px"
        style={{ height: "70px" }}
        aria-hidden="true"
      >
        <path
          d="M0,55 C120,75 240,35 360,55 C480,75 600,30 720,50 C840,70 960,28 1080,48 C1200,68 1320,32 1440,52 L1440,80 L0,80 Z"
          fill="var(--background)"
        />
      </svg>

      <div
        className="relative py-28 sm:py-36 px-6"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.30 0.10 178) 0%, oklch(0.36 0.12 155) 50%, oklch(0.26 0.08 170) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute top-0 -left-32 h-[500px] w-[500px] rounded-full opacity-[0.18]"
          style={{
            backgroundColor: "oklch(0.55 0.14 155)",
            filter: "blur(120px)",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 -right-32 h-[450px] w-[450px] rounded-full opacity-[0.14]"
          style={{
            backgroundColor: "oklch(0.50 0.12 178)",
            filter: "blur(100px)",
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.10]"
          style={{
            backgroundColor: "oklch(0.65 0.15 160)",
            filter: "blur(120px)",
          }}
        />

        <motion.div
          variants={emblemVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 sm:h-[480px] sm:w-[480px] lg:h-[550px] lg:w-[550px]"
        >
          <LotusEmblem className="h-full w-full text-white/[0.06]" />
        </motion.div>

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <filter id="cta-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect
            width="100%"
            height="100%"
            filter="url(#cta-noise)"
            opacity="0.04"
          />
        </svg>

        <BotanicalLine
          className="pointer-events-none absolute left-[5%] top-[15%] w-40 h-12 text-white"
          style={{ opacity: 0.4 }}
        />
        <BotanicalLine
          className="pointer-events-none absolute bottom-[18%] right-[6%] w-36 h-10 text-white"
          style={{ opacity: 0.3, transform: "scaleX(-1)" }}
        />

        <FloatingLeaf
          className="absolute left-[10%] top-12 h-10 w-6 text-white/[0.07]"
          delay={0}
          duration={6}
        />
        <FloatingLeaf
          className="absolute right-[14%] top-20 h-8 w-5 text-white/[0.06]"
          delay={1.5}
          duration={7}
        />
        <FloatingLeaf
          className="absolute bottom-16 left-[18%] h-9 w-5 text-white/[0.06]"
          delay={3}
          duration={5.5}
        />
        <FloatingLeaf
          className="absolute bottom-24 right-[10%] h-7 w-4 text-white/[0.07]"
          delay={2}
          duration={6.5}
        />
        <FloatingLeaf
          className="absolute right-[8%] top-[35%] h-6 w-3 text-white/[0.05]"
          delay={4}
          duration={8}
        />
        <FloatingLeaf
          className="absolute left-[6%] bottom-[35%] h-7 w-4 text-white/[0.05]"
          delay={1}
          duration={7.5}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative z-10 mx-auto max-w-2xl text-center"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.1)",
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
              Start creating today
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="mb-6 font-heading text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            style={{ color: "var(--primary-foreground)" }}
          >
            Ready to transform your{" "}
            <span className="relative inline-block">
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--coral), var(--amber))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                content workflow
              </span>
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
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
            </span>
            ?
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mx-auto mb-3 max-w-lg text-base leading-relaxed sm:text-lg"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            One prompt. Every platform. Start generating platform-perfect
            content in minutes.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mb-10 text-sm"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Free to start &mdash; no credit card required
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.03]"
              style={{
                background:
                  "linear-gradient(135deg, var(--coral), var(--amber))",
              }}
            >
              <span
                className="absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "linear-gradient(135deg, var(--coral), var(--amber))",
                  filter: "blur(16px)",
                  opacity: 0.4,
                }}
              />
              <span className="relative">Create an account</span>
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-medium transition-all duration-300 hover:scale-[1.03]"
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              See how it works
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
