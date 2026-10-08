"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";
import type {
  BoardingHouse,
  Room,
  Inquiry,
  Conversation,
  Message,
  Favorite,
  MarketplaceSearchParams,
  InquiryStatus,
  GenderRestriction,
  RoomType,
  RoomStatus,
  UserRole,
  Profile,
  OwnerMetrics,
} from "@/lib/marketplace-types";

// ========================================================================
// 1. PUBLIC LISTING DISCOVERY & SEARCH
// ========================================================================

/**
 * Public search for published boarding houses in Butuan City.
 * Enforces RLS and published visibility boundary.
 */
export async function searchListings(
  params?: MarketplaceSearchParams
): Promise<BoardingHouse[]> {
  const supabase = await createClient();

  // If spatial search requested with coordinates and radius, use PostGIS RPC
  if (params?.campus_lat && params?.campus_lng) {
    const { data: spatialData, error: spatialError } = await supabase.rpc(
      "nearby_boarding_houses",
      {
        user_lng: params.campus_lng,
        user_lat: params.campus_lat,
        radius_meters: params.radius_meters || 25000,
      }
    );

    if (spatialError) {
      console.error("[searchListings] PostGIS RPC error:", spatialError.message);
    } else if (spatialData && spatialData.length > 0) {
      const houseIds = spatialData.map((h: { id: string }) => h.id);
      let query = supabase
        .from("boarding_houses")
        .select("*, rooms(*)")
        .in("id", houseIds)
        .eq("status", "published");

      if (params.barangay && params.barangay !== "all") {
        query = query.eq("barangay", params.barangay);
      }
      if (params.gender_restriction && params.gender_restriction !== "all") {
        query = query.eq("gender_restriction", params.gender_restriction);
      }
      if (params.query && params.query.trim()) {
        const q = `%${params.query.trim()}%`;
        query = query.or(`name.ilike.${q},description.ilike.${q},address.ilike.${q}`);
      }

      const { data, error } = await query;
      if (!error && data) {
        let results = (data as BoardingHouse[]).map((item) => {
          const match = spatialData.find((s: { id: string; dist_meters?: number }) => s.id === item.id);
          return {
            ...item,
            distance_meters: match ? match.dist_meters : undefined,
          };
        });

        if (params.room_type && params.room_type !== "all") {
          results = results.filter((h) =>
            h.rooms?.some((r) => r.room_type === params.room_type && r.is_available)
          );
        }
        if (params.max_rent) {
          results = results.filter((h) =>
            h.rooms?.some((r) => r.monthly_rent <= params.max_rent! && r.is_available)
          );
        }
        if (params.min_rent) {
          results = results.filter((h) =>
            h.rooms?.some((r) => r.monthly_rent >= params.min_rent! && r.is_available)
          );
        }

        return results.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
      }
    }
  }

  // Standard structured query
  let query = supabase
    .from("boarding_houses")
    .select("*, rooms(*)")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (params?.barangay && params.barangay !== "all") {
    query = query.eq("barangay", params.barangay);
  }
  if (params?.gender_restriction && params.gender_restriction !== "all") {
    query = query.eq("gender_restriction", params.gender_restriction);
  }
  if (params?.query && params.query.trim()) {
    const q = `%${params.query.trim()}%`;
    query = query.or(`name.ilike.${q},description.ilike.${q},address.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[searchListings] Query error:", error.message);
    return [];
  }

  let results = (data || []) as BoardingHouse[];

  // In-memory filter for room-level criteria if requested
  if (params?.room_type && params.room_type !== "all") {
    results = results.filter((h) =>
      h.rooms?.some((r) => r.room_type === params.room_type && r.is_available)
    );
  }
  if (params?.max_rent) {
    results = results.filter((h) =>
      h.rooms?.some((r) => r.monthly_rent <= params.max_rent! && r.is_available)
    );
  }
  if (params?.min_rent) {
    results = results.filter((h) =>
      h.rooms?.some((r) => r.monthly_rent >= params.min_rent! && r.is_available)
    );
  }

  return results.map((h) => {
    if (h.rooms && h.rooms.length > 0) {
      const rents = h.rooms.map((r) => r.monthly_rent);
      h.min_rent = Math.min(...rents);
    }
    return h;
  });
}

/**
 * Fetch a single published boarding house by ID or slug with its rooms and photos.
 */
export async function getListingById(idOrSlug: string): Promise<BoardingHouse | null> {
  const supabase = await createClient();

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  let query = supabase
    .from("boarding_houses")
    .select("*, rooms(*), property_photos(*)")
    .limit(1);

  if (isUuid) {
    query = query.eq("id", idOrSlug);
  } else {
    query = query.eq("slug", idOrSlug);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return null;
  }

  const house = data[0] as BoardingHouse;

  if (house.owner_id) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", house.owner_id)
      .maybeSingle();

    if (ownerProfile) {
      house.owner = ownerProfile as Profile;
    }
  }

  if (house.rooms && house.rooms.length > 0) {
    const rents = house.rooms.map((r) => r.monthly_rent);
    house.min_rent = Math.min(...rents);
  }

  return house;
}

// ========================================================================
// 2. OWNER PROPERTY & ROOM MANAGEMENT
// ========================================================================

/**
 * Create a new boarding house property.
 * Strictly derives owner_id from Clerk session.
 */
export async function createPropertyAction(data: {
  name: string;
  description: string;
  address: string;
  barangay: string;
  city?: string;
  province?: string;
  gender_restriction?: GenderRestriction;
  curfew_policy?: string;
  visitor_policy?: string;
  amenities?: string[];
  rules?: string[];
  contact_email?: string;
  contact_phone?: string;
  latitude?: number;
  longitude?: number;
  cover_image_url?: string;
}): Promise<{ success: boolean; property?: BoardingHouse; error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  if (!data.name?.trim() || !data.address?.trim() || !data.barangay?.trim()) {
    return { success: false, error: "Name, address, and barangay are required" };
  }

  const supabase = await createClient();

  // Generate URL slug
  const baseSlug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  const lat = data.latitude || 8.9482; // Default to Butuan center
  const lng = data.longitude || 125.5432;

  const payload = {
    owner_id: userId,
    name: data.name.trim(),
    slug,
    description: data.description?.trim() || "",
    address: data.address.trim(),
    barangay: data.barangay.trim(),
    city: data.city?.trim() || "Butuan City",
    province: data.province?.trim() || "Agusan del Norte",
    postal_code: "8600",
    gender_restriction: data.gender_restriction || "coed",
    curfew_policy: data.curfew_policy?.trim() || null,
    visitor_policy: data.visitor_policy?.trim() || null,
    amenities: data.amenities || [],
    rules: data.rules || [],
    contact_email: data.contact_email?.trim() || null,
    contact_phone: data.contact_phone?.trim() || null,
    cover_image_url: data.cover_image_url || null,
    status: "published",
    location: `POINT(${lng} ${lat})`,
  };

  const { data: inserted, error } = await supabase
    .from("boarding_houses")
    .insert([payload])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, property: inserted as BoardingHouse };
}

/**
 * Update an existing boarding house property.
 * Enforces ownership via Clerk session + RLS.
 */
export async function updatePropertyAction(
  propertyId: string,
  data: Partial<{
    name: string;
    description: string;
    address: string;
    barangay: string;
    gender_restriction: GenderRestriction;
    curfew_policy: string;
    visitor_policy: string;
    amenities: string[];
    rules: string[];
    contact_email: string;
    contact_phone: string;
    cover_image_url: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("boarding_houses")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId)
    .eq("owner_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Archive a property listing so it is no longer visible in public search.
 */
export async function archivePropertyAction(
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("boarding_houses")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", propertyId)
    .eq("owner_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Add a new room unit to an owned boarding house.
 */
export async function createRoomAction(
  propertyId: string,
  data: {
    room_number: string;
    room_type?: RoomType;
    capacity: number;
    available_beds?: number;
    monthly_rent: number;
    security_deposit?: number;
    floor_level?: number;
    gender_preference?: "male" | "female" | "any";
    features?: string[];
  }
): Promise<{ success: boolean; room?: Room; error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  if (data.monthly_rent <= 0) {
    return { success: false, error: "Monthly rent must be greater than ₱0" };
  }
  if (data.capacity < 1) {
    return { success: false, error: "Capacity must be at least 1 person" };
  }

  const supabase = await createClient();

  // Verify ownership of the parent boarding house
  const { data: house, error: houseErr } = await supabase
    .from("boarding_houses")
    .select("id")
    .eq("id", propertyId)
    .eq("owner_id", userId)
    .single();

  if (houseErr || !house) {
    return { success: false, error: "Property not found or unauthorized" };
  }

  const payload = {
    boarding_house_id: propertyId,
    room_number: data.room_number.trim(),
    room_type: data.room_type || "solo",
    capacity: data.capacity,
    available_beds:
      data.available_beds !== undefined ? data.available_beds : data.capacity,
    monthly_rent: data.monthly_rent,
    security_deposit: data.security_deposit || 0,
    floor_level: data.floor_level || 1,
    status: "available",
    is_available: true,
    gender_preference: data.gender_preference || "any",
    features: data.features || [],
  };

  const { data: inserted, error } = await supabase
    .from("rooms")
    .insert([payload])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, room: inserted as Room };
}

/**
 * Update room details (rates, features, capacity).
 * Verifies parent boarding house ownership defense-in-depth.
 */
export async function updateRoomAction(
  roomId: string,
  data: Partial<{
    room_number: string;
    room_type: RoomType;
    capacity: number;
    available_beds: number;
    monthly_rent: number;
    security_deposit: number;
    is_available: boolean;
    gender_preference: "male" | "female" | "any";
    features: string[];
    floor_level: number;
    status: RoomStatus;
  }>,
  propertyId?: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  if (data.monthly_rent !== undefined && data.monthly_rent <= 0) {
    return { success: false, error: "Monthly rent must be greater than ₱0" };
  }
  if (data.capacity !== undefined && data.capacity < 1) {
    return { success: false, error: "Capacity must be at least 1 person" };
  }

  const supabase = await createClient();

  // Defense-in-depth: Verify ownership
  if (propertyId) {
    const { data: house } = await supabase
      .from("boarding_houses")
      .select("id")
      .eq("id", propertyId)
      .eq("owner_id", userId)
      .maybeSingle();

    if (!house) {
      return { success: false, error: "Property not found or unauthorized" };
    }
  } else {
    const { data: roomWithHouse } = await supabase
      .from("rooms")
      .select("boarding_house_id, boarding_houses:boarding_house_id(owner_id)")
      .eq("id", roomId)
      .maybeSingle();

    const parentOwner = (
      roomWithHouse?.boarding_houses as unknown as { owner_id: string } | null
    )?.owner_id;
    if (!roomWithHouse || parentOwner !== userId) {
      return { success: false, error: "Unauthorized or room not found" };
    }
  }

  const { error } = await supabase
    .from("rooms")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Toggle room vacancy availability.
 * Verifies parent boarding house ownership defense-in-depth.
 */
export async function updateRoomAvailabilityAction(
  roomId: string,
  isAvailable: boolean,
  availableBeds?: number,
  propertyId?: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await createClient();

  // Defense-in-depth: verify ownership
  if (propertyId) {
    const { data: house } = await supabase
      .from("boarding_houses")
      .select("id")
      .eq("id", propertyId)
      .eq("owner_id", userId)
      .maybeSingle();

    if (!house) {
      return { success: false, error: "Property not found or unauthorized" };
    }
  } else {
    const { data: roomWithHouse } = await supabase
      .from("rooms")
      .select("boarding_house_id, boarding_houses:boarding_house_id(owner_id)")
      .eq("id", roomId)
      .maybeSingle();

    const parentOwner = (
      roomWithHouse?.boarding_houses as unknown as { owner_id: string } | null
    )?.owner_id;
    if (!roomWithHouse || parentOwner !== userId) {
      return { success: false, error: "Unauthorized or room not found" };
    }
  }

  const updatePayload: Record<string, unknown> = {
    is_available: isAvailable,
    status: isAvailable ? "available" : "occupied",
    updated_at: new Date().toISOString(),
  };

  if (availableBeds !== undefined) {
    updatePayload.available_beds = availableBeds;
  }

  const { error } = await supabase
    .from("rooms")
    .update(updatePayload)
    .eq("id", roomId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete a room unit.
 * Strictly verifies that the authenticated user owns the parent boarding house.
 */
export async function deleteRoomAction(
  roomId: string,
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await createClient();

  // Defense-in-depth: Verify parent property ownership
  const { data: house, error: houseErr } = await supabase
    .from("boarding_houses")
    .select("id")
    .eq("id", propertyId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (houseErr || !house) {
    return { success: false, error: "Property not found or unauthorized" };
  }

  const { error } = await supabase
    .from("rooms")
    .delete()
    .eq("id", roomId)
    .eq("boarding_house_id", propertyId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ========================================================================
// 3. SEEKER FAVORITES
// ========================================================================

/**
 * Toggle bookmark/favorite for a boarding house.
 */
export async function toggleFavoriteAction(
  boardingHouseId: string
): Promise<{ success: boolean; isFavorite?: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await createClient();

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("boarding_house_id", boardingHouseId)
    .maybeSingle();

  if (existing) {
    const { error: delErr } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);

    if (delErr) return { success: false, error: delErr.message };
    return { success: true, isFavorite: false };
  } else {
    const { error: insErr } = await supabase.from("favorites").insert([
      {
        user_id: userId,
        boarding_house_id: boardingHouseId,
      },
    ]);

    if (insErr) return { success: false, error: insErr.message };
    return { success: true, isFavorite: true };
  }
}

/**
 * Get all favorited boarding houses for current authenticated seeker.
 */
export async function getSeekerFavoritesAction(): Promise<Favorite[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("favorites")
    .select("*, boarding_house:boarding_houses(*, rooms(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getSeekerFavoritesAction] error:", error.message);
    return [];
  }

  return (data || []) as Favorite[];
}

/**
 * Get list of favorited boarding house IDs for the current authenticated seeker.
 */
export async function getUserFavoriteIdsAction(): Promise<string[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("favorites")
      .select("boarding_house_id")
      .eq("user_id", userId);

    if (error || !data) return [];
    return data.map((f: { boarding_house_id: string }) => f.boarding_house_id);
  } catch {
    return [];
  }
}

/**
 * Check if a single boarding house is favorited by the current user.
 */
export async function checkIsFavoritedAction(boardingHouseId: string): Promise<boolean> {
  try {
    const { userId } = await auth();
    if (!userId) return false;

    const supabase = await createClient();
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("boarding_house_id", boardingHouseId)
      .maybeSingle();

    return Boolean(data);
  } catch {
    return false;
  }
}

// ========================================================================
// 4. INQUIRIES & DIRECT MESSAGING (CHAT)
// ========================================================================

/**
 * Submit an inquiry for a boarding house and optional room.
 * Automatically initializes a direct conversation between seeker and owner.
 */
export async function createInquiryAction(data: {
  boardingHouseId: string;
  roomId?: string;
  targetMoveIn?: string;
  message: string;
}): Promise<{ success: boolean; inquiryId?: string; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  if (!data.message?.trim()) {
    return { success: false, error: "Message content cannot be empty" };
  }

  const supabase = await createClient();

  // Retrieve boarding house owner_id
  const { data: house, error: houseErr } = await supabase
    .from("boarding_houses")
    .select("id, owner_id")
    .eq("id", data.boardingHouseId)
    .single();

  if (houseErr || !house) {
    return { success: false, error: "Boarding house not found" };
  }

  // 1. Insert Inquiry
  const { data: inquiry, error: inqErr } = await supabase
    .from("inquiries")
    .insert([
      {
        seeker_id: userId,
        boarding_house_id: data.boardingHouseId,
        room_id: data.roomId || null,
        target_move_in: data.targetMoveIn || null,
        message: data.message.trim(),
        status: "new",
      },
    ])
    .select()
    .single();

  if (inqErr || !inquiry) {
    return { success: false, error: inqErr?.message || "Failed to create inquiry" };
  }

  // 2. Initialize Conversation & First Message
  const { data: conversation, error: convErr } = await supabase
    .from("conversations")
    .insert([
      {
        inquiry_id: inquiry.id,
        seeker_id: userId,
        owner_id: house.owner_id,
        boarding_house_id: house.id,
      },
    ])
    .select()
    .single();

  if (!convErr && conversation) {
    await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        sender_id: userId,
        content: data.message.trim(),
        is_read: false,
      },
    ]);
  }

  return { success: true, inquiryId: inquiry.id };
}

/**
 * Update inquiry status (e.g., viewing_requested, viewing_scheduled, closed).
 */
export async function updateInquiryStatusAction(
  inquiryId: string,
  newStatus: InquiryStatus
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("inquiries")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", inquiryId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Fetch all conversations for the authenticated user (seeker or owner).
 */
export async function getConversationsAction(): Promise<Conversation[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select(
      "*, boarding_house:boarding_houses(id, name, address, cover_image_url), messages(*)"
    )
    .or(`seeker_id.eq.${userId},owner_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getConversationsAction] error:", error.message);
    return [];
  }

  return (data || []) as Conversation[];
}

/**
 * Fetch messages for a specific conversation.
 */
export async function getMessagesAction(
  conversationId: string
): Promise<Message[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getMessagesAction] error:", error.message);
    return [];
  }

  return (data || []) as Message[];
}

/**
 * Send a message within an existing conversation thread.
 */
export async function sendMessageAction(
  conversationId: string,
  content: string
): Promise<{ success: boolean; message?: Message; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  if (!content?.trim()) {
    return { success: false, error: "Message cannot be empty" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
        is_read: false,
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Update conversation updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return { success: true, message: data as Message };
}

// ========================================================================
// 5. USER REPORTING & SAFETY
// ========================================================================

/**
 * Report a boarding house listing for safety, fraud, or inaccuracy.
 */
export async function createReportAction(data: {
  boardingHouseId: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  if (!data.reason?.trim()) {
    return { success: false, error: "Reason for report is required" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("reports").insert([
    {
      reporter_id: userId,
      boarding_house_id: data.boardingHouseId,
      reason: data.reason.trim(),
      details: data.details?.trim() || null,
      status: "pending",
    },
  ]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ========================================================================
// 6. PROFILES & ROLES
// ========================================================================

/**
 * Authoritatively sync or fetch the authenticated user's profile.
 */
export async function syncProfile(data?: {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  avatarUrl?: string;
}): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    if (data) {
      const { data: updated, error: updErr } = await supabase
        .from("profiles")
        .update({
          full_name: data.fullName || existing.full_name,
          phone: data.phone !== undefined ? data.phone : existing.phone,
          avatar_url: data.avatarUrl !== undefined ? data.avatarUrl : existing.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (updErr) return { success: false, error: updErr.message };
      return { success: true, profile: updated as Profile };
    }
    return { success: true, profile: existing as Profile };
  }

  // Create new profile record
  const newProfile = {
    id: userId,
    email: data?.email || "",
    full_name: data?.fullName || "Pabulong User",
    phone: data?.phone || null,
    avatar_url: data?.avatarUrl || null,
    role: data?.role || "seeker",
    is_verified: false,
  };

  const { data: created, error: insErr } = await supabase
    .from("profiles")
    .insert([newProfile])
    .select()
    .single();

  if (insErr) {
    return { success: false, error: insErr.message };
  }

  return { success: true, profile: created as Profile };
}

// ========================================================================
// 7. LANDLORD / OWNER WORKFLOWS
// ========================================================================

/**
 * Fetch all properties owned by the authenticated landlord.
 * Enforces ownership strictly via Clerk userId and Supabase RLS.
 */
export async function getOwnerPropertiesAction(): Promise<BoardingHouse[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boarding_houses")
    .select("*, rooms(*)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[getOwnerPropertiesAction] Error:", error?.message);
    return [];
  }

  return (data as BoardingHouse[]).map((h) => ({
    ...h,
    min_rent:
      h.rooms && h.rooms.length > 0
        ? Math.min(...h.rooms.map((r) => r.monthly_rent))
        : undefined,
  }));
}

/**
 * Fetch a single property owned by the authenticated landlord.
 * Resolves strictly to null if not found or if the property belongs to another owner.
 */
export async function getOwnerPropertyByIdAction(
  propertyId: string
): Promise<BoardingHouse | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boarding_houses")
    .select("*, rooms(*), photos:property_photos(*)")
    .eq("id", propertyId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (data.rooms) {
    data.rooms.sort((a: Room, b: Room) =>
      a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
    );
  }

  return data as BoardingHouse;
}

/**
 * Fetch all incoming inquiries for the landlord's properties.
 * Shows seeker contact info, target move-in date, room context, and message.
 */
export async function getOwnerInquiriesAction(
  propertyId?: string
): Promise<Inquiry[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  const supabase = await createClient();

  // First fetch properties owned by this landlord
  let houseQuery = supabase
    .from("boarding_houses")
    .select("id")
    .eq("owner_id", userId);

  if (propertyId) {
    houseQuery = houseQuery.eq("id", propertyId);
  }

  const { data: houses, error: houseErr } = await houseQuery;
  if (houseErr || !houses || houses.length === 0) {
    return [];
  }

  const houseIds = houses.map((h) => h.id);

  const { data: inquiries, error } = await supabase
    .from("inquiries")
    .select(
      "*, boarding_house:boarding_houses(id, name, address, cover_image_url), room:rooms(id, room_number, room_type, monthly_rent)"
    )
    .in("boarding_house_id", houseIds)
    .order("created_at", { ascending: false });

  if (error || !inquiries) {
    console.error("[getOwnerInquiriesAction] Error:", error?.message);
    return [];
  }

  // Populate seeker profile information
  const seekerIds = Array.from(new Set(inquiries.map((i) => i.seeker_id)));
  if (seekerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .in("id", seekerIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    return inquiries.map((i) => ({
      ...i,
      seeker: profileMap.get(i.seeker_id) || undefined,
    })) as Inquiry[];
  }

  return inquiries as Inquiry[];
}

/**
 * Aggregate summary metrics across all properties owned by this landlord.
 */
export async function getOwnerMetricsAction(): Promise<OwnerMetrics> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return {
      totalProperties: 0,
      totalRooms: 0,
      totalCapacity: 0,
      availableBeds: 0,
      occupancyRate: 0,
      pendingInquiriesCount: 0,
      totalInquiriesCount: 0,
    };
  }

  const supabase = await createClient();

  // Fetch owned houses with their rooms
  const { data: houses } = await supabase
    .from("boarding_houses")
    .select("id, rooms(*)")
    .eq("owner_id", userId);

  const ownedHouses = houses || [];
  const houseIds = ownedHouses.map((h) => h.id);

  let totalRooms = 0;
  let totalCapacity = 0;
  let availableBeds = 0;

  for (const h of ownedHouses) {
    if (h.rooms) {
      for (const r of h.rooms) {
        totalRooms += 1;
        totalCapacity += r.capacity || 0;
        availableBeds +=
          r.available_beds !== undefined
            ? r.available_beds
            : r.is_available
            ? r.capacity
            : 0;
      }
    }
  }

  // Fetch inquiries for owned houses
  let pendingInquiriesCount = 0;
  let totalInquiriesCount = 0;

  if (houseIds.length > 0) {
    const { data: inquiries } = await supabase
      .from("inquiries")
      .select("id, status")
      .in("boarding_house_id", houseIds);

    if (inquiries) {
      totalInquiriesCount = inquiries.length;
      pendingInquiriesCount = inquiries.filter(
        (i) => i.status === "new" || i.status === "viewing_requested"
      ).length;
    }
  }

  const occupiedBeds = Math.max(0, totalCapacity - availableBeds);
  const occupancyRate =
    totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0;

  return {
    totalProperties: ownedHouses.length,
    totalRooms,
    totalCapacity,
    availableBeds,
    occupancyRate,
    pendingInquiriesCount,
    totalInquiriesCount,
  };
}

