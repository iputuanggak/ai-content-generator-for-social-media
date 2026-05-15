# ADR 0001: Custom OTP flow over Better Auth built-in email verification

**Status:** Accepted

**Date:** 2026-05-15

## Context

We need email verification after registration to prevent spam accounts. Better Auth (our auth library) has a built-in `emailVerification` plugin, but it only supports magic-link verification (user clicks a link in the email). Our UX requirement is OTP-based verification (user enters a 6-digit code).

Additionally, we need to:
- Block disposable/temporary email addresses
- Reuse the OTP mechanism for future purposes (password reset, 2FA, action confirmation)
- Auto-send a fresh OTP when an unverified user attempts to log in

## Decision

Build a custom OTP flow rather than using Better Auth's built-in email verification.

The custom flow consists of:
- A generic `OtpService` that generates, stores, validates, and invalidates OTPs for any purpose
- A new `emailOtp` database table (separate from Better Auth's `verification` table)
- A `purpose` enum on each OTP row to distinguish use cases
- Resend + React Email for sending styled OTP emails
- A static disposable email domain blocklist checked on both client and server

## Consequences

**Positive:**
- Full control over the verification UX (OTP code input vs magic link)
- Reusable OTP service for password reset, 2FA, and other confirmation flows
- No coupling to Better Auth's verification internals
- Disposable email blocking is independent of the auth library

**Negative:**
- More code to maintain vs using the built-in plugin
- Must handle OTP lifecycle (generation, expiry, attempt counting, invalidation) ourselves
- Separate from Better Auth's `verification` table means two verification concepts in the DB
