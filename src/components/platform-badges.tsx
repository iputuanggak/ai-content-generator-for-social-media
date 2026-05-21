"use client";

import Image from "next/image";
import { motion } from "motion/react";

const platforms = [
  { name: "Twitter / X", src: "/images/twitter.svg" },
  { name: "LinkedIn", src: "/images/linkedin.svg" },
  { name: "Instagram", src: "/images/instagram.svg" },
  { name: "Facebook", src: "/images/facebook.svg" },
  { name: "TikTok", src: "/images/tiktok.svg" },
  { name: "YouTube", src: "/images/youtube.svg" },
  { name: "Threads", src: "/images/threads.svg" },
  { name: "Pinterest", src: "/images/pinterest.svg" },
];

export function PlatformBadges() {
  return (
    <section
      className="relative py-16 px-6 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--coral-soft) 0%, var(--amber-soft) 50%, var(--green-soft) 100%)",
      }}
    >
      <svg
        className="absolute -left-4 top-1/2 -translate-y-1/2 w-32 h-48 text-primary/10"
        viewBox="0 0 80 120"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M40 0C40 0 65 25 65 50C65 70 54 90 40 100C26 90 15 70 15 50C15 25 40 0 40 0Z"
          fill="currentColor"
        />
        <path
          d="M20 20C20 20 5 35 5 55C5 68 12 80 22 85C25 80 28 70 28 58C28 40 20 20 20 20Z"
          fill="currentColor"
        />
        <path
          d="M60 20C60 20 55 38 55 55C55 67 58 78 62 85C70 78 75 68 75 55C75 35 60 20 60 20Z"
          fill="currentColor"
        />
      </svg>

      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8">
          8 platforms supported
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {platforms.map((platform, i) => (
            <motion.span
              key={platform.name}
              data-testid="platform-badge"
              className="inline-flex items-center justify-center w-10 h-10"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.25,
              }}
            >
              <Image
                src={platform.src}
                alt={platform.name}
                width={40}
                height={40}
                className="rounded-[10px]"
              />
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
