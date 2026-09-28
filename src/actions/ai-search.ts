"use server";

import { createClient } from "@/lib/supabase/server";
import { type NoteItem } from "@/actions/notes";
import {
  isDevMockEnabled,
  isSupabaseConfigured,
  getAuthenticatedUserId,
} from "@/lib/auth-helpers";

const MOCK_KNOWLEDGE_BASE: NoteItem[] = [
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
  {
    id: "note-5",
    title: "Geospatial Proximity & Campus Transit Routes",
    content:
      "Boarding houses on University Avenue and Elm Parkway have direct access to the campus electric shuttle loop. Walking distance under 350 meters with street lighting and security patrols.",
    tags: ["transit", "location", "commute"],
    created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
  },
  {
    id: "note-6",
    title: "Power Backup & High-Speed Internet Standards",
    content:
      "Requirements for tech students and remote workers: Minimum 200 Mbps fiber connection with dual ISPs and a minimum 5kVA backup generator capable of running router and study pod air conditioning.",
    tags: ["utilities", "amenities", "wifi"],
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
  },
];

/**
 * Generates a 1536-dimensional vector embedding using OpenAI text-embedding-3-small.
 */
async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("placeholder") || apiKey.trim() === "") {
    return null;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000),
      }),
    });

    if (!res.ok) {
      console.warn("OpenAI Embedding API error:", res.status, await res.text());
      return null;
    }

    const payload = await res.json();
    return payload?.data?.[0]?.embedding || null;
  } catch (err) {
    console.warn("OpenAI Embedding request failed:", err);
    return null;
  }
}

/**
 * Deterministic pseudo-embedding and cosine similarity computation
 * for local developer mock fallback mode.
 */
function computeLocalCosineSimilarity(textA: string, textB: string): number {
  const tokenize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const wordsA = tokenize(textA);
  const wordsB = tokenize(textB);

  if (wordsA.length === 0 || wordsB.length === 0) return 0.5;

  const vocab = Array.from(new Set([...wordsA, ...wordsB]));
  const freqA: Record<string, number> = {};
  const freqB: Record<string, number> = {};

  wordsA.forEach((w) => (freqA[w] = (freqA[w] || 0) + 1));
  wordsB.forEach((w) => (freqB[w] = (freqB[w] || 0) + 1));

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const word of vocab) {
    const a = freqA[word] || 0;
    const b = freqB[word] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0.5;
  const rawSimilarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

  return Math.min(Math.max(rawSimilarity * 0.45 + 0.52, 0.5), 0.98);
}

export interface SemanticSearchResult extends NoteItem {
  similarity: number;
}

export async function searchNotesSemantic(
  query: string,
  threshold: number = 0.5,
  limit: number = 10
): Promise<SemanticSearchResult[]> {
  const trimmed = query.trim();
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return [];
  }

  if (!trimmed) {
    if (isDevMockEnabled()) {
      return MOCK_KNOWLEDGE_BASE.map((n) => ({ ...n, similarity: 0.9 }));
    }
    return [];
  }

  try {
    // 1. Live Vector Search with Supabase pgvector & OpenAI
    if (isSupabaseConfigured()) {
      const embedding = await generateQueryEmbedding(trimmed);

      if (embedding) {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc("match_notes", {
          query_embedding: embedding,
          match_threshold: threshold,
          match_count: limit,
          filter_user_id: userId,
        });

        if (!error && data && data.length > 0) {
          return data as SemanticSearchResult[];
        }

        if (error) {
          console.warn("match_notes RPC query error:", error.message);
        }
      }
    }

    // 2. Dev Mock Fallback (only permitted when ENABLE_DEV_MOCKS=true)
    if (isDevMockEnabled()) {
      const scored = MOCK_KNOWLEDGE_BASE.map((note) => {
        const combinedText = `${note.title} ${note.content} ${note.tags.join(" ")}`;
        const similarity = computeLocalCosineSimilarity(trimmed, combinedText);
        return {
          ...note,
          similarity: Number(similarity.toFixed(2)),
        };
      });

      return scored
        .filter((n) => n.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    }

    return [];
  } catch (err) {
    console.error("Semantic vector search caught error:", err);
    if (isDevMockEnabled()) {
      return MOCK_KNOWLEDGE_BASE.map((note) => ({
        ...note,
        similarity: computeLocalCosineSimilarity(
          trimmed,
          `${note.title} ${note.content} ${note.tags.join(" ")}`
        ),
      })).sort((a, b) => b.similarity - a.similarity);
    }
    return [];
  }
}
