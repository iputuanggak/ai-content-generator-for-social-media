import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateOtpCode, createOtp, validateOtp } from "../otp-service";

// ─── Test double factory ───────────────────────────────────────────────────────

type StoredOtp = {
  id: string;
  email: string;
  code: string;
  purpose: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
} | null;

function makeDbDouble(initialOtp: StoredOtp = null) {
  let stored: StoredOtp = initialOtp;

  return {
    _getStored: () => stored,
    query: {
      emailOtp: {
        findFirst: vi.fn(async () => stored),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(async (row: StoredOtp) => {
        stored = row;
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => {
        stored = null;
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => {}),
      })),
    })),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("generateOtpCode", () => {
  it("returns a 6-character string", () => {
    const code = generateOtpCode();
    expect(code).toHaveLength(6);
  });

  it("contains only digits", () => {
    const code = generateOtpCode();
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("zero-pads codes below 100000", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);
    const code = generateOtpCode();
    expect(code).toBe("000000");
    spy.mockRestore();
  });
});

describe("createOtp", () => {
  it("creates an OTP when none exists", async () => {
    const dbClient = makeDbDouble(null);
    (dbClient.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    let inserted: unknown = null;
    (dbClient.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      values: vi.fn(async (row: unknown) => { inserted = row; }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await createOtp("user@example.com", "email_verification", dbClient as any);
    expect("code" in result).toBe(true);
    if ("code" in result) {
      expect(result.code).toHaveLength(6);
    }
    expect(inserted).not.toBeNull();
  });

  it("returns cooldown error when an OTP was created less than 60s ago", async () => {
    const dbClient = makeDbDouble();
    const recent = new Date(Date.now() - 30_000); // 30s ago
    (dbClient.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "existing",
      email: "user@example.com",
      code: "123456",
      purpose: "email_verification",
      attempts: 0,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000),
      createdAt: recent,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await createOtp("user@example.com", "email_verification", dbClient as any);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("cooldown");
      expect(result.cooldownRemainingSeconds).toBeGreaterThan(0);
      expect(result.cooldownRemainingSeconds).toBeLessThanOrEqual(30);
    }
  });

  it("allows resend after 60s cooldown has passed", async () => {
    const dbClient = makeDbDouble();
    const old = new Date(Date.now() - 90_000); // 90s ago
    (dbClient.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "old-otp",
      email: "user@example.com",
      code: "111111",
      purpose: "email_verification",
      attempts: 0,
      expiresAt: new Date(Date.now() - 30_000),
      createdAt: old,
    });

    let deleted = false;
    (dbClient.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      where: vi.fn(async () => { deleted = true; }),
    });
    let inserted: unknown = null;
    (dbClient.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      values: vi.fn(async (row: unknown) => { inserted = row; }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await createOtp("user@example.com", "email_verification", dbClient as any);
    expect(deleted).toBe(true);
    expect("code" in result).toBe(true);
    expect(inserted).not.toBeNull();
  });
});

describe("validateOtp", () => {
  it("returns invalid when no OTP exists", async () => {
    const dbClient = makeDbDouble(null);
    (dbClient.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await validateOtp("user@example.com", "email_verification", "123456", dbClient as any);
    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid");
  });

  it("returns expired when OTP is past expiresAt", async () => {
    const dbClient = makeDbDouble();
    (dbClient.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "otp1",
      email: "user@example.com",
      code: "123456",
      purpose: "email_verification",
      attempts: 0,
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(Date.now() - 6 * 60 * 1000),
    });
    (dbClient.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({ where: vi.fn(async () => {}) });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await validateOtp("user@example.com", "email_verification", "123456", dbClient as any);
    expect(result.success).toBe(false);
    expect(result.error).toBe("expired");
  });

  it("returns success for correct code", async () => {
    const dbClient = makeDbDouble();
    (dbClient.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "otp2",
      email: "user@example.com",
      code: "654321",
      purpose: "email_verification",
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(),
    });
    (dbClient.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({ where: vi.fn(async () => {}) });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await validateOtp("user@example.com", "email_verification", "654321", dbClient as any);
    expect(result.success).toBe(true);
  });

  it("increments attempts on wrong code and reports remaining", async () => {
    const dbClient = makeDbDouble();
    (dbClient.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "otp3",
      email: "user@example.com",
      code: "000000",
      purpose: "email_verification",
      attempts: 2,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(),
    });
    (dbClient.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      set: vi.fn(() => ({ where: vi.fn(async () => {}) })),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await validateOtp("user@example.com", "email_verification", "999999", dbClient as any);
    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid");
    expect(result.attemptsRemaining).toBe(2); // 5 - (2+1) = 2
  });

  it("invalidates OTP after 5 failed attempts", async () => {
    const dbClient = makeDbDouble();
    (dbClient.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "otp4",
      email: "user@example.com",
      code: "000000",
      purpose: "email_verification",
      attempts: 4,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(),
    });
    let deleted = false;
    (dbClient.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      where: vi.fn(async () => { deleted = true; }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await validateOtp("user@example.com", "email_verification", "999999", dbClient as any);
    expect(result.success).toBe(false);
    expect(result.error).toBe("too_many_attempts");
    expect(result.attemptsRemaining).toBe(0);
    expect(deleted).toBe(true);
  });
});
