"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className="text-primary"
          >
            <path
              d="M16 4C16 4 22 10 22 18C22 23 19 27 16 28C13 27 10 23 10 18C10 10 16 4 16 4Z"
              fill="currentColor"
            />
            <path
              d="M8 10C8 10 4 14 4 20C4 24 6 27 9 28C10 26 11 23 11 20C11 15 8 10 8 10Z"
              fill="currentColor"
            />
            <path
              d="M24 10C24 10 21 15 21 20C21 23 22 26 23 28C26 27 28 24 28 20C28 14 24 10 24 10Z"
              fill="currentColor"
            />
          </svg>
          <span className="font-heading text-xl text-foreground">Lotus</span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
