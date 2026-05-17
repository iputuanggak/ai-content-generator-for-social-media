"use client";

import Link from "next/link";
import { WaveDivider } from "@/components/wave-divider";

export function CtaSection() {
  return (
    <>
      <WaveDivider className="text-background" />
      <section
        data-testid="cta-section"
        className="relative bg-gradient-to-b from-primary/90 to-primary py-24 px-6 text-center overflow-hidden"
      >
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-20 text-primary-foreground"
          viewBox="0 0 500 500"
          aria-hidden="true"
        >
          <path
            d="M440,320Q430,390,370,430Q310,470,250,460Q190,450,140,410Q90,370,70,310Q50,250,60,180Q70,110,130,70Q190,30,250,40Q310,50,370,80Q430,110,445,180Q460,250,440,320Z"
            fill="currentColor"
          />
        </svg>

        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-tight text-primary-foreground mb-6">
            Ready to save hours on content creation?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-10">
            Create your team account and start generating in minutes.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-xl bg-primary-foreground px-8 py-4 text-base font-semibold text-primary hover:opacity-90 transition-opacity animate-pulse-soft"
          >
            Create an account
          </Link>
        </div>
      </section>
    </>
  );
}
