"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const faqs = [
  {
    question: "How does Lotus adapt content for different platforms?",
    answer:
      "Our AI analyzes each platform's best practices — character limits, hashtag conventions, tone expectations, and formatting — then reshapes your single prompt into platform-native posts. A LinkedIn post reads professional, while a tweet is punchy and concise.",
  },
  {
    question: "Can I customize the brand voice?",
    answer:
      "Yes. Set up your Brand Settings once — define your tone, voice characteristics, and default preferences. Every generation after that is automatically influenced by your brand profile.",
  },
  {
    question: "How many platforms are supported?",
    answer:
      "Lotus currently generates content for 8 platforms: Twitter/X, LinkedIn, Instagram, Facebook, TikTok, YouTube, Threads, and Pinterest. We're always evaluating new additions.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. You can start generating content for free with our starter plan. Upgrade anytime for unlimited generations, team collaboration, and advanced brand settings.",
  },
  {
    question: "Can my team collaborate on content?",
    answer:
      "Absolutely. Invite team members to your workspace. Everyone shares the same generation history, brand settings, and platform configurations — no more back-and-forth emails.",
  },
];

function BotanicalLeaf({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 200"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M60 0C60 0 100 40 100 90C100 130 80 170 60 200C40 170 20 130 20 90C20 40 60 0 60 0Z"
        fill="currentColor"
        opacity="0.06"
      />
      <path
        d="M60 20V180"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.08"
      />
      <path
        d="M60 60C45 55 30 45 25 35"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.06"
      />
      <path
        d="M60 90C45 85 30 75 25 65"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.06"
      />
      <path
        d="M60 120C45 115 30 105 25 95"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.06"
      />
      <path
        d="M60 60C75 55 90 45 95 35"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.06"
      />
      <path
        d="M60 90C75 85 90 75 95 65"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.06"
      />
      <path
        d="M60 120C75 115 90 105 95 95"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.06"
      />
    </svg>
  );
}

function BotanicalStem({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 40C30 40 50 35 80 30C110 25 140 30 170 35C185 37 195 38 200 40"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.07"
      />
      <circle cx="80" cy="30" r="3" fill="currentColor" opacity="0.05" />
      <circle cx="140" cy="32" r="2.5" fill="currentColor" opacity="0.05" />
      <path
        d="M75 30C72 22 68 18 65 14"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.05"
      />
      <path
        d="M85 28C88 20 92 16 95 12"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.05"
      />
      <path
        d="M135 32C132 24 128 20 125 16"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.05"
      />
      <path
        d="M145 30C148 22 152 18 155 14"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.05"
      />
    </svg>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      data-testid="faq-section"
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      id="faq"
    >
      <BotanicalLeaf className="pointer-events-none absolute -top-4 -left-8 w-32 h-52 text-[var(--green-botanical)] rotate-12" />
      <BotanicalLeaf className="pointer-events-none absolute -bottom-4 -right-8 w-28 h-44 text-[var(--green-botanical)] -rotate-15 scale-x-[-1]" />
      <BotanicalStem className="pointer-events-none absolute bottom-12 left-[10%] w-48 h-16 text-[var(--primary)]" />
      <BotanicalStem className="pointer-events-none absolute top-16 right-[8%] w-40 h-14 text-[var(--primary)] scale-x-[-1]" />

      <div className="mx-auto max-w-3xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 text-center"
        >
          <span
            className="inline-block mb-4 text-sm font-medium tracking-wide uppercase"
            style={{ color: "var(--coral)" }}
          >
            FAQ
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="divide-y divide-border rounded-2xl border border-border bg-card"
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={index} className="relative">
                {isOpen && (
                  <motion.div
                    layoutId="faq-accent"
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in srgb, var(--primary) 5%, transparent), color-mix(in srgb, var(--green-botanical) 3%, transparent))",
                    }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="relative z-10 flex w-full items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer transition-colors duration-200 sm:px-8 sm:py-6"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`text-base font-medium transition-colors duration-200 sm:text-lg ${
                      isOpen ? "text-foreground" : "text-foreground/80"
                    }`}
                    style={isOpen ? { color: "var(--primary)" } : undefined}
                  >
                    {faq.question}
                  </span>

                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border transition-colors duration-200"
                    style={
                      isOpen
                        ? {
                            backgroundColor: "var(--primary)",
                            borderColor: "var(--primary)",
                            color: "white",
                          }
                        : undefined
                    }
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <motion.line
                        x1="7"
                        y1="2"
                        x2="7"
                        y2="12"
                        animate={{ opacity: isOpen ? 0 : 1 }}
                        transition={{ duration: 0.2 }}
                      />
                      <line x1="2" y1="7" x2="12" y2="7" />
                    </svg>
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: {
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        },
                        opacity: { duration: 0.25, delay: 0.05 },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 sm:px-8 sm:pb-8">
                        <div
                          className="mb-4 h-px w-12 rounded-full"
                          style={{
                            backgroundColor: "var(--coral)",
                            opacity: 0.4,
                          }}
                        />
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
