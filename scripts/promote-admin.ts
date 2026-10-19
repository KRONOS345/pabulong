/**
 * Pabulong — Trusted Server-Side Administrator Provisioning Engine
 *
 * SECURE ADMIN PROVISIONING:
 * Uses Supabase Service Role credentials to grant or revoke administrative
 * privileges on user profiles. This operation runs exclusively in trusted
 * server/CLI environments and is NEVER exposed to client browsers.
 *
 * Usage:
 *   npx tsx scripts/promote-admin.ts <clerk_user_id_or_email>
 *   npx tsx scripts/promote-admin.ts <clerk_user_id_or_email> --demote [seeker|owner]
 */

if (typeof window !== "undefined") {
  throw new Error("SECURITY VIOLATION: scripts/promote-admin.ts cannot be executed or bundled in a browser environment.");
}

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Load environment variables from .env.local if not already in process.env
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

async function main() {
  const args = process.argv.slice(2);
  const rawIdentifier = args[0];
  const cleanId = rawIdentifier ? rawIdentifier.trim() : "";

  if (!cleanId || cleanId === "--help" || cleanId === "-h") {
    console.log("=================================================================");
    console.log("Pabulong — Trusted Administrator Provisioning Utility");
    console.log("=================================================================");
    console.log("Usage:");
    console.log("  npx tsx scripts/promote-admin.ts <user_id_or_email>");
    console.log("  npx tsx scripts/promote-admin.ts <user_id_or_email> --demote [seeker|owner]");
    console.log("");
    console.log("Examples:");
    console.log("  npx tsx scripts/promote-admin.ts user_2abc123xyz");
    console.log("  npx tsx scripts/promote-admin.ts admin@pabulong.app");
    console.log("  npx tsx scripts/promote-admin.ts user_2abc123xyz --demote seeker");
    process.exit(0);
  }

  // Enforce unambiguous identifier format
  const isUserId = cleanId.startsWith("user_") && cleanId.length > 5;
  const isEmail = cleanId.includes("@") && cleanId.includes(".") && !cleanId.includes(" ");

  if (!isUserId && !isEmail) {
    console.error("❌ Error: Ambiguous or invalid target identifier.");
    console.error(`   Received: "${cleanId}"`);
    console.error("   Target identity must be an explicit Clerk User ID ('user_...') or a valid email address ('user@domain.com').");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("placeholder")) {
    console.error("❌ Error: Missing required Supabase admin credentials (SUPABASE_SERVICE_ROLE_KEY).");
    console.error("   Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const isDemote = args.includes("--demote");
  const targetRole = isDemote ? (args[args.indexOf("--demote") + 1] === "owner" ? "owner" : "seeker") : "admin";

  const normalizedEmail = isEmail ? cleanId.toLowerCase() : "";
  console.log(`🔍 Locating profile for identifier: ${isUserId ? cleanId : normalizedEmail}...`);

  // Query by Clerk user ID or exact normalized email
  let query = supabase.from("profiles").select("id, email, full_name, role, is_verified");
  if (isUserId) {
    query = query.eq("id", cleanId);
  } else {
    query = query.eq("email", normalizedEmail);
  }

  const { data: profile, error: findErr } = await query.maybeSingle();

  if (findErr) {
    if (findErr.code === "PGRST116" || findErr.message?.includes("0 or more than 1") || findErr.message?.includes("multiple")) {
      console.error(`❌ AMBIGUITY ERROR: Multiple profiles found matching email "${normalizedEmail}".`);
      console.error("   To prevent accidental promotion of the wrong account, specify the exact Clerk User ID ('user_...').");
    } else {
      console.error("❌ Database query error:", findErr.message);
    }
    process.exit(1);
  }

  if (!profile) {
    console.error(`❌ Profile not found for target identifier: "${cleanId}"`);
    console.error("   Ensure the user has completed initial sign-in and profile creation.");
    process.exit(1);
  }

  // Exact target identity verification before role alteration
  if (isUserId && profile.id !== cleanId) {
    console.error(`❌ Target Identity Mismatch: Resolved profile ID "${profile.id}" does not match target "${cleanId}".`);
    process.exit(1);
  }
  if (!isUserId && profile.email.toLowerCase() !== normalizedEmail) {
    console.error(`❌ Target Identity Mismatch: Resolved profile email "${profile.email}" does not match normalized target "${normalizedEmail}".`);
    process.exit(1);
  }

  console.log(`Current Profile: ID=${profile.id} | Email=${profile.email} | Name=${profile.full_name} | Role=${profile.role}`);

  if (profile.role === targetRole) {
    console.log(`ℹ️ User is already in the '${targetRole}' role. No update needed.`);
    process.exit(0);
  }

  // Authoritatively update role via service role client
  const { data: updated, error: updErr } = await supabase
    .from("profiles")
    .update({
      role: targetRole,
      is_verified: targetRole === "admin" ? true : profile.is_verified,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select("id, email, full_name, role, is_verified, updated_at")
    .single();

  if (updErr || !updated) {
    console.error("❌ Failed to update role:", updErr?.message);
    process.exit(1);
  }

  console.log("=================================================================");
  console.log(`✅ SUCCESS: Role updated to '${updated.role}' for user ${updated.id} (${updated.email})`);
  console.log("=================================================================");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
