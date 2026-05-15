import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateOtpCode, createOtp, validateOtp, resendOtp } from "../otp-service";

// ─── Mock the DB ──────────────────────────────────────────────────────────────

const mockEmailOtp: {
  id: string;
  email: string;
  code: string;
  purpose: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
} | null = null;

let _storedOtp: typeof mockEmailOtp = null;

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      emailOtp: {
        findFirst: vi.fn(async () => _storedOtp),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(async (row) => {
        _storedOtp = row;
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => {
        _storedOtp = null;
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => {
          // no-op; individual tests mock this themselves
        }),
      })),
    })),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  emailOtp: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
}));

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
    // Override Math.random to return a value that gives code 0
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);
    const code = generateOtpCode();
    expect(code).toBe("000000");
    spy.mockRestore();
  });
});

describe("createOtp", () => {
  beforeEach(() => {
    _storedOtp = null;
  });

  it("creates an OTP when none exists", async () => {
    const { db } = await import("@/lib/db");
    (db.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    let inserted: unknown = null;
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      values: vi.fn(async (row) => {
        inserted = row;
      }),
    });

    const result = await createOtp("user@example.com", "email_verification");
    expect("code" in result).toBe(true);
    if ("code" in result) {
      expect(result.code).toHaveLength(6);
    }
    expect(inserted).not.toBeNull();
  });

  it("returns cooldown error when an OTP was created less than 60s ago", async () => {
    const { db } = await import("@/lib/db");
    const recent = new Date(Date.now() - 30_000); // 30s ago
    (db.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "existing",
      email: "user@example.com",
      code: "123456",
      purpose: "email_verification",
      attempts: 0,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000),
      createdAt: recent,
    });

    const result = await createOtp("user@example.com", "email_verification");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("cooldown");
      expect(result.cooldownRemainingSeconds).toBeGreaterThan(0);
      expect(result.cooldownRemainingSeconds).toBeLessThanOrEqual(30);
    }
  });

  it("allows resend after 60s cooldown has passed", async () => {
    const { db } = await import("@/lib/db");
    const old = new Date(Date.now() - 90_000); // 90s ago
    (db.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "old-otp",
      email: "user@example.com",
      code: "111111",
      purpose: "email_verification",
      attempts: 0,
      expiresAt: new Date(Date.now() - 30_000), // expired
      createdAt: old,
    });

    let deleted = false;
    (db.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      where: vi.fn(async () => { deleted = true; }),
    });
    let inserted: unknown = null;
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      values: vi.fn(async (row) => { inserted = row; }),
    });

    const result = await createOtp("user@example.com", "email_verification");
    expect(deleted).toBe(true);
    expect("code" in result).toBe(true);
    expect(inserted).not.toBeNull();
  });
});

describe("validateOtp", () => {
  beforeEach(() => {
    _storedOtp = null;
  });

  it("returns invalid when no OTP exists", async () => {
    const { db } = await import("@/lib/db");
    (db.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const result = await validateOtp("user@example.com", "email_verification", "123456");
    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid");
  });

  it("returns expired when OTP is past expiresAt", async () => {
    const { db } = await import("@/lib/db");
    (db.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "otp1",
      email: "user@example.com",
      code: "123456",
      purpose: "email_verification",
      attempts: 0,
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(Date.now() - 6 * 60 * 1000),
    });
    (db.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({ where: vi.fn(async () => {}) });

    const result = await validateOtp("user@example.com", "email_verification", "123456");
    expect(result.success).toBe(false);
    expect(result.error).toBe("expired");
  });

  it("returns success for correct code", async () => {
    const { db } = await import("@/lib/db");
    (db.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "otp2",
      email: "user@example.com",
      code: "654321",
      purpose: "email_verification",
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(),
    });
    (db.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({ where: vi.fn(async () => {}) });

    const result = await validateOtp("user@example.com", "email_verification", "654321");
    expect(result.success).toBe(true);
  });

  it("increments attempts on wrong code and reports remaining", async () => {
    const { db } = await import("@/lib/db");
    (db.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "otp3",
      email: "user@example.com",
      code: "000000",
      purpose: "email_verification",
      attempts: 2,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(),
    });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      set: vi.fn(() => ({ where: vi.fn(async () => {}) })),
    });

    const result = await validateOtp("user@example.com", "email_verification", "999999");
    expect(result.success).toBe(false);
    expect(result.error).toBe("invalid");
    expect(result.attemptsRemaining).toBe(2); // 5 - (2+1) = 2
  });

  it("invalidates OTP after 5 failed attempts", async () => {
    const { db } = await import("@/lib/db");
    (db.query.emailOtp.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "otp4",
      email: "user@example.com",
      code: "000000",
      purpose: "email_verification",
      attempts: 4, // next wrong attempt = 5th
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(),
    });
    let deleted = false;
    (db.delete as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      where: vi.fn(async () => { deleted = true; }),
    });

    const result = await validateOtp("user@example.com", "email_verification", "999999");
    expect(result.success).toBe(false);
    expect(result.error).toBe("too_many_attempts");
    expect(result.attemptsRemaining).toBe(0);
    expect(deleted).toBe(true);
  });
});
