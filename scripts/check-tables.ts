import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const content = fs.readFileSync(".env.local", "utf8");
const env: Record<string, string> = {};
for (const line of content.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

const url = env["NEXT_PUBLIC_SUPABASE_URL"];
const serviceKey = env["SUPABASE_SERVICE_ROLE_KEY"];
const anonKey =
  env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ||
  env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const adminSupabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonSupabase = anonKey
  ? createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

async function run() {
  console.log("=== Supabase Schema & RLS Verification ===");
  console.log("Project ref:", url.replace("https://", "").replace(".supabase.co", ""));

  const tables = ["notes", "boarding_houses", "rooms", "placements"];
  const missing: string[] = [];

  for (const table of tables) {
    const { data, error } = await adminSupabase.from(table).select("id").limit(1);
    if (error) {
      console.log(`❌ [${table}] MISSING: ${error.message}`);
      missing.push(table);
    } else {
      console.log(`✅ [${table}] EXISTS (${data.length} sample row)`);
    }
  }

  if (missing.length > 0) {
    console.log("\n⚠️  Action required: Apply supabase_schema.sql to your Supabase project.");
    console.log(`   SQL Editor URL: https://supabase.com/dashboard/project/${url.replace("https://", "").replace(".supabase.co", "")}/sql/new`);
    process.exit(2);
  }

  console.log("\n--- Checking Table Row Counts & Structure ---");
  for (const table of tables) {
    const { count, error } = await adminSupabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      console.log(`[${table}] count error: ${error.message}`);
    } else {
      console.log(`[${table}] total rows: ${count}`);
    }
  }

  // Verify RLS Isolation
  if (anonSupabase) {
    console.log("\n--- Verifying RLS Isolation with Anonymous Client ---");
    // Anon client should NOT be able to read notes without user token
    const { data: anonNotes, error: notesErr } = await anonSupabase.from("notes").select("id").limit(5);
    console.log(`[notes] Anon read result: ${anonNotes?.length ?? 0} rows visible (RLS isolated: ${anonNotes?.length === 0 ? "YES" : "NO"})`);

    // Anon client should NOT be able to read placements
    const { data: anonPlacements, error: plcErr } = await anonSupabase.from("placements").select("id").limit(5);
    console.log(`[placements] Anon read result: ${anonPlacements?.length ?? 0} rows visible (RLS isolated: ${anonPlacements?.length === 0 ? "YES" : "NO"})`);

    // Anon client CAN read boarding_houses (public policy)
    const { data: anonHouses, error: houseErr } = await anonSupabase.from("boarding_houses").select("id").limit(5);
    console.log(`[boarding_houses] Anon read result: ${anonHouses?.length ?? 0} rows visible (Public view policy: ${houseErr ? "ERROR" : "ACTIVE"})`);
  }

  console.log("\nSchema verification completed successfully.");
}

run().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
