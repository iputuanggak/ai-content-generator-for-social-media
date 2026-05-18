"use client";

import React, { forwardRef, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "./ui/animated-beam";

const Node = forwardRef<
  HTMLDivElement,
  {
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }
>(({ className, children, style }, ref) => {
  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "z-10 absolute flex items-center justify-center rounded-full border-2 border-border bg-background shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Node.displayName = "Node";

const platformIcons = {
  twitter: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  instagram: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  facebook: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  tiktok: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
  youtube: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  threads: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.442 1.783 3.649 2.698 6.554 2.717 2.623-.02 4.358-.635 5.879-2.098 1.647-1.584 1.618-3.935.958-5.318-.435-.902-1.234-1.571-2.265-1.924.167 1.143-.065 2.437-.708 3.453-.656 1.037-1.69 1.726-2.91 1.941-1.16.203-2.328-.043-3.187-.673-.887-.65-1.376-1.625-1.376-2.747 0-1.076.476-2.043 1.34-2.724.858-.677 1.965-.97 3.115-.828.744.092 1.403.338 1.963.72.133-.472.31-.912.528-1.314-.747-.458-1.628-.755-2.602-.834-1.562-.13-3.016.29-4.09 1.177-1.095.903-1.698 2.192-1.698 3.629 0 1.508.634 2.822 1.786 3.7 1.135.864 2.59 1.202 4.09.941 1.556-.272 2.878-1.154 3.626-2.403.712-1.186.899-2.657.517-4.038.72-.218 1.348-.553 1.863-1.004 1.15 1.415 1.529 3.63.693 5.748-.866 2.195-2.973 3.802-5.635 4.062-.487.047-.977.07-1.462.07z" />
    </svg>
  ),
  pinterest: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" />
    </svg>
  ),
};

const platformKeys = Object.keys(
  platformIcons,
) as (keyof typeof platformIcons)[];

export function HeroBeamIllustration() {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const half = Math.ceil(platformKeys.length / 2);
  const platformRightRef = useRef<(HTMLDivElement | null)[]>(
    Array(half).fill(null),
  );
  const platformLeftRef = useRef<(HTMLDivElement | null)[]>(
    Array(half).fill(null),
  );

  const radius = 130;

  return (
    <div
      className="relative flex items-center justify-center w-full aspect-[4/3] max-w-[320px] sm:max-w-[400px] lg:max-w-[480px]"
      ref={containerRef}
    >
      <Node
        ref={centerRef}
        className="size-14 sm:size-16 lg:size-20"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <HugeiconsIcon
          icon={SparklesIcon}
          size={24}
          className="sm:w-7 sm:h-7 lg:w-9 lg:h-9 text-primary"
        />
      </Node>

      {platformKeys.map((key, i) => {
        const angles = [-67.5, -22.5, 22.5, 67.5, 112.5, 157.5, 202.5, 247.5];
        const angle = angles[i];
        const rad = (angle * Math.PI) / 180;
        const x = 50 + (radius / 2.4) * Math.cos(rad);
        const y = 50 + (radius / 2.4) * Math.sin(rad);
        const IconComponent = platformIcons[key];

        return (
          <Node
            key={key}
            ref={(el) => {
              if (i < half) {
                platformRightRef.current[i] = el;
              } else {
                platformLeftRef.current[i - half] = el;
              }
            }}
            className="size-9 sm:size-10 lg:size-12 text-muted-foreground"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <IconComponent />
          </Node>
        );
      })}

      {platformKeys.slice(0, half).map((key, i) => {
        const curvature = i % 2 === 0 ? 20 : -20;
        const platformRef = {
          get current() {
            return platformRightRef.current[i];
          },
        } as React.RefObject<HTMLElement | null>;

        return (
          <React.Fragment key={`beam-right-${key}`}>
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={platformRef}
              toRef={centerRef}
              curvature={-curvature}
              startYOffset={5}
              endYOffset={5}
              pathWidth={1.5}
              gradientStartColor="oklch(0.48 0.13 178)"
              gradientStopColor="oklch(0.65 0.1 175)"
              duration={4}
              delay={0}
            />
          </React.Fragment>
        );
      })}

      {platformKeys.slice(half).map((key, i) => {
        const curvature = i % 2 === 0 ? 20 : -20;
        const platformRef = {
          get current() {
            return platformLeftRef.current[i];
          },
        } as React.RefObject<HTMLElement | null>;

        return (
          <React.Fragment key={`beam-left-${key}`}>
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={platformRef}
              toRef={centerRef}
              curvature={curvature}
              startYOffset={-5}
              endYOffset={-5}
              pathWidth={1.5}
              gradientStartColor="oklch(0.48 0.13 178)"
              gradientStopColor="oklch(0.65 0.1 175)"
              duration={4}
              delay={0}
              reverse
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
