import Link from "next/link";
import { WaveDivider } from "@/components/wave-divider";

export function MinimalFooter() {
  return (
    <>
      <WaveDivider className="text-primary -mb-px" />
      <footer className="bg-foreground py-10 px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
              className="text-primary-foreground"
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
            <span className="font-heading text-lg text-primary-foreground">Lotus</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/login" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              Register
            </Link>
          </div>

          <p className="text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} Lotus
          </p>
        </div>
      </footer>
    </>
  );
}
