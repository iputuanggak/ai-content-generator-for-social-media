"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    heading: "Write your prompt",
    description:
      "Describe your topic and choose a tone. One input is all it takes.",
  },
  {
    number: 2,
    heading: "AI adapts to each platform",
    description:
      "Your message is reshaped for every platform's tone, length, and format conventions.",
  },
  {
    number: 3,
    heading: "Copy and schedule",
    description:
      "Review each output, make edits, and record your intended publish date.",
  },
];

const stepVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.3 + i * 0.2 },
  }),
};

const circleVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.3 + i * 0.2,
    },
  }),
};

const lineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.2, ease: "easeInOut", delay: 0.1 },
  },
};

export function HowItWorksStepper() {
  return (
    <section data-testid="how-it-works" className="py-20 px-6 max-w-5xl mx-auto">
      <motion.h2
        className="font-heading text-3xl text-center mb-14 tracking-tight text-foreground"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
      >
        How it works
      </motion.h2>

      <div className="relative">
        <motion.svg
          data-testid="connecting-line"
          className="absolute top-12 left-0 hidden lg:block w-full h-4 pointer-events-none"
          viewBox="0 0 1000 16"
          preserveAspectRatio="none"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.path
            d="M 80 8 C 300 8, 370 8, 500 8 C 630 8, 700 8, 920 8"
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 6"
            variants={lineVariants}
          />
        </motion.svg>

        <motion.div
          data-testid="steps-grid"
          className="relative grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              data-testid={`step-${step.number}`}
              className="flex flex-col items-center text-center"
              custom={i}
              variants={stepVariants}
            >
              <motion.span
                data-testid={`step-circle-${step.number}`}
                className="font-heading flex items-center justify-center w-14 h-14 rounded-full border-2 border-primary text-primary text-xl mb-5"
                custom={i}
                variants={circleVariants}
              >
                {step.number}
              </motion.span>

              <div className="w-16 h-16 mb-5 rounded-lg bg-accent/50 flex items-center justify-center">
                <svg
                  viewBox="0 0 40 40"
                  fill="none"
                  className="w-8 h-8 text-muted-foreground"
                  aria-hidden="true"
                >
                  {step.number === 1 && (
                    <path
                      d="M8 12h24M8 20h18M8 28h20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                  {step.number === 2 && (
                    <path
                      d="M20 6v28M6 20h28"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                  {step.number === 3 && (
                    <path
                      d="M10 20l6 6 14-14"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </div>

              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {step.heading}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
