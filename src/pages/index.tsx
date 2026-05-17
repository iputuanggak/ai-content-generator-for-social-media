import { LandingNav } from "@/components/landing-nav";
import { HeroSection } from "@/components/hero-section";
import { PlatformBadges } from "@/components/platform-badges";
import { BentoFeatureGrid } from "@/components/bento-feature-grid";
import { HowItWorksStepper } from "@/components/how-it-works-stepper";
import { TestimonialCards } from "@/components/testimonial-cards";
import { CtaSection } from "@/components/cta-section";
import { MinimalFooter } from "@/components/minimal-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <HeroSection />

      <PlatformBadges />

      <BentoFeatureGrid />

      <HowItWorksStepper />

      <TestimonialCards />

      <CtaSection />

      <MinimalFooter />
    </div>
  );
}
