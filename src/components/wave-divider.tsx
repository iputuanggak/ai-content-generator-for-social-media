export function WaveDivider({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  return (
    <svg
      data-testid="wave-divider"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={`w-full block ${flip ? "scale-y-[-1]" : ""} ${className}`}
      style={{ height: "80px" }}
      aria-hidden="true"
    >
      <path
        d="M0,60 C180,110 360,20 540,70 C720,120 900,10 1080,60 C1260,110 1380,30 1440,50 L1440,120 L0,120 Z"
        fill="currentColor"
      />
    </svg>
  );
}
