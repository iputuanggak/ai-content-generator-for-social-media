import {
  checkSufficientCredits,
  deductCredits,
  type CreditServiceDeps,
} from "./credit-service";

export interface CreditGuardResult<T> {
  status: "ok";
  data: T;
  creditCheck: { available: number; required: number };
  deduction: { amount: number; referenceId: string } | null;
}

export interface CreditGuardInsufficientResult {
  status: "insufficient";
  available: number;
  required: number;
}

export type CreditGuardResponse<T> =
  | CreditGuardResult<T>
  | CreditGuardInsufficientResult;

export type CreditGuardDeps = CreditServiceDeps;

export async function withCreditGuard<T>({
  organizationId,
  memberId,
  creditCost,
  creditType,
  execute,
  deps = {},
}: {
  organizationId: string;
  memberId: string;
  creditCost: number;
  creditType: "generation" | "regeneration";
  execute: () => Promise<{ referenceId: string; data: T }>;
  deps?: CreditGuardDeps;
}): Promise<CreditGuardResponse<T>> {
  const creditCheck = await checkSufficientCredits(
    organizationId,
    creditCost,
    deps
  );

  if (!creditCheck.sufficient) {
    return {
      status: "insufficient",
      available: creditCheck.available,
      required: creditCheck.required,
    };
  }

  const result = await execute();

  const deduction = { amount: creditCost, referenceId: result.referenceId };

  try {
    await deductCredits(
      organizationId,
      creditCost,
      creditType,
      result.referenceId,
      memberId,
      deps
    );
  } catch (err) {
    console.error(
      `Credit deduction failed for ${creditType} ${result.referenceId}`,
      err
    );
  }

  return {
    status: "ok",
    data: result.data,
    creditCheck: {
      available: creditCheck.available,
      required: creditCheck.required,
    },
    deduction,
  };
}
