"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  type BoardingHouseItem,
  type RoomItem,
  DEFAULT_MOCK_PROPERTIES,
} from "@/lib/property-types";
import {
  isDevMockEnabled,
  isSupabaseConfigured,
  getAuthenticatedUserId,
} from "@/lib/auth-helpers";

export async function fetchProperties(): Promise<BoardingHouseItem[]> {
  try {
    if (!isSupabaseConfigured()) {
      if (isDevMockEnabled()) {
        return DEFAULT_MOCK_PROPERTIES;
      }
      return [];
    }

    const supabase = await createClient();
    const { data: houses, error: houseError } = await supabase
      .from("boarding_houses")
      .select("*, rooms(*)")
      .order("created_at", { ascending: false });

    if (houseError) {
      if (isDevMockEnabled()) {
        return DEFAULT_MOCK_PROPERTIES;
      }
      console.error("Supabase fetch properties error:", houseError.message);
      return [];
    }

    if (!houses || houses.length === 0) {
      if (isDevMockEnabled()) {
        return DEFAULT_MOCK_PROPERTIES;
      }
      return [];
    }

    return houses.map((h) => ({
      ...h,
      latitude: 14.5995,
      longitude: 120.9842,
    })) as BoardingHouseItem[];
  } catch (err) {
    console.error("fetchProperties caught error:", err);
    if (isDevMockEnabled()) {
      return DEFAULT_MOCK_PROPERTIES;
    }
    return [];
  }
}

export async function createBoardingHouseAction(data: {
  name: string;
  description: string;
  address: string;
  amenities: string[];
  rules: string[];
  contact_email: string;
  contact_phone: string;
}): Promise<{ success: boolean; property?: BoardingHouseItem; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const newProperty: BoardingHouseItem = {
      id: `bh-${Date.now()}`,
      owner_id: userId,
      ...data,
      latitude: 14.5995,
      longitude: 120.9842,
      created_at: new Date().toISOString(),
      rooms: [],
    };

    if (!isSupabaseConfigured()) {
      if (isDevMockEnabled()) {
        revalidatePath("/dashboard/properties");
        return { success: true, property: newProperty };
      }
      return { success: false, error: "Database not configured." };
    }

    const supabase = await createClient();
    const { data: inserted, error } = await supabase
      .from("boarding_houses")
      .insert({
        name: data.name.trim(),
        description: data.description.trim(),
        address: data.address.trim(),
        amenities: data.amenities,
        rules: data.rules,
        contact_email: data.contact_email.trim(),
        contact_phone: data.contact_phone.trim(),
        owner_id: userId,
      })
      .select()
      .single();

    if (error) {
      if (isDevMockEnabled()) {
        revalidatePath("/dashboard/properties");
        return { success: true, property: newProperty };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/properties");
    return { success: true, property: { ...inserted, rooms: [] } as BoardingHouseItem };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create property";
    return { success: false, error: message };
  }
}

export async function createRoomAction(data: {
  boarding_house_id: string;
  room_number: string;
  capacity: number;
  monthly_rent: number;
  status: "available" | "occupied" | "maintenance";
  gender_preference: "male" | "female" | "any";
  features: string[];
}): Promise<{ success: boolean; room?: RoomItem; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const newRoom: RoomItem = {
      id: `room-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      if (isDevMockEnabled()) {
        revalidatePath("/dashboard/properties");
        return { success: true, room: newRoom };
      }
      return { success: false, error: "Database not configured." };
    }

    const supabase = await createClient();
    // Validate ownership before inserting
    const { data: house, error: houseCheckError } = await supabase
      .from("boarding_houses")
      .select("id, owner_id")
      .eq("id", data.boarding_house_id)
      .single();

    if (houseCheckError || !house || house.owner_id !== userId) {
      return { success: false, error: "Unauthorized: You do not own this property." };
    }

    const { data: inserted, error } = await supabase
      .from("rooms")
      .insert(data)
      .select()
      .single();

    if (error) {
      if (isDevMockEnabled()) {
        revalidatePath("/dashboard/properties");
        return { success: true, room: newRoom };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/properties");
    return { success: true, room: inserted as RoomItem };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create room";
    return { success: false, error: message };
  }
}
