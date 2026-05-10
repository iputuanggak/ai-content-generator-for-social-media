import type { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { auth } from "@/lib/auth";

export type AuthedGetServerSidePropsContext = GetServerSidePropsContext & {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  authHeaders: Headers;
};

/**
 * Higher-order function for dashboard getServerSideProps.
 *
 * Handles:
 *  1. Bridging req.headers to WHATWG Headers
 *  2. Retrieving the Better Auth session
 *  3. Redirecting to /login when unauthenticated
 *
 * The inner handler receives the augmented context with session and authHeaders
 * so it can make further auth API calls without rebuilding the headers.
 */
export function requireAuthPage<P extends { [key: string]: unknown }>(
  handler: (ctx: AuthedGetServerSidePropsContext) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P> {
  return async (ctx) => {
    const authHeaders = new Headers();
    for (const [key, value] of Object.entries(ctx.req.headers)) {
      if (value) {
        authHeaders.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    }

    const session = await auth.api.getSession({ headers: authHeaders });
    if (!session) {
      return { redirect: { destination: "/login", permanent: false } };
    }

    return handler({ ...ctx, session, authHeaders });
  };
}
