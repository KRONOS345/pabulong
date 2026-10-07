-- ========================================================================
-- Pabulong Migration: Phase 2 Marketplace Foundation (Butuan City)
-- Normalized Schema: profiles, boarding_houses, rooms, property_photos,
-- favorites, inquiries, conversations, messages, reports + PostGIS & RLS
-- ========================================================================

-- 1. PROFILES TABLE (Clerk User Identity Mapping)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Clerk User ID ('user_xxx')
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('seeker', 'owner', 'admin')) DEFAULT 'seeker',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. BOARDING HOUSES ADDITIVE ALTERATIONS
ALTER TABLE public.boarding_houses
    ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS barangay TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Butuan City',
    ADD COLUMN IF NOT EXISTS province TEXT NOT NULL DEFAULT 'Agusan del Norte',
    ADD COLUMN IF NOT EXISTS postal_code TEXT DEFAULT '8600',
    ADD COLUMN IF NOT EXISTS gender_restriction TEXT NOT NULL DEFAULT 'coed' CHECK (gender_restriction IN ('male_only', 'female_only', 'coed')),
    ADD COLUMN IF NOT EXISTS curfew_policy TEXT,
    ADD COLUMN IF NOT EXISTS visitor_policy TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'archived', 'suspended')),
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_boarding_houses_status ON public.boarding_houses(status);
CREATE INDEX IF NOT EXISTS idx_boarding_houses_owner_id ON public.boarding_houses(owner_id);
CREATE INDEX IF NOT EXISTS idx_boarding_houses_barangay ON public.boarding_houses(barangay);
CREATE INDEX IF NOT EXISTS idx_boarding_houses_city ON public.boarding_houses(city);
CREATE INDEX IF NOT EXISTS idx_boarding_houses_gender ON public.boarding_houses(gender_restriction);
CREATE INDEX IF NOT EXISTS idx_boarding_houses_featured ON public.boarding_houses(featured);

-- 3. ROOMS ADDITIVE ALTERATIONS
ALTER TABLE public.rooms
    ADD COLUMN IF NOT EXISTS room_type TEXT NOT NULL DEFAULT 'solo' CHECK (room_type IN ('solo', 'shared', 'bedspace')),
    ADD COLUMN IF NOT EXISTS available_beds INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS floor_level INTEGER DEFAULT 1;

-- Add Room Constraints safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rooms_rent_positive') THEN
        ALTER TABLE public.rooms ADD CONSTRAINT chk_rooms_rent_positive CHECK (monthly_rent > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rooms_capacity_positive') THEN
        ALTER TABLE public.rooms ADD CONSTRAINT chk_rooms_capacity_positive CHECK (capacity >= 1);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rooms_beds_non_negative') THEN
        ALTER TABLE public.rooms ADD CONSTRAINT chk_rooms_beds_non_negative CHECK (available_beds >= 0 AND available_beds <= capacity);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rooms_boarding_house_id ON public.rooms(boarding_house_id);
CREATE INDEX IF NOT EXISTS idx_rooms_availability ON public.rooms(is_available, status);
CREATE INDEX IF NOT EXISTS idx_rooms_monthly_rent ON public.rooms(monthly_rent);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type ON public.rooms(room_type);

-- 4. PROPERTY PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.property_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    caption TEXT,
    is_cover BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_property_photos_house ON public.property_photos(boarding_house_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_room ON public.property_photos(room_id);

-- 5. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Clerk User ID
    boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, boarding_house_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_house_id ON public.favorites(boarding_house_id);

-- 6. INQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id TEXT NOT NULL, -- Clerk User ID
    boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    target_move_in DATE,
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('new', 'replied', 'viewing_requested', 'viewing_scheduled', 'closed')) DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inquiries_seeker ON public.inquiries(seeker_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_house ON public.inquiries(boarding_house_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);

-- 7. CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID UNIQUE REFERENCES public.inquiries(id) ON DELETE CASCADE,
    seeker_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_conversations_seeker ON public.conversations(seeker_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON public.conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_inquiry ON public.conversations(inquiry_id);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- 8. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id TEXT NOT NULL,
    boarding_house_id UUID REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_house ON public.reports(boarding_house_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ========================================================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles"
ON public.profiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = public.requesting_user_id());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = public.requesting_user_id())
WITH CHECK (id = public.requesting_user_id());

-- Boarding Houses Policies (Public view published; Owners CRUD own)
DROP POLICY IF EXISTS "Authenticated users can view boarding houses" ON public.boarding_houses;
DROP POLICY IF EXISTS "Public users can view published boarding houses" ON public.boarding_houses;
CREATE POLICY "Public users can view published boarding houses"
ON public.boarding_houses FOR SELECT
USING (status = 'published' OR owner_id = public.requesting_user_id());

DROP POLICY IF EXISTS "Owners can manage own boarding houses" ON public.boarding_houses;
CREATE POLICY "Owners can manage own boarding houses"
ON public.boarding_houses FOR ALL
USING (owner_id = public.requesting_user_id())
WITH CHECK (owner_id = public.requesting_user_id());

-- Rooms Policies (Public view published; Owners manage own)
DROP POLICY IF EXISTS "Authenticated users can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Public users can view rooms of published houses" ON public.rooms;
CREATE POLICY "Public users can view rooms of published houses"
ON public.rooms FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.boarding_houses bh
        WHERE bh.id = rooms.boarding_house_id
        AND (bh.status = 'published' OR bh.owner_id = public.requesting_user_id())
    )
);

DROP POLICY IF EXISTS "House owners can manage rooms" ON public.rooms;
CREATE POLICY "House owners can manage rooms"
ON public.rooms FOR ALL
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

-- Property Photos Policies
DROP POLICY IF EXISTS "Public can view property photos" ON public.property_photos;
CREATE POLICY "Public can view property photos"
ON public.property_photos FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.boarding_houses bh
        WHERE bh.id = property_photos.boarding_house_id
        AND (bh.status = 'published' OR bh.owner_id = public.requesting_user_id())
    )
);

DROP POLICY IF EXISTS "Owners can manage property photos" ON public.property_photos;
CREATE POLICY "Owners can manage property photos"
ON public.property_photos FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.boarding_houses bh
        WHERE bh.id = property_photos.boarding_house_id
        AND bh.owner_id = public.requesting_user_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.boarding_houses bh
        WHERE bh.id = property_photos.boarding_house_id
        AND bh.owner_id = public.requesting_user_id()
    )
);

-- Favorites Policies
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites"
ON public.favorites FOR ALL
USING (user_id = public.requesting_user_id())
WITH CHECK (user_id = public.requesting_user_id());

-- Inquiries Policies
DROP POLICY IF EXISTS "Seeker and owner can view inquiries" ON public.inquiries;
CREATE POLICY "Seeker and owner can view inquiries"
ON public.inquiries FOR SELECT
USING (
    seeker_id = public.requesting_user_id()
    OR EXISTS (
        SELECT 1 FROM public.boarding_houses bh
        WHERE bh.id = inquiries.boarding_house_id
        AND bh.owner_id = public.requesting_user_id()
    )
);

DROP POLICY IF EXISTS "Seekers can create inquiries" ON public.inquiries;
CREATE POLICY "Seekers can create inquiries"
ON public.inquiries FOR INSERT
WITH CHECK (seeker_id = public.requesting_user_id());

DROP POLICY IF EXISTS "Participants can update inquiry status" ON public.inquiries;
CREATE POLICY "Participants can update inquiry status"
ON public.inquiries FOR UPDATE
USING (
    seeker_id = public.requesting_user_id()
    OR EXISTS (
        SELECT 1 FROM public.boarding_houses bh
        WHERE bh.id = inquiries.boarding_house_id
        AND bh.owner_id = public.requesting_user_id()
    )
);

-- Conversations Policies
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
ON public.conversations FOR SELECT
USING (seeker_id = public.requesting_user_id() OR owner_id = public.requesting_user_id());

DROP POLICY IF EXISTS "Participants can insert conversations" ON public.conversations;
CREATE POLICY "Participants can insert conversations"
ON public.conversations FOR INSERT
WITH CHECK (seeker_id = public.requesting_user_id() OR owner_id = public.requesting_user_id());

-- Messages Policies
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND (c.seeker_id = public.requesting_user_id() OR c.owner_id = public.requesting_user_id())
    )
);

DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
CREATE POLICY "Participants can insert messages"
ON public.messages FOR INSERT
WITH CHECK (
    sender_id = public.requesting_user_id()
    AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND (c.seeker_id = public.requesting_user_id() OR c.owner_id = public.requesting_user_id())
    )
);

-- Reports Policies
DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
CREATE POLICY "Users can insert reports"
ON public.reports FOR INSERT
WITH CHECK (reporter_id = public.requesting_user_id());

DROP POLICY IF EXISTS "Reporters can view own reports" ON public.reports;
CREATE POLICY "Reporters can view own reports"
ON public.reports FOR SELECT
USING (reporter_id = public.requesting_user_id());

-- ========================================================================
-- POSTGIS SPATIAL MARKETPLACE RPC: nearby_boarding_houses (V2)
-- ========================================================================

DROP FUNCTION IF EXISTS public.nearby_boarding_houses(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS public.nearby_boarding_houses(FLOAT, FLOAT, FLOAT);
DROP FUNCTION IF EXISTS public.nearby_boarding_houses(FLOAT, FLOAT);

CREATE OR REPLACE FUNCTION public.nearby_boarding_houses(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 50000
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  address TEXT,
  barangay TEXT,
  city TEXT,
  gender_restriction TEXT,
  cover_image_url TEXT,
  min_rent NUMERIC,
  dist_meters DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT 
    bh.id,
    bh.name,
    bh.slug,
    bh.address,
    bh.barangay,
    bh.city,
    bh.gender_restriction,
    bh.cover_image_url,
    COALESCE(MIN(r.monthly_rent), 0) AS min_rent,
    ST_Distance(
      bh.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS dist_meters
  FROM public.boarding_houses bh
  LEFT JOIN public.rooms r ON r.boarding_house_id = bh.id AND r.is_available = true
  WHERE 
    bh.status = 'published'
    AND bh.location IS NOT NULL
    AND ST_DWithin(
      bh.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  GROUP BY bh.id, bh.name, bh.slug, bh.address, bh.barangay, bh.city, bh.gender_restriction, bh.cover_image_url, bh.location
  ORDER BY dist_meters ASC;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_boarding_houses(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated, service_role;

