import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Load environment variables from .env.local
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

if (!url || !serviceKey || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const adminSupabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonSupabase = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}: ${details}`);
}

async function verifyMarketplace() {
  console.log("==================================================");
  console.log("   PABULONG PHASE 2 MARKETPLACE DATA LAYER TESTS   ");
  console.log("==================================================");
  console.log(`Target Supabase URL: ${url}\n`);

  // 1. Verify all 9 Marketplace Tables Exist
  const tables = [
    "profiles",
    "boarding_houses",
    "rooms",
    "property_photos",
    "favorites",
    "inquiries",
    "conversations",
    "messages",
    "reports",
  ];

  for (const table of tables) {
    const { count, error } = await adminSupabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      record(`Table Existence: ${table}`, false, error.message);
    } else {
      record(`Table Existence: ${table}`, true, `${count ?? 0} rows found`);
    }
  }

  // 2. Test: Public Anonymous Query Only Sees 'published' Listings
  console.log("\n--- Testing Public Visibility Boundary ---");
  // Temporarily insert a draft listing with admin client
  const draftSlug = `test-draft-house-${Date.now()}`;
  const { data: draftHouse, error: draftErr } = await adminSupabase
    .from("boarding_houses")
    .insert({
      owner_id: "user_operator_default",
      name: "Hidden Draft Dormitory",
      slug: draftSlug,
      address: "Purok 9, Secret St",
      barangay: "Doongan",
      city: "Butuan City",
      province: "Agusan del Norte",
      status: "draft",
    })
    .select("id, status")
    .single();

  if (draftErr || !draftHouse) {
    record("Draft Creation for Visibility Test", false, draftErr?.message || "Failed to create draft");
  } else {
    // Query with anonymous client
    const { data: anonFoundDraft } = await anonSupabase
      .from("boarding_houses")
      .select("id, name, status")
      .eq("id", draftHouse.id);

    const isDraftHidden = !anonFoundDraft || anonFoundDraft.length === 0;
    record(
      "Public Query Hides Draft/Unpublished Listings",
      isDraftHidden,
      isDraftHidden
        ? "Draft listing is NOT visible to anon client (RLS enforced)"
        : "FAIL: Draft listing was visible to anonymous client"
    );

    // Query published listings with anonymous client
    const { data: anonPublished } = await anonSupabase
      .from("boarding_houses")
      .select("id, name, status")
      .eq("status", "published");

    const seesPublished = Boolean(anonPublished && anonPublished.length > 0);
    record(
      "Public Query Can Read Published Listings",
      seesPublished,
      `Anon client retrieved ${anonPublished?.length ?? 0} published listings`
    );

    // Clean up test draft
    await adminSupabase.from("boarding_houses").delete().eq("id", draftHouse.id);
  }

  // 3. Test Anonymous Isolation of Private Data (Favorites, Inquiries, Conversations, Messages, Reports)
  console.log("\n--- Testing Private Data RLS Isolation for Anonymous Users ---");

  const { data: anonFavs } = await anonSupabase.from("favorites").select("*");
  record(
    "Anonymous Cannot Read Favorites",
    (anonFavs?.length ?? 0) === 0,
    `Anon visible favorites: ${anonFavs?.length ?? 0}`
  );

  const { data: anonInquiries } = await anonSupabase.from("inquiries").select("*");
  record(
    "Anonymous Cannot Read Inquiries",
    (anonInquiries?.length ?? 0) === 0,
    `Anon visible inquiries: ${anonInquiries?.length ?? 0}`
  );

  const { data: anonConvs } = await anonSupabase.from("conversations").select("*");
  record(
    "Anonymous Cannot Read Conversations",
    (anonConvs?.length ?? 0) === 0,
    `Anon visible conversations: ${anonConvs?.length ?? 0}`
  );

  const { data: anonMsgs } = await anonSupabase.from("messages").select("*");
  record(
    "Anonymous Cannot Read Messages",
    (anonMsgs?.length ?? 0) === 0,
    `Anon visible messages: ${anonMsgs?.length ?? 0}`
  );

  const { data: anonReports } = await anonSupabase.from("reports").select("*");
  record(
    "Anonymous Cannot Read Reports",
    (anonReports?.length ?? 0) === 0,
    `Anon visible reports: ${anonReports?.length ?? 0}`
  );

  // 4. Test Constraints on Rooms (rent > 0, capacity >= 1, available_beds <= capacity)
  console.log("\n--- Testing Database Constraints ---");
  // Find a valid house ID
  const { data: sampleHouse } = await adminSupabase
    .from("boarding_houses")
    .select("id")
    .limit(1)
    .single();

  if (sampleHouse) {
    // Attempt inserting room with negative rent
    const { error: negRentErr } = await adminSupabase.from("rooms").insert({
      boarding_house_id: sampleHouse.id,
      room_number: "INV-1",
      room_type: "solo",
      capacity: 1,
      available_beds: 1,
      monthly_rent: -500, // violates CHECK (monthly_rent > 0)
    });
    record(
      "Room Constraint: Rent > 0",
      Boolean(negRentErr),
      negRentErr ? `Blocked invalid rent: ${negRentErr.message}` : "FAIL: negative rent was accepted"
    );

    // Attempt inserting room where available_beds > capacity
    const { error: bedExceedErr } = await adminSupabase.from("rooms").insert({
      boarding_house_id: sampleHouse.id,
      room_number: "INV-2",
      room_type: "solo",
      capacity: 2,
      available_beds: 5, // violates CHECK (available_beds <= capacity)
      monthly_rent: 2500,
    });
    record(
      "Room Constraint: Available Beds <= Capacity",
      Boolean(bedExceedErr),
      bedExceedErr ? `Blocked bed overflow: ${bedExceedErr.message}` : "FAIL: excess beds were accepted"
    );
  }

  // 5. Test PostGIS RPC: nearby_boarding_houses
  console.log("\n--- Testing PostGIS Geo RPC (nearby_boarding_houses) ---");
  // Butuan City Hall / FSUU coordinates: lat 8.9482, lng 125.5432
  const { data: nearbyListings, error: rpcErr } = await anonSupabase.rpc(
    "nearby_boarding_houses",
    {
      user_lat: 8.9482,
      user_lng: 125.5432,
      radius_meters: 15000,
    }
  );

  if (rpcErr) {
    record("PostGIS nearby_boarding_houses RPC", false, rpcErr.message);
  } else {
    const valid = Array.isArray(nearbyListings) && nearbyListings.length > 0;
    record(
      "PostGIS nearby_boarding_houses RPC",
      valid,
      valid
        ? `Found ${nearbyListings.length} nearby listings. Closest: "${nearbyListings[0].name}" at ${Math.round(nearbyListings[0].dist_meters)}m, Min rent: ₱${nearbyListings[0].min_rent}`
        : "No listings returned within 15km"
    );
  }

  // 6. Test Currency & Butuan Localization
  console.log("\n--- Testing Butuan Localization & Currency ---");
  const { data: seededRooms } = await adminSupabase
    .from("rooms")
    .select("room_number, monthly_rent, room_type")
    .limit(5);

  const allInPhpRange =
    seededRooms &&
    seededRooms.length > 0 &&
    seededRooms.every((r) => r.monthly_rent >= 1000 && r.monthly_rent <= 15000);

  record(
    "Currency Standard: Philippine Peso (₱ / PHP)",
    Boolean(allInPhpRange),
    `Sample rents: ${seededRooms?.map((r) => `₱${r.monthly_rent}`).join(", ")}`
  );

  // Summary
  console.log("\n==================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

verifyMarketplace().catch((err) => {
  console.error("Verification suite failed with unhandled error:", err);
  process.exit(1);
});
