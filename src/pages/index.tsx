import { LandingNav } from "@/components/landing-nav";
import { DummyBanner } from "@/components/dummy-banner";
import { HeroSection } from "@/components/hero-section";
import { PlatformBadges } from "@/components/platform-badges";
import { SocialProofBar } from "@/components/social-proof-bar";
import { StatsSection } from "@/components/stats-section";
import { BentoFeatureGrid } from "@/components/bento-feature-grid";
import { FeatureShowcase } from "@/components/feature-showcase";
import { HowItWorksStepper } from "@/components/how-it-works-stepper";
import { ComparisonSection } from "@/components/comparison-section";
import { TestimonialCards } from "@/components/testimonial-cards";
import { FaqSection } from "@/components/faq-section";
import { CtaSection } from "@/components/cta-section";
import { MinimalFooter } from "@/components/minimal-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DummyBanner />
      <LandingNav />
      <HeroSection />
      <PlatformBadges />
      <SocialProofBar />
      <StatsSection />
      <BentoFeatureGrid />
      <FeatureShowcase />
      <HowItWorksStepper />
      <ComparisonSection />
      <TestimonialCards />
      <FaqSection />
      <CtaSection />
      <MinimalFooter />
    </div>
  );
}
