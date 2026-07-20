/**
 * Integration tests: role-gated tables & has_role RLS evaluation.
 *
 * Regression coverage for the incident where `has_role` lost its
 * EXECUTE grant to anon/authenticated, causing every RLS-evaluated
 * query on role-gated tables to fail with "permission denied for
 * function has_role".
 *
 * These tests hit the live Lovable Cloud project as an anonymous
 * user. They assert that:
 *   1. Anonymous SELECTs on public-facing tables whose RLS calls
 *      `has_role(...)` succeed (no permission errors).
 *   2. Admin-only tables reject anonymous reads/writes silently via
 *      RLS (empty result, no function-level permission crash).
 *   3. Direct `rpc('has_role', ...)` from anon/authenticated is NOT
 *      exposed (whitelist policy), while the public rate-limited
 *      RPC `get_swap_by_trade_id_limited` IS callable.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Any error whose message mentions `has_role` or "permission denied for function"
// indicates the grant regression this suite guards against.
function assertNoHasRoleGrantFailure(error: { message: string; code?: string } | null) {
  if (!error) return;
  const msg = error.message.toLowerCase();
  expect(msg).not.toContain("permission denied for function");
  expect(msg).not.toContain("has_role");
}

describe("Role-gated RLS: anonymous user", () => {
  beforeAll(() => {
    expect(SUPABASE_URL).toBeTruthy();
    expect(SUPABASE_ANON_KEY).toBeTruthy();
  });

  it("blog_posts: anon can list published posts (RLS calls has_role for admins)", async () => {
    const { data, error } = await anon
      .from("blog_posts")
      .select("id, slug, status")
      .eq("status", "published")
      .limit(3);

    assertNoHasRoleGrantFailure(error);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    for (const row of data ?? []) {
      expect(row.status).toBe("published");
    }
  });

  it("prediction_markets: anon can list markets (RLS evaluates has_role branch)", async () => {
    const { data, error } = await anon
      .from("prediction_markets")
      .select("id, status")
      .limit(3);

    assertNoHasRoleGrantFailure(error);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("user_roles: anon read returns no rows and no function-grant error", async () => {
    const { data, error } = await anon.from("user_roles").select("user_id, role").limit(1);

    assertNoHasRoleGrantFailure(error);
    // Policy scoped to admins/owners — anon just gets [].
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("api_call_logs: anon INSERT is rejected by RLS, not by has_role grant", async () => {
    const { error } = await anon
      .from("api_call_logs")
      .insert({ endpoint: "/test", status_code: 200 } as never);

    // Must fail — but with an RLS violation, not a function-permission crash.
    expect(error).not.toBeNull();
    assertNoHasRoleGrantFailure(error);
    const code = error?.code ?? "";
    // 42501 = insufficient_privilege / RLS violation surface
    expect(["42501", "PGRST301", "PGRST116"]).toContain(code);
  });

  it("market_positions: anon INSERT with spoofed user_id is blocked by RLS", async () => {
    const { error } = await anon.from("market_positions").insert({
      market_id: "00000000-0000-0000-0000-000000000000",
      user_id: "00000000-0000-0000-0000-000000000000",
      amount: 1,
    } as never);

    expect(error).not.toBeNull();
    assertNoHasRoleGrantFailure(error);
  });
});

describe("SECURITY DEFINER RPC exposure", () => {
  it("has_role RPC does not leak admin status to anon callers", async () => {
    const { data, error } = await anon.rpc("has_role" as never, {
      _user_id: "00000000-0000-0000-0000-000000000000",
      _role: "admin",
    } as never);

    // Either PostgREST rejects the call (permission denied / not exposed)
    // or it returns false — but it must never return true for a random UUID.
    if (error) {
      expect(error.message.toLowerCase()).toMatch(
        /permission denied|not found|does not exist|schema cache/,
      );
    } else {
      expect(data).not.toBe(true);
    }
  });

  it("get_swap_by_trade_id_limited RPC IS callable by anon (whitelisted)", async () => {
    const { error } = await anon.rpc("get_swap_by_trade_id_limited", {
      p_trade_id: "__integration_test_missing__",
    });

    // Trade won't exist, but the call itself must be permitted.
    assertNoHasRoleGrantFailure(error);
    expect(error).toBeNull();
  });
});
