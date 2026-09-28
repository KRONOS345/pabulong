"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  isDevMockEnabled,
  isSupabaseConfigured,
  getAuthenticatedUserId,
} from "@/lib/auth-helpers";

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  user_id?: string;
  similarity?: number;
  created_at: string;
}

const DEFAULT_MOCK_NOTES: NoteItem[] = [
  {
    id: "note-1",
    title: "University Dorm Safety & Curfew Protocols",
    content:
      "All boarding houses within 1km of the campus gate must adhere to municipal curfew standards (10:00 PM for undergrads). Fire exits, CCTV on entrances, and biometric logging are recommended.",
    tags: ["security", "policy", "regulations"],
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: "note-2",
    title: "Greenfield Residences Amenity Audit",
    content:
      "Inspected Greenfield Residences Block B. High-speed fiber internet (300 Mbps), backup generator operational, private study pods on floor 2. Female-only wing on 3rd floor.",
    tags: ["housing", "audit", "amenities"],
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: "note-3",
    title: "Student Budget & Pricing Tier Matrix (2026)",
    content:
      "Standard studio single: $350 - $450/month. 2-person shared unit: $220 - $280/person. 4-person quad: $150 - $190/person. Utility deposits capped at 1 month advance.",
    tags: ["finance", "pricing", "students"],
    created_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
  },
  {
    id: "note-4",
    title: "Landlord Lease Contract Standard Terms",
    content:
      "Mandatory 6-month minimum lock-in. 30-day notice for pre-termination. Return of security deposit strictly within 14 calendar days post room inspection.",
    tags: ["contracts", "legal", "landlords"],
    created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
  },
];

function filterMockNotes(params?: {
  search?: string;
  tag?: string;
  vectorQuery?: string;
}): NoteItem[] {
  let notes = [...DEFAULT_MOCK_NOTES];

  if (params?.tag) {
    notes = notes.filter((n) => n.tags.includes(params.tag!));
  }

  if (params?.search) {
    const s = params.search.toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s)
    );
  }

  if (params?.vectorQuery) {
    const v = params.vectorQuery.toLowerCase();
    notes = notes
      .map((n) => {
        let score = 0.55;
        if (n.title.toLowerCase().includes(v)) score += 0.35;
        if (n.content.toLowerCase().includes(v)) score += 0.25;
        n.tags.forEach((t) => {
          if (v.includes(t)) score += 0.15;
        });
        return { ...n, similarity: Math.min(Number(score.toFixed(2)), 0.99) };
      })
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  }

  return notes;
}

export async function fetchNotes(params?: {
  search?: string;
  tag?: string;
  vectorQuery?: string;
}): Promise<NoteItem[]> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!isSupabaseConfigured()) {
      if (isDevMockEnabled()) {
        return filterMockNotes(params);
      }
      return [];
    }

    if (!userId) {
      return [];
    }

    const supabase = await createClient();
    let query = supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (params?.tag) {
      query = query.contains("tags", [params.tag]);
    }

    if (params?.search) {
      query = query.ilike("title", `%${params.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      if (isDevMockEnabled()) {
        return filterMockNotes(params);
      }
      console.error("Supabase fetchNotes error:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      if (isDevMockEnabled()) {
        return filterMockNotes(params);
      }
      return [];
    }

    return data as NoteItem[];
  } catch (err) {
    console.error("fetchNotes caught error:", err);
    if (isDevMockEnabled()) {
      return filterMockNotes(params);
    }
    return [];
  }
}

export async function createNoteAction(data: {
  title: string;
  content: string;
  tags: string[];
}): Promise<{ success: boolean; error?: string; note?: NoteItem }> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const newNote = {
      title: data.title.trim(),
      content: data.content.trim(),
      tags: data.tags,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      if (isDevMockEnabled()) {
        const fallbackNote: NoteItem = {
          id: `note-${Date.now()}`,
          ...newNote,
        };
        revalidatePath("/dashboard/notes");
        return { success: true, note: fallbackNote };
      }
      return { success: false, error: "Database not configured." };
    }

    const supabase = await createClient();
    const { data: inserted, error } = await supabase
      .from("notes")
      .insert(newNote)
      .select()
      .single();

    if (error) {
      if (isDevMockEnabled()) {
        const fallbackNote: NoteItem = {
          id: `note-${Date.now()}`,
          ...newNote,
        };
        revalidatePath("/dashboard/notes");
        return { success: true, note: fallbackNote };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/notes");
    return { success: true, note: inserted as NoteItem };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create note";
    return { success: false, error: message };
  }
}
