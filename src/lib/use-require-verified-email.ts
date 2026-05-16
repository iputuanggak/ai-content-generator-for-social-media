import { useRouter } from "next/router";
import { authClient } from "@/lib/auth-client";

export function useRequireVerifiedEmail(): { loading: boolean } {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return { loading: true };
  }

  if (data?.user?.emailVerified === false) {
    router.push("/verify-email");
    return { loading: true };
  }

  return { loading: false };
}
