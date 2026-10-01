/**
 * Production Supabase Seed Engine: Pabulong Platform
 * Seeds realistic data into Supabase PostgreSQL:
 * - 5 Verified Boarding Houses with PostGIS Point coordinates
 * - 12 Room Inventory Units (Available, Occupied, Maintenance)
 * - 8 Candidate Placements across Kanban stages (Inquiry, Viewing, Deposit Pending, Placed)
 * - 10 Second Brain Notes with 1536-dimensional vector embedding arrays
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes("placeholder")) {
  console.error("❌ Error: Missing required Supabase production credentials.");
  console.error("   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const operatorUserId =
  process.env.SEED_OPERATOR_USER_ID ||
  process.env.CLERK_USER_ID ||
  "user_operator_default";

/**
 * Generate synthetic 1536-dimensional normalized vector embedding
 */
function generateSyntheticEmbedding(seed: number): number[] {
  const vector: number[] = [];
  let sumSq = 0;
  for (let i = 0; i < 1536; i++) {
    const val = Math.sin(seed * (i + 1)) * Math.cos((seed + i) * 0.5);
    vector.push(val);
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map((v) => Number((v / norm).toFixed(6)));
}

async function runSeed() {
  console.log("🚀 Starting Production Database Seed Sequence...");
  console.log(`👤 Using Operator User ID: ${operatorUserId}`);

  // 1. Seed 5 Verified Boarding Houses
  console.log("📍 Seeding 5 Verified Boarding Houses with PostGIS Coordinates...");
  const boardingHouses = [
    {
      id: "b0000000-0000-0000-0000-000000000001",
      owner_id: operatorUserId,
      name: "Greenfield Dormitory Block A",
      description: "Premier university residence with 24/7 security, high-speed fiber internet, and dedicated study pods.",
      address: "142 University Avenue, Academic District",
      location: "POINT(120.9842 14.5995)",
      amenities: ["Fiber Wi-Fi (300Mbps)", "Generator Backup", "Study Lounge", "CCTV Security", "Water Station"],
      rules: ["Curfew: 10:00 PM for Undergrads", "No Smoking", "Quiet Hours after 9:00 PM"],
      contact_email: "management@greenfieldresidences.com",
      contact_phone: "+1 (555) 019-2831",
    },
    {
      id: "b0000000-0000-0000-0000-000000000002",
      owner_id: operatorUserId,
      name: "University Heights Residences",
      description: "Modern student living located 250 meters from campus gate. Ensuite bathrooms and biometric access control.",
      address: "88 College Boulevard, Campus North",
      location: "POINT(120.9855 14.6012)",
      amenities: ["Biometric Entry", "Fiber Wi-Fi", "Balcony", "Laundry Facility", "Bike Racks"],
      rules: ["No Overnight Guests without Approval", "No Cooking inside Bedrooms"],
      contact_email: "inquiries@heightsresidences.edu",
      contact_phone: "+1 (555) 014-9922",
    },
    {
      id: "b0000000-0000-0000-0000-000000000003",
      owner_id: operatorUserId,
      name: "Pinecrest Student Suites",
      description: "Budget-friendly shared suites with full kitchen access and quiet study corridors.",
      address: "52 Elm Parkway, South Science Quad",
      location: "POINT(120.9820 14.5980)",
      amenities: ["Shared Kitchen", "Generator Backup", "Water Dispenser", "Rooftop Terrace"],
      rules: ["Kitchen clean-up mandatory after cooking", "Non-smoking building"],
      contact_email: "desk@pinecrestsuites.com",
      contact_phone: "+1 (555) 018-7711",
    },
    {
      id: "b0000000-0000-0000-0000-000000000004",
      owner_id: operatorUserId,
      name: "Vista Heights Boarding House",
      description: "Close-knit quad rooms with lockers and study carrels right outside the engineering laboratory.",
      address: "19 Innovation Drive, Technology Loop",
      location: "POINT(120.9810 14.6025)",
      amenities: ["Fiber Wi-Fi", "Keycard Entry", "Study Carrels", "Lockers"],
      rules: ["Quiet hours after 10:00 PM", "No open heating coils"],
      contact_email: "vista@dormhub.com",
      contact_phone: "+1 (555) 016-4433",
    },
    {
      id: "b0000000-0000-0000-0000-000000000005",
      owner_id: operatorUserId,
      name: "St. Jude Collegiate Haven",
      description: "Quiet female-only dormitory with garden courtyard, on-site resident advisor, and curfew monitoring.",
      address: "204 St. Jude Lane, Historic Campus Quarter",
      location: "POINT(120.9860 14.5975)",
      amenities: ["Female-Only", "Resident Advisor", "Garden Courtyard", "Filtered Water", "CCTV"],
      rules: ["Strict 9:30 PM Curfew", "Visitor Sign-in in Lobby Only"],
      contact_email: "haven@stjude-housing.org",
      contact_phone: "+1 (555) 013-8844",
    },
  ];

  const { error: bhError } = await supabase
    .from("boarding_houses")
    .upsert(boardingHouses, { onConflict: "id" });
  if (bhError) {
    console.error("❌ Boarding houses seed error:", bhError.message);
    throw bhError;
  }
  console.log("   ✓ 5 Boarding Houses upserted.");

  // 2. Seed 12 Room Inventory Units
  console.log("🛏️ Seeding 12 Room Inventory Units...");
  const rooms = [
    // Greenfield Dormitory
    {
      id: "c0000000-0000-0000-0000-000000000001",
      boarding_house_id: "b0000000-0000-0000-0000-000000000001",
      room_number: "Unit 204",
      capacity: 1,
      monthly_rent: 380.0,
      status: "available",
      gender_preference: "any",
      features: ["Ensuite Bath", "Fiber Wi-Fi", "Aircon", "Desk & Chair"],
    },
    {
      id: "c0000000-0000-0000-0000-000000000002",
      boarding_house_id: "b0000000-0000-0000-0000-000000000001",
      room_number: "Unit 205",
      capacity: 2,
      monthly_rent: 260.0,
      status: "occupied",
      gender_preference: "female",
      features: ["Twin Beds", "Shared Bath", "Individual Lockers"],
    },
    {
      id: "c0000000-0000-0000-0000-000000000003",
      boarding_house_id: "b0000000-0000-0000-0000-000000000001",
      room_number: "Unit 206",
      capacity: 1,
      monthly_rent: 410.0,
      status: "available",
      gender_preference: "any",
      features: ["Balcony View", "Ensuite Bath", "Desk Lamp"],
    },
    // University Heights
    {
      id: "c0000000-0000-0000-0000-000000000004",
      boarding_house_id: "b0000000-0000-0000-0000-000000000002",
      room_number: "Unit 312",
      capacity: 1,
      monthly_rent: 420.0,
      status: "available",
      gender_preference: "female",
      features: ["Study Pod", "Balcony", "24/7 CCTV", "Mini Fridge"],
    },
    {
      id: "c0000000-0000-0000-0000-000000000005",
      boarding_house_id: "b0000000-0000-0000-0000-000000000002",
      room_number: "Unit 314",
      capacity: 2,
      monthly_rent: 310.0,
      status: "maintenance",
      gender_preference: "any",
      features: ["Double Occupancy", "Ensuite Bath", "Desk Lamp"],
    },
    {
      id: "c0000000-0000-0000-0000-000000000006",
      boarding_house_id: "b0000000-0000-0000-0000-000000000002",
      room_number: "Unit 316",
      capacity: 1,
      monthly_rent: 440.0,
      status: "occupied",
      gender_preference: "female",
      features: ["Private Study Desk", "Ensuite Bath"],
    },
    // Pinecrest Student Suites
    {
      id: "c0000000-0000-0000-0000-000000000007",
      boarding_house_id: "b0000000-0000-0000-0000-000000000003",
      room_number: "Unit 108",
      capacity: 2,
      monthly_rent: 220.0,
      status: "available",
      gender_preference: "male",
      features: ["Shared Kitchen", "Generator Backup", "Water Dispenser"],
    },
    {
      id: "c0000000-0000-0000-0000-000000000008",
      boarding_house_id: "b0000000-0000-0000-0000-000000000003",
      room_number: "Unit 110",
      capacity: 2,
      monthly_rent: 230.0,
      status: "occupied",
      gender_preference: "male",
      features: ["Twin Beds", "Shared Refrigerator"],
    },
    // Vista Heights
    {
      id: "c0000000-0000-0000-0000-000000000009",
      boarding_house_id: "b0000000-0000-0000-0000-000000000004",
      room_number: "Unit 401",
      capacity: 4,
      monthly_rent: 180.0,
      status: "available",
      gender_preference: "any",
      features: ["Near Campus Gate", "Bunk Bed", "Lockers"],
    },
    {
      id: "c0000000-0000-0000-0000-000000000010",
      boarding_house_id: "b0000000-0000-0000-0000-000000000004",
      room_number: "Unit 403",
      capacity: 4,
      monthly_rent: 180.0,
      status: "occupied",
      gender_preference: "male",
      features: ["Bunk Bed", "Lockers", "Study Table"],
    },
    // St. Jude Collegiate Haven
    {
      id: "c0000000-0000-0000-0000-000000000011",
      boarding_house_id: "b0000000-0000-0000-0000-000000000005",
      room_number: "Unit 12",
      capacity: 1,
      monthly_rent: 340.0,
      status: "available",
      gender_preference: "female",
      features: ["Garden View", "Private Wardrobe", "Quiet Wing"],
    },
    {
      id: "c0000000-0000-0000-0000-000000000012",
      boarding_house_id: "b0000000-0000-0000-0000-000000000005",
      room_number: "Unit 14",
      capacity: 2,
      monthly_rent: 240.0,
      status: "available",
      gender_preference: "female",
      features: ["Courtyard Facing", "Shared Bath", "Bookshelf"],
    },
  ];

  const { error: roomError } = await supabase
    .from("rooms")
    .upsert(rooms, { onConflict: "id" });
  if (roomError) {
    console.error("❌ Rooms seed error:", roomError.message);
    throw roomError;
  }
  console.log("   ✓ 12 Room units upserted.");

  // 3. Seed 8 Candidate Placements across Kanban stages
  console.log("📋 Seeding 8 Candidate Placements across Kanban Stages...");
  const placements = [
    // Inquiry Stage
    {
      id: "d0000000-0000-0000-0000-000000000001",
      user_id: operatorUserId,
      client_name: "Elena Rostova",
      client_email: "elena.r@student.edu",
      client_phone: "+1 555-0192",
      budget_max: 450.0,
      preferred_location: "Near Engineering Quad (North Gate)",
      room_id: null,
      stage: "Inquiry",
      notes: "First year graduate student. Requests quiet environment for dissertation writing.",
    },
    {
      id: "d0000000-0000-0000-0000-000000000002",
      user_id: operatorUserId,
      client_name: "Lucas Vance",
      client_email: "lucas.vance@tech.edu",
      client_phone: "+1 555-0382",
      budget_max: 300.0,
      preferred_location: "Within 400m of Science Loop",
      room_id: null,
      stage: "Inquiry",
      notes: "Computer science undergrad. Needs reliable 200Mbps Wi-Fi and generator backup.",
    },
    // Viewing Stage
    {
      id: "d0000000-0000-0000-0000-000000000003",
      user_id: operatorUserId,
      client_name: "Marcus Vance",
      client_email: "m.vance@university.edu",
      client_phone: "+1 555-0842",
      budget_max: 400.0,
      preferred_location: "Within 500m of Main Campus",
      room_id: "c0000000-0000-0000-0000-000000000001",
      stage: "Viewing",
      notes: "Viewing scheduled Friday 2:00 PM for Unit 204.",
    },
    {
      id: "d0000000-0000-0000-0000-000000000004",
      user_id: operatorUserId,
      client_name: "Chloe Parker",
      client_email: "chloe.p@college.edu",
      client_phone: "+1 555-0491",
      budget_max: 360.0,
      preferred_location: "Academic District",
      room_id: "c0000000-0000-0000-0000-000000000011",
      stage: "Viewing",
      notes: "Prefers female-only residence. Viewing Saturday morning.",
    },
    // Deposit Pending Stage
    {
      id: "d0000000-0000-0000-0000-000000000005",
      user_id: operatorUserId,
      client_name: "Sophia Chen",
      client_email: "sophia.chen@med.edu",
      client_phone: "+1 555-0723",
      budget_max: 250.0,
      preferred_location: "Medical Sciences Wing",
      room_id: "c0000000-0000-0000-0000-000000000007",
      stage: "Deposit Pending",
      notes: "Deposit checkout session initiated via Stripe Escrow.",
    },
    {
      id: "d0000000-0000-0000-0000-000000000006",
      user_id: operatorUserId,
      client_name: "Liam O'Connor",
      client_email: "loconnor@law.edu",
      client_phone: "+1 555-0914",
      budget_max: 420.0,
      preferred_location: "Campus North",
      room_id: "c0000000-0000-0000-0000-000000000004",
      stage: "Deposit Pending",
      notes: "Security deposit escrow link dispatched to student email.",
    },
    // Placed Stage
    {
      id: "d0000000-0000-0000-0000-000000000007",
      user_id: operatorUserId,
      client_name: "David Kim",
      client_email: "dkim@college.edu",
      client_phone: "+1 555-0331",
      budget_max: 420.0,
      preferred_location: "University Heights Sector",
      room_id: "c0000000-0000-0000-0000-000000000006",
      stage: "Placed",
      notes: "Move-in completed. Keys and security card issued.",
    },
    {
      id: "d0000000-0000-0000-0000-000000000008",
      user_id: operatorUserId,
      client_name: "Hannah Abbott",
      client_email: "hannah.a@student.edu",
      client_phone: "+1 555-0229",
      budget_max: 280.0,
      preferred_location: "Historic Campus Quarter",
      room_id: "c0000000-0000-0000-0000-000000000002",
      stage: "Placed",
      notes: "Deposit verified, lease signed for Academic Year 2026-2027.",
    },
  ];

  const { error: plcError } = await supabase
    .from("placements")
    .upsert(placements, { onConflict: "id" });
  if (plcError) {
    console.error("❌ Placements seed error:", plcError.message);
    throw plcError;
  }
  console.log("   ✓ 8 Candidate Placements upserted.");

  // 4. Seed 10 Second Brain Notes with 1536-dim Vector Embeddings
  console.log("🧠 Seeding 10 Second Brain Notes with 1536-dim Vector Embeddings...");
  const notes = [
    {
      id: "e0000000-0000-0000-0000-000000000001",
      user_id: operatorUserId,
      title: "University Dorm Safety & Curfew Protocols",
      content: "All boarding houses within 1km of the campus gate must adhere to municipal curfew standards (10:00 PM for undergrads). Fire exits, CCTV on entrances, and biometric logging are recommended.",
      tags: ["security", "policy", "regulations"],
      embedding: generateSyntheticEmbedding(1),
    },
    {
      id: "e0000000-0000-0000-0000-000000000002",
      user_id: operatorUserId,
      title: "Greenfield Residences Amenity Audit",
      content: "Inspected Greenfield Residences Block B. High-speed fiber internet (300 Mbps), backup generator operational, private study pods on floor 2. Female-only wing on 3rd floor.",
      tags: ["housing", "audit", "amenities"],
      embedding: generateSyntheticEmbedding(2),
    },
    {
      id: "e0000000-0000-0000-0000-000000000003",
      user_id: operatorUserId,
      title: "Student Budget & Pricing Tier Matrix (2026)",
      content: "Standard studio single: $350 - $450/month. 2-person shared unit: $220 - $280/person. 4-person quad: $150 - $190/person. Utility deposits capped at 1 month advance.",
      tags: ["finance", "pricing", "students"],
      embedding: generateSyntheticEmbedding(3),
    },
    {
      id: "e0000000-0000-0000-0000-000000000004",
      user_id: operatorUserId,
      title: "Landlord Lease Contract Standard Terms",
      content: "Mandatory 6-month minimum lock-in. 30-day notice for pre-termination. Return of security deposit strictly within 14 calendar days post room inspection.",
      tags: ["contracts", "legal", "landlords"],
      embedding: generateSyntheticEmbedding(4),
    },
    {
      id: "e0000000-0000-0000-0000-000000000005",
      user_id: operatorUserId,
      title: "Geospatial Proximity & Campus Transit Routes",
      content: "Boarding houses on University Avenue and Elm Parkway have direct access to the campus electric shuttle loop. Walking distance under 350 meters with street lighting and security patrols.",
      tags: ["transit", "location", "commute"],
      embedding: generateSyntheticEmbedding(5),
    },
    {
      id: "e0000000-0000-0000-0000-000000000006",
      user_id: operatorUserId,
      title: "Power Backup & High-Speed Internet Standards",
      content: "Requirements for tech students and remote workers: Minimum 200 Mbps fiber connection with dual ISPs and a minimum 5kVA backup generator capable of running router and study pod air conditioning.",
      tags: ["utilities", "amenities", "wifi"],
      embedding: generateSyntheticEmbedding(6),
    },
    {
      id: "e0000000-0000-0000-0000-000000000007",
      user_id: operatorUserId,
      title: "Stripe Escrow Security Deposit Workflow",
      content: "Security deposits must be collected via Stripe Checkout before a student can transition from Deposit Pending to Placed. Webhook handler automatically updates database upon checkout completion.",
      tags: ["fintech", "stripe", "escrow"],
      embedding: generateSyntheticEmbedding(7),
    },
    {
      id: "e0000000-0000-0000-0000-000000000008",
      user_id: operatorUserId,
      title: "Female-Only Dormitory Guidelines & Compliance",
      content: "Dormitories designated female-only must feature restricted biometric access, visitor sign-in logs in lobby, and 24/7 CCTV surveillance on all perimeter entrance doors.",
      tags: ["compliance", "security", "female-housing"],
      embedding: generateSyntheticEmbedding(8),
    },
    {
      id: "e0000000-0000-0000-0000-000000000009",
      user_id: operatorUserId,
      title: "Mobile PWA Offline Caching & Sync Standards",
      content: "Next.js App Router service worker caches /dashboard/notes and /dashboard/properties. Stale-while-revalidate guarantees access when internet connectivity drops in campus dead zones.",
      tags: ["pwa", "mobile", "offline"],
      embedding: generateSyntheticEmbedding(9),
    },
    {
      id: "e0000000-0000-0000-0000-000000000010",
      user_id: operatorUserId,
      title: "PostGIS Spatial Radial Query Optimization",
      content: "Use ST_DWithin on GEOGRAPHY(Point, 4326) with GiST spatial indexing for sub-10ms distance lookups against campus reference coordinates.",
      tags: ["postgis", "database", "geospatial"],
      embedding: generateSyntheticEmbedding(10),
    },
  ];

  const { error: noteError } = await supabase
    .from("notes")
    .upsert(notes, { onConflict: "id" });
  if (noteError) {
    console.error("❌ Notes seed error:", noteError.message);
    throw noteError;
  }
  console.log("   ✓ 10 Second Brain Notes upserted.");

  console.log("✅ Production Database Seed Sequence Complete!");
}

runSeed().catch((err) => {
  console.error("Seed execution failed:", err);
  process.exit(1);
});
