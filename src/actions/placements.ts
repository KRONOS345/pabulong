"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  type PlacementStage,
  type RoomOption,
  type PlacementItem,
  AVAILABLE_ROOMS,
} from "@/lib/placement-types";
import {
  isDevMockEnabled,
  isSupabaseConfigured,
  getAuthenticatedUserId,
} from "@/lib/auth-helpers";

export type { PlacementStage, RoomOption, PlacementItem };

const DEFAULT_MOCK_PLACEMENTS: PlacementItem[] = [
  {
    id: "plc-1",
    client_name: "Elena Rostova",
    client_email: "elena.r@student.edu",
    client_phone: "+1 555-0192",
    budget_max: 450,
    preferred_location: "Near Engineering Quad (North Gate)",
    stage: "Inquiry",
    notes: "First year graduate student. Requests quiet environment for dissertation writing.",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "plc-2",
    client_name: "Marcus Vance",
    client_email: "m.vance@university.edu",
    client_phone: "+1 555-0842",
    budget_max: 400,
    preferred_location: "Within 500m of Main Campus",
    stage: "Viewing",
    room_id: "room-101",
    matched_room: AVAILABLE_ROOMS[0],
    notes: "Viewing scheduled Friday 2:00 PM. Interested in Unit 204.",
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: "plc-3",
    client_name: "Sophia Chen",
    client_email: "sophia.chen@med.edu",
    client_phone: "+1 555-0723",
    budget_max: 250,
    preferred_location: "Medical Sciences Wing",
    stage: "Deposit Pending",
    room_id: "room-103",
    matched_room: AVAILABLE_ROOMS[2],
    notes: "Deposit receipt under verification by billing department.",
    created_at: new Date(Date.now() - 3600000 * 60).toISOString(),
  },
  {
    id: "plc-4",
    client_name: "David Kim",
    client_email: "dkim@college.edu",
    client_phone: "+1 555-0331",
    budget_max: 420,
    preferred_location: "University Heights Sector",
    stage: "Placed",
    room_id: "room-102",
    matched_room: AVAILABLE_ROOMS[1],
    notes: "Move-in completed. Keys and security card issued.",
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
  },
];

export async function fetchPlacements(): Promise<PlacementItem[]> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!isSupabaseConfigured()) {
      if (isDevMockEnabled()) {
        return DEFAULT_MOCK_PLACEMENTS;
      }
      return [];
    }

    if (!userId) {
      return [];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("placements")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isDevMockEnabled()) {
        return DEFAULT_MOCK_PLACEMENTS;
      }
      console.error("Supabase fetchPlacements error:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      if (isDevMockEnabled()) {
        return DEFAULT_MOCK_PLACEMENTS;
      }
      return [];
    }

    return data.map((item) => ({
      ...item,
      matched_room: AVAILABLE_ROOMS.find((r) => r.id === item.room_id),
    })) as PlacementItem[];
  } catch (err) {
    console.error("fetchPlacements caught error:", err);
    if (isDevMockEnabled()) {
      return DEFAULT_MOCK_PLACEMENTS;
    }
    return [];
  }
}

export async function updatePlacementStage(
  placementId: string,
  newStage: PlacementStage
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    if (!isSupabaseConfigured()) {
      if (isDevMockEnabled()) {
        revalidatePath("/dashboard/placements");
        return { success: true };
      }
      return { success: false, error: "Database not configured." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("placements")
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq("id", placementId)
      .eq("user_id", userId);

    if (error) {
      if (isDevMockEnabled()) {
        revalidatePath("/dashboard/placements");
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/placements");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update stage";
    return { success: false, error: message };
  }
}

export async function matchPlacementRoom(
  placementId: string,
  roomId: string
): Promise<{ success: boolean; room?: RoomOption; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const room = AVAILABLE_ROOMS.find((r) => r.id === roomId);

    if (!isSupabaseConfigured()) {
      if (isDevMockEnabled()) {
        revalidatePath("/dashboard/placements");
        return { success: true, room };
      }
      return { success: false, error: "Database not configured." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("placements")
      .update({ room_id: roomId, updated_at: new Date().toISOString() })
      .eq("id", placementId)
      .eq("user_id", userId);

    if (error) {
      if (isDevMockEnabled()) {
        revalidatePath("/dashboard/placements");
        return { success: true, room };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/placements");
    return { success: true, room };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to match room";
    return { success: false, error: message };
  }
}

export async function createPlacementAction(data: {
  client_name: string;
  client_email: string;
  client_phone?: string;
  budget_max: number;
  preferred_location: string;
  notes?: string;
}): Promise<{ success: boolean; placement?: PlacementItem; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const newEntry = {
      ...data,
      user_id: userId,
      stage: "Inquiry" as PlacementStage,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      if (isDevMockEnabled()) {
        const fallbackItem: PlacementItem = {
          id: `plc-${Date.now()}`,
          ...newEntry,
        };
        revalidatePath("/dashboard/placements");
        return { success: true, placement: fallbackItem };
      }
      return { success: false, error: "Database not configured." };
    }

    const supabase = await createClient();
    const { data: inserted, error } = await supabase
      .from("placements")
      .insert(newEntry)
      .select()
      .single();

    if (error) {
      if (isDevMockEnabled()) {
        const fallbackItem: PlacementItem = {
          id: `plc-${Date.now()}`,
          ...newEntry,
        };
        revalidatePath("/dashboard/placements");
        return { success: true, placement: fallbackItem };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/placements");
    return { success: true, placement: inserted as PlacementItem };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create placement";
    return { success: false, error: message };
  }
}
