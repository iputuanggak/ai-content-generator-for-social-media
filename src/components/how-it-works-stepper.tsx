"use client";

import { motion } from "motion/react";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

const steps = [
  {
    number: 1,
    heading: "Write your prompt",
    description:
      "Describe your topic and choose a tone. One input is all it takes.",
    accent: "var(--primary)",
    accentSoft: "var(--secondary)",
    label: "Product screenshot — prompt input",
  },
  {
    number: 2,
    heading: "AI adapts to each platform",
    description:
      "Your message is reshaped for every platform's tone, length, and format conventions.",
    accent: "var(--coral)",
    accentSoft: "var(--coral-soft)",
    label: "Product screenshot — AI generation",
  },
  {
    number: 3,
    heading: "Copy and schedule",
    description:
      "Review each output, make edits, and record your intended publish date.",
    accent: "var(--amber)",
    accentSoft: "var(--amber-soft)",
    label: "Product screenshot — output review",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.25 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
      delay: 0.15,
    },
  },
};

const vineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.4, ease: "easeInOut" as const, delay: 0.2 },
  },
};

function VineConnector({ color, flip }: { color: string; flip?: boolean }) {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 w-12 h-20 lg:h-24 pointer-events-none"
      style={flip ? { transform: "translateX(-50%) scaleX(-1)" } : undefined}
    >
      <svg
        viewBox="0 0 48 96"
        fill="none"
        className="w-full h-full"
        aria-hidden="true"
      >
        <motion.path
          d="M24 0 C24 20, 32 30, 28 48 C24 66, 20 76, 24 96"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="3 5"
          variants={vineVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        />
        <motion.path
          d="M28 20 C34 16, 38 18, 40 14"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          variants={vineVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        />
        <motion.path
          d="M26 52 C20 48, 16 50, 12 46"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          variants={vineVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        />
      </svg>
    </div>
  );
}

function BotanicalBgShape({
  color,
  className,
  style,
}: {
  color: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path
        d="M100 10 C130 30, 180 60, 170 110 C160 160, 120 180, 100 190 C80 180, 40 160, 30 110 C20 60, 70 30, 100 10Z"
        fill={color}
        opacity="0.06"
      />
    </svg>
  );
}

export function HowItWorksStepper() {
  return (
    <section
      data-testid="how-it-works"
      className="relative py-24 lg:py-32 px-6 overflow-hidden"
    >
      <BotanicalBgShape
        color="var(--primary)"
        className="absolute -top-20 -right-32 w-80 h-80 pointer-events-none"
      />
      <BotanicalBgShape
        color="var(--coral)"
        className="absolute top-1/3 -left-24 w-64 h-64 pointer-events-none"
      />
      <BotanicalBgShape
        color="var(--amber)"
        className="absolute bottom-10 right-10 w-72 h-72 pointer-events-none"
      />

      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="font-heading text-3xl sm:text-4xl text-center mb-4 tracking-tight text-foreground"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          How it works
        </motion.h2>
        <motion.p
          className="text-center text-muted-foreground text-lg mb-16 lg:mb-20 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Three steps from idea to publish-ready content.
        </motion.p>

        <motion.div
          data-testid="steps-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="relative flex flex-col items-center"
        >
          {steps.map((step, i) => {
            const isReversed = i % 2 === 1;

            return (
              <div key={step.number} className="contents">
                <motion.div
                  data-testid={`step-${step.number}`}
                  variants={rowVariants}
                  className="relative w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
                >
                  <motion.div
                    variants={badgeVariants}
                    className={`flex flex-col items-start gap-5 ${
                      isReversed ? "lg:order-2 lg:text-left" : "lg:text-left"
                    } text-center mx-auto lg:mx-0 max-w-md`}
                  >
                    <span
                      data-testid={`step-circle-${step.number}`}
                      className="flex items-center justify-center w-16 h-16 rounded-full text-lg font-heading font-bold shrink-0"
                      style={{
                        backgroundColor: step.accentSoft,
                        color: step.accent,
                      }}
                    >
                      0{step.number}
                    </span>

                    <div>
                      <h3
                        className="font-heading text-xl sm:text-2xl font-semibold mb-3 text-foreground"
                        style={{ color: step.accent }}
                      >
                        {step.heading}
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className={`rounded-2xl overflow-hidden shadow-lg ring-1 ring-border/50 ${
                      isReversed ? "lg:order-1" : ""
                    }`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                  >
                    <ImagePlaceholder
                      width={800}
                      height={500}
                      label={step.label}
                      bgColor={step.accentSoft}
                      className="w-full aspect-[16/10]"
                    />
                  </motion.div>
                </motion.div>

                {i < steps.length - 1 && (
                  <VineConnector
                    color={step.accent}
                    flip={isReversed}
                  />
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
