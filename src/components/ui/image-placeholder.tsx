import { cn } from "@/lib/utils";

type ImagePlaceholderProps = {
  width: number;
  height: number;
  label: string;
  className?: string;
  bgColor?: string;
  icon?: React.ReactNode;
};

export function ImagePlaceholder({
  label,
  className,
  bgColor = "var(--muted)",
  icon,
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className,
      )}
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex flex-col items-center gap-2 text-center p-4">
        {icon ? (
          <div className="text-muted-foreground/40 [&_svg]:w-8 [&_svg]:h-8">
            {icon}
          </div>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-8 h-8 text-muted-foreground/40"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
            />
          </svg>
        )}
        <span className="text-xs font-medium text-muted-foreground/50">
          {label}
        </span>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)",
        }}
      />
    </div>
  );
}
