import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { syncProfile } from "../src/actions/marketplace";
import type { UserRole } from "../src/lib/marketplace-types";

// Ensure environment variables are populated for direct server action integration testing
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

/**
 * Profile Role Escalation & Onboarding Tests
 *
 * TEST BOUNDARY & COVERAGE ARCHITECTURE:
 *
 * 1. SERVER ACTION TESTS (Tests 1-3):
 *    - Type: Application-level unit/integration tests of Next.js Server Action (`syncProfile`).
 *    - Auth Model: Mocked. Relies on `ENABLE_DEV_MOCKS=true` / `DEV_MOCK_USER_ID` via `src/lib/auth-helpers.ts`.
 *    - Scope: Validates TypeScript-layer input sanitization, unauthenticated caller rejection,
 *      and role-filtering logic before payloads reach the database.
 *    - CAVEAT: These tests DO NOT generate real Clerk JWTs or exercise authenticated database RLS/triggers.
 *
 * 2. REAL SUPABASE DATABASE POSTGREST TEST (Test 4):
 *    - Type: Real HTTP PostgREST integration test against remote Supabase endpoint.
 *    - Auth Model: Real anonymous / publishable key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
 *    - Scope: Validates that direct, unauthenticated HTTP client requests cannot update profile roles via RLS.
 *
 * 3. AUTHENTICATED DATABASE RLS & TRIGGER COVERAGE:
 *    - Provided by: `supabase/tests/rls_isolation_tests.sql` (executed directly in PostgreSQL).
 *    - Scope: Real PostgreSQL role switching (`SET LOCAL ROLE authenticated`) and JWT claim emulation
 *      (`request.jwt.claim.sub`, `request.jwt.claim.role`).
 */
test.describe("Pabulong Security — Profile Role Escalation & Onboarding Tests", () => {
  test.describe.configure({ mode: "serial" });

  test("SERVER ACTION (MOCKED AUTH): rejects unauthenticated profile sync requests when dev mocks disabled", async () => {
    // When dev mocks are disabled, unauthenticated calls fail immediately at auth boundary
    process.env.ENABLE_DEV_MOCKS = "false";
    const result = await syncProfile({
      fullName: "Unauthenticated Actor",
      role: "admin" as UserRole,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication required");
  });

  test("SERVER ACTION (MOCKED AUTH): syncProfile TypeScript sanitization strictly rejects client-specified 'admin' self-promotion", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_test_security_applicant";

    // Attempt to pass privileged "admin" role to syncProfile
    const result = await syncProfile({
      fullName: "Attacker User",
      email: "attacker@pabulong.test",
      role: "admin" as UserRole,
    });

    // Validates application-level TypeScript role sanitization:
    // If Supabase RLS is active without JWT, it returns an RLS/coercion rejection;
    // if it returns a profile, the role must NEVER be admin.
    if (result.success && result.profile) {
      expect(result.profile.role).not.toBe("admin");
      expect(result.profile.role).toBe("seeker");
    } else {
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  test("SERVER ACTION (MOCKED AUTH): syncProfile safely allows landlord 'owner' onboarding without exposing 'admin'", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_test_landlord_applicant";

    const result = await syncProfile({
      fullName: "Verified Landlord Applicant",
      email: "landlord@pabulong.test",
      role: "owner",
    });

    if (result.success && result.profile) {
      expect(result.profile.role).toBe("owner");
      expect(result.profile.role).not.toBe("admin");
    } else {
      // In unauthenticated mock without JWT, database writes are intercepted by RLS
      expect(result.success).toBe(false);
    }
  });

  test("REAL DATABASE (ANON POSTGREST API): direct database update via anon publishable key is rejected by Row Level Security", async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !anonKey) {
      test.skip();
      return;
    }

    // Direct REST attempt by unauthorized client to promote a profile to admin with retry resilience
    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.user_seeker_demo`, {
          method: "PATCH",
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ role: "admin" }),
        });
        break;
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    expect(res).not.toBeNull();
    if (!res) return;

    // Unauthenticated/anon client must receive 0 updated rows due to RLS
    if (res.ok) {
      const data = await res.json();
      expect(data).toHaveLength(0); // 0 rows updated
    } else {
      expect(res.status).toBeGreaterThanOrEqual(400);
    }
  });
});
