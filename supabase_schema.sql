-- Supabase SQL Schema for Unified Second Brain & Boarding House Placement Platform
-- Supports Clerk Authentication, PostGIS Geospatial, and pgvector Vector Search

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Notes Table (Second Brain Knowledge Base)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Clerk User ID (sub claim from JWT)
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    embedding VECTOR(1536), -- Vector embedding representation (OpenAI ada-002 / text-embedding-3-small)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for full text, user filtering, and vector searches
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_tags_idx ON public.notes USING GIN(tags);

-- 3. Boarding Houses Table
CREATE TABLE IF NOT EXISTS public.boarding_houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id TEXT NOT NULL, -- Clerk User ID
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    location GEOMETRY(Point, 4326), -- PostGIS Point: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    amenities TEXT[] DEFAULT '{}',
    rules TEXT[] DEFAULT '{}',
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS boarding_houses_owner_idx ON public.boarding_houses(owner_id);
CREATE INDEX IF NOT EXISTS boarding_houses_location_idx ON public.boarding_houses USING GIST(location);

-- 4. Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    capacity INTEGER DEFAULT 1 NOT NULL,
    monthly_rent NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    gender_preference TEXT NOT NULL DEFAULT 'any' CHECK (gender_preference IN ('male', 'female', 'any')),
    features TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS rooms_boarding_house_id_idx ON public.rooms(boarding_house_id);
CREATE INDEX IF NOT EXISTS rooms_status_idx ON public.rooms(status);

-- 5. Placements Table (Placement Control Center Kanban)
CREATE TABLE IF NOT EXISTS public.placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Clerk User ID coordinating the placement
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    budget_max NUMERIC(10, 2),
    preferred_location TEXT,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    stage TEXT NOT NULL DEFAULT 'Inquiry' CHECK (stage IN ('Inquiry', 'Viewing', 'Deposit Pending', 'Placed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS placements_user_id_idx ON public.placements(user_id);
CREATE INDEX IF NOT EXISTS placements_stage_idx ON public.placements(stage);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Target Clerk user IDs via auth.jwt() ->> 'sub'
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;

-- Helper function to extract Clerk User ID from JWT claim
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS TEXT AS $$
    SELECT coalesce(
        auth.jwt() ->> 'sub',
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    );
$$ LANGUAGE SQL STABLE;

-- Notes Policies (User can only read, write, and manage their own notes)
CREATE POLICY "Users can manage own notes"
ON public.notes
FOR ALL
USING (user_id = public.requesting_user_id())
WITH CHECK (user_id = public.requesting_user_id());

-- Boarding Houses Policies (Owners can manage; authenticated users can view)
CREATE POLICY "Owners can manage own boarding houses"
ON public.boarding_houses
FOR ALL
USING (owner_id = public.requesting_user_id())
WITH CHECK (owner_id = public.requesting_user_id());

CREATE POLICY "Authenticated users can view boarding houses"
ON public.boarding_houses
FOR SELECT
USING (true);

-- Rooms Policies (House owners can manage rooms; authenticated users can view)
CREATE POLICY "House owners can manage rooms"
ON public.rooms
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.boarding_houses bh
        WHERE bh.id = rooms.boarding_house_id
        AND bh.owner_id = public.requesting_user_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.boarding_houses bh
        WHERE bh.id = rooms.boarding_house_id
        AND bh.owner_id = public.requesting_user_id()
    )
);

CREATE POLICY "Authenticated users can view rooms"
ON public.rooms
FOR SELECT
USING (true);

-- Placements Policies (Users can manage placements they coordinate)
CREATE POLICY "Users can manage own placements"
ON public.placements
FOR ALL
USING (user_id = public.requesting_user_id())
WITH CHECK (user_id = public.requesting_user_id());

-- ==========================================
-- STORED FUNCTIONS: VECTOR & GEOSPATIAL SEARCH
-- ==========================================

-- Vector similarity search for Second Brain notes
-- Scoped to user's notes for complete privacy
CREATE OR REPLACE FUNCTION match_notes (
    query_embedding VECTOR(1536),
    match_threshold FLOAT,
    match_count INT,
    filter_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    tags TEXT[],
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.title,
        n.content,
        n.tags,
        1 - (n.embedding <=> query_embedding) AS similarity
    FROM public.notes n
    WHERE n.user_id = filter_user_id
      AND (public.requesting_user_id() IS NULL OR n.user_id = public.requesting_user_id())
      AND 1 - (n.embedding <=> query_embedding) > match_threshold
    ORDER BY n.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Spatial query to find boarding houses within radius in meters
-- Casts location to geography to calculate metric distances accurately
CREATE OR REPLACE FUNCTION nearby_boarding_houses (
    lng FLOAT,
    lat FLOAT,
    radius_meters FLOAT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    distance_meters FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        bh.id,
        bh.name,
        bh.address,
        ST_Distance(bh.location::geography, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance_meters
    FROM public.boarding_houses bh
    WHERE ST_DWithin(bh.location::geography, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
    ORDER BY distance_meters ASC;
END;
$$;
