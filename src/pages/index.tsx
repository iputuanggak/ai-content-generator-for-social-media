import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { HeroSection } from "@/components/hero-section";
import { PlatformBadges } from "@/components/platform-badges";
import { BentoFeatureGrid } from "@/components/bento-feature-grid";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <HeroSection />

      <PlatformBadges />

      <BentoFeatureGrid />

      {/* CTA */}
      <section className="bg-secondary py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4 tracking-tight text-secondary-foreground">
          Ready to save hours on content creation?
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">
          Create your team account and start generating in minutes.
        </p>
        <Link
          href="/register"
          className="inline-block rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Create an account
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm text-muted-foreground border-t border-border">
        <div className="flex justify-center gap-6">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="hover:text-foreground transition-colors">
            Register
          </Link>
        </div>
      </footer>
    </div>
  );
}
