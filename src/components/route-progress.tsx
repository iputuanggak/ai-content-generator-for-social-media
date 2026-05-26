import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type State = "idle" | "loading" | "finishing";

export function RouteProgress() {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    const start = () => setState("loading");
    const done = () => setState("finishing");

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError", done);

    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError", done);
    };
  }, [router.events]);

  useEffect(() => {
    if (state !== "finishing") return;
    const id = setTimeout(() => setState("idle"), 400);
    return () => clearTimeout(id);
  }, [state]);

  if (state === "idle") return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[9999] h-[5px]"
    >
      <div
        className="h-full origin-left"
        style={{
          background: "var(--primary)",
          animation:
            state === "loading"
              ? "route-progress-advance 5s cubic-bezier(0.3, 0, 0.2, 1) forwards"
              : "route-progress-complete 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          opacity: state === "finishing" ? undefined : 1,
        }}
      />

      <style>{`
        @keyframes route-progress-advance {
          from { width: 0%; }
          to   { width: 82%; }
        }
        @keyframes route-progress-complete {
          from { width: 82%; opacity: 1; }
          to   { width: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
