import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split(/\r?\n/)) {
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
    process.env[key] = val;
  }
}

async function verify() {
  console.log("=========================================");
  console.log("=== PABULONG FOUNDATION AUDIT SCRIPT ===");
  console.log("=========================================\n");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  console.log("1. Supabase Credentials Scope Check:");
  console.log(`- URL: ${url ? "Configured" : "MISSING"}`);
  console.log(`- Service Key: ${serviceKey ? "Configured (Server-only)" : "MISSING"}`);
  console.log(`- Public/Anon Key: ${anonKey ? "Configured (Client-safe)" : "MISSING"}`);

  const adminClient = createClient(url, serviceKey);
  const anonClient = createClient(url, anonKey);

  console.log("\n2. Core Database Tables & Data Verification:");
  const tables = ["notes", "boarding_houses", "rooms", "placements"];
  for (const t of tables) {
    const { count, error } = await adminClient.from(t).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`❌ Table [${t}]: ERROR ${error.message}`);
    } else {
      console.log(`✅ Table [${t}]: ${count} rows`);
    }
  }

  console.log("\n3. RLS Isolation Verification:");
  const { data: anonNotes, error: notesErr } = await anonClient.from("notes").select("id").limit(5);
  console.log(`- Anonymous Notes Access: ${anonNotes?.length ?? 0} rows (Isolated: ${anonNotes?.length === 0 ? "YES" : "NO"})`);

  const { data: anonPlacements, error: plcErr } = await anonClient.from("placements").select("id").limit(5);
  console.log(`- Anonymous Placements Access: ${anonPlacements?.length ?? 0} rows (Isolated: ${anonPlacements?.length === 0 ? "YES" : "NO"})`);

  const { data: anonHouses, error: houseErr } = await anonClient.from("boarding_houses").select("id").limit(5);
  console.log(`- Public Boarding Houses Access: ${anonHouses?.length ?? 0} rows (Public view: ${anonHouses && anonHouses.length > 0 ? "ACTIVE" : "INACTIVE"})`);

  console.log("\n4. PostGIS nearby_boarding_houses Function Verification:");
  const { data: nearby, error: rpcErr } = await adminClient.rpc("nearby_boarding_houses", {
    lng: 120.9842,
    lat: 14.5995,
    radius_meters: 5000,
  });
  if (rpcErr) {
    console.log(`❌ PostGIS RPC error: ${rpcErr.message}`);
  } else {
    console.log(`✅ PostGIS RPC: ${nearby?.length ?? 0} houses found within 5km radius.`);
  }

  console.log("\n5. Testing Action: fetchProperties():");
  const { fetchProperties } = await import("../src/actions/properties");
  const houses = await fetchProperties();
  console.log(`✅ fetchProperties() returned ${houses.length} properties.`);
  if (houses.length > 0) {
    console.log(`   Sample: "${houses[0].name}" with ${houses[0].rooms?.length ?? 0} rooms.`);
  }

  console.log("\nFoundation audit script finished.");
}

verify().catch((e) => {
  console.error("Fatal audit error:", e);
  process.exit(1);
});
