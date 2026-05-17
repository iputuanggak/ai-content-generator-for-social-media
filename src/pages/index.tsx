import Link from "next/link";

const features = [
  {
    title: "Multi-Platform Generation",
    description:
      "Generate adapted content for all 8 social media platforms simultaneously from a single prompt. Each output is tailored to that platform's tone, format, and character limits.",
  },
  {
    title: "Brand Settings",
    description:
      "Configure your team's brand voice, default tone, and active platforms. Every generation is automatically influenced by your brand settings for consistent output.",
  },
  {
    title: "Team Collaboration",
    description:
      "Invite team members to a shared workspace. Your whole team shares the same generation history, brand settings, and platform configurations.",
  },
  {
    title: "Generation History",
    description:
      "Every generation is saved with its inputs, intended publish date, and all platform outputs — including any edits made after generation.",
  },
];

const platforms = [
  "Twitter / X",
  "LinkedIn",
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Threads",
  "Pinterest",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border max-w-6xl mx-auto">
        <span className="text-lg font-semibold tracking-tight text-foreground">Lotus</span>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6 text-foreground">
          Generate social media content for every platform — at once
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Write one prompt. Get platform-adapted posts for Twitter, LinkedIn, Instagram, and 5 more — each tuned to the right tone, length, and format.
        </p>
        <Link
          href="/register"
          className="inline-block rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Start for free
        </Link>
      </section>

      {/* Platforms */}
      <section className="bg-muted py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8">
            8 platforms supported
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {platforms.map((platform) => (
              <span
                key={platform}
                className="rounded-full border border-border bg-accent px-5 py-2 text-sm font-medium text-accent-foreground shadow-sm"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-14 tracking-tight text-foreground">
          Everything your marketing team needs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-7"
            >
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

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
