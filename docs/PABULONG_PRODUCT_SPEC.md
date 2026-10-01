# Pabulong: Product & Engineering Specification

**Document Version:** 2.0 (Foundation Reset)  
**Status:** Canonical Source of Truth  
**Target Market:** Butuan City, Agusan del Norte, Philippines  
**Repository:** `KRONOS345/pabulong`  
**Stack:** Next.js 15 (App Router, React 19), TypeScript, Tailwind CSS, shadcn/ui, Clerk, Supabase (PostgreSQL, PostGIS, RLS)

---

## 1. Product Vision & Value Proposition

**Pabulong** is a dedicated digital boarding house and dormitory marketplace engineered specifically for **Butuan City**.

In Butuan, thousands of university students (attending FSUU, CSU, SJIT, BDC, ACI) and migrating young professionals face severe friction when finding housing:
* Walking under the tropical heat from street to street looking for cardboard *"Room for Rent"* signs.
* Lack of price transparency, unclear curfews, hidden utility charges, and unverified amenities.
* Scattered Facebook posts with outdated vacancies and slow response times.
* Boarding house owners relying on paper notebooks, struggling with vacant beds, and manually managing tenant inquiries.

Pabulong solves this by providing a unified, localized, verified housing marketplace where:
* **Seekers** discover verified dorms, solo rooms, and bedspaces filtered by campus proximity, budget, barangay, and amenities.
* **Landlords/Owners** list properties, manage multi-room vacancies, publish house rules, receive structured inquiries, and chat directly with prospective tenants.
* **Admins** maintain marketplace trust through listing verification, safety checks, and moderation.

---

## 2. Three User Roles & Permissions Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                                PABULONG                                │
│                     Role-Based Access Control (RBAC)                   │
├────────────────────┬────────────────────┬──────────────────────────────┤
│       SEEKER       │   OWNER / LANDLORD │            ADMIN             │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ • Browse & search  │ • Owner onboarding │ • Listing moderation queue   │
│ • View map & rooms │ • Property CRUD    │ • Landlord verification      │
│ • Save favorites   │ • Room inventory   │ • Report audit & resolution  │
│ • Inquire & chat   │ • Lead management  │ • User suspension / archive  │
│ • Request viewing  │ • Inquiries & chat │ • System metrics & logs      │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

### Role Permissions Matrix:

| Capability / Entity | Seeker | Owner / Landlord | Admin |
| :--- | :---: | :---: | :---: |
| **Browse / Search Published Listings** | ✅ Full Read | ✅ Full Read | ✅ Full Read |
| **View Individual Rooms & Amenities** | ✅ Full Read | ✅ Full Read | ✅ Full Read |
| **Save / Remove Favorites** | ✅ Own Favorites | ❌ | ❌ |
| **Submit Listing Inquiries** | ✅ Own Inquiries | ❌ | ❌ |
| **Request On-Site Viewing** | ✅ Own Requests | ❌ | ❌ |
| **Chat / Messaging** | ✅ Own Conversations | ✅ Own Conversations | 👁 Audit View |
| **Create / Edit Boarding House** | ❌ | ✅ Own Properties | ✅ Full Overwrite |
| **Add / Edit Rooms & Vacancies** | ❌ | ✅ Own Rooms | ✅ Full Overwrite |
| **Upload Property / Room Photos** | ❌ | ✅ Own Photos | ✅ Full Overwrite |
| **Listing Moderation (Publish/Reject)** | ❌ | ❌ | ✅ Full Admin |
| **User Verification Badging** | ❌ | ❌ | ✅ Full Admin |
| **Handle Reports & Takedowns** | ❌ | ❌ | ✅ Full Admin |

---

## 3. Primary User Journeys

### 3.1 Seeker Journey (Student / Boarder)
```
[Landing Page / Search]
       │
       ▼
[Filter Listings] (Barangay, Campus Proximity, Budget in ₱, Gender, Room Type)
       │
       ▼
[Listing Detail Page] (Photos, PostGIS Map, Amenities, House Rules, Room Directory)
       │
       ├──► [Add to Favorites] (Saved to /dashboard/favorites)
       │
       └──► [Inquire / Request Viewing]
                 │
                 ▼
       [Live Chat / Conversation] (Coordinate with Owner via /dashboard/messages)
                 │
                 ▼
       [On-Site Viewing Scheduled & Lease Confirmed]
```

### 3.2 Owner / Landlord Journey
```
[Sign Up / Clerk Auth]
       │
       ▼
[Landlord Profile Onboarding] (Contact verification, Government ID submission)
       │
       ▼
[Create Boarding House Wizard] (/owner/properties/new)
  - Name, Barangay, Street Address, Description
  - Map Pin Coordinates (PostGIS Point)
  - Gender Restriction (Male, Female, Coed)
  - Amenities (WiFi, Submeter, Kitchen, Laundry, Generator)
  - House Rules (Curfew, Visitors, Cooking)
       │
       ▼
[Add Rooms to Property] (/owner/properties/[id]/rooms)
  - Unit/Room Number
  - Type (Solo Room, Shared Room, Bedspace)
  - Monthly Rent (₱) & Security Deposit (₱)
  - Max Capacity & Available Beds
  - Room Photos
       │
       ▼
[Publish Listing] ➔ Status: pending_review (or auto-publish for verified owners)
       │
       ▼
[Manage Inquiries & Viewings] (/owner/inquiries & /owner/messages)
  - Review applicant profile & preferred move-in date
  - Chat in real-time
  - Accept viewing requests
  - Mark rooms as Occupied / Update vacancy count
```

### 3.3 Admin Journey
```
[Admin Authentication] (/admin)
       │
       ├──► [Listings Moderation Queue] (/admin/listings)
       │      - Review photo legitimacy & accurate Butuan location
       │      - Verify minimum safety standards (fire exit, permits)
       │      - Approve (published) or Reject with feedback
       │
       ├──► [User & Owner Verification] (/admin/users)
       │      - Review landlord IDs & issue Verified Landlord badge
       │
       └──► [Dispute & Report Management] (/admin/reports)
              - Review scam, harassment, or inaccurate price reports
              - Archive listing or suspend accounts
```

---

## 4. Entity Lifecycles & State Transitions

### 4.1 Listing Lifecycle
```
[draft] ────► [pending_review] ────► [published] ────► [archived]
                    │                      │
                    ▼                      ▼
                [rejected]             [suspended]
```
*   `draft`: Incomplete listing being authored by the landlord.
*   `pending_review`: Submitted for admin safety and locality verification.
*   `published`: Publicly visible in the marketplace and searchable on the map.
*   `rejected`: Does not meet standards; feedback returned to owner.
*   `archived`: Deactivated by owner (e.g. fully booked or undergoing renovation).
*   `suspended`: Removed by admin due to violations or reports.

### 4.2 Inquiry Lifecycle
```
[new] ────► [replied] ────► [viewing_requested] ────► [viewing_scheduled] ────► [closed]
```
*   `new`: Inquiry sent by seeker with initial question and target move-in date.
*   `replied`: Landlord sent response; active conversation thread created.
*   `viewing_requested`: Seeker requested a specific date/time to visit.
*   `viewing_scheduled`: Landlord accepted the appointment.
*   `closed`: Seeker moved in, or inquiry expired/cancelled.

---

## 5. Database Schema & Relational Specifications

Database authority is **Supabase PostgreSQL** with **PostGIS** spatial extensions.

```
                    ┌─────────────────────────┐
                    │      auth.users         │ (Clerk sub)
                    └────────────┬────────────┘
                                 │ 1:1
                    ┌────────────▼────────────┐
                    │    public.profiles      │
                    └────────────┬────────────┘
                                 │ 1:N
                    ┌────────────▼────────────┐
                    │ public.boarding_houses  │
                    └──────┬────────────┬─────┘
                           │ 1:N        │ 1:N
            ┌──────────────▼──────┐   ┌─▼──────────────────────┐
            │    public.rooms     │   │ public.property_photos │
            └──────┬──────────────┘   └────────────────────────┘
                   │ 1:N
   ┌───────────────┴───────────────┐
   │ 1:N                           │ 1:N
┌──▼──────────────────┐   ┌────────▼──────────────┐
│  public.inquiries   │   │   public.favorites    │
└──┬──────────────────┘   └───────────────────────┘
   │ 1:1
┌──▼──────────────────┐
│public.conversations │
└──┬──────────────────┘
   │ 1:N
┌──▼──────────────────┐
│   public.messages   │
└─────────────────────┘
```

### Table Definitions:

```sql
-- 1. PROFILES
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY, -- Clerk User ID ('user_xxx')
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('seeker', 'owner', 'admin')) DEFAULT 'seeker',
  avatar_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BOARDING HOUSES
CREATE TABLE public.boarding_houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  barangay TEXT NOT NULL, -- e.g. 'Libertad', 'Ampayon', 'Villa Kananga'
  city TEXT NOT NULL DEFAULT 'Butuan City',
  province TEXT NOT NULL DEFAULT 'Agusan del Norte',
  postal_code TEXT DEFAULT '8600',
  location GEOGRAPHY(Point, 4326), -- PostGIS WGS84 coordinates
  gender_restriction TEXT NOT NULL CHECK (gender_restriction IN ('male_only', 'female_only', 'coed')),
  curfew_policy TEXT,
  visitor_policy TEXT,
  amenities TEXT[] DEFAULT '{}', -- e.g. ['wifi', 'water_submeter', 'electric_submeter', 'cctv', 'study_lounge']
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'archived', 'suspended')) DEFAULT 'published',
  featured BOOLEAN NOT NULL DEFAULT false,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ROOMS
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL, -- e.g. 'Unit 101', 'Room 2B'
  room_type TEXT NOT NULL CHECK (room_type IN ('solo', 'shared', 'bedspace')),
  capacity INTEGER NOT NULL CHECK (capacity >= 1),
  available_beds INTEGER NOT NULL CHECK (available_beds >= 0),
  monthly_rent NUMERIC(10, 2) NOT NULL CHECK (monthly_rent > 0), -- Stored in PHP
  security_deposit NUMERIC(10, 2) DEFAULT 0.00,
  is_available BOOLEAN NOT NULL DEFAULT true,
  floor_level INTEGER DEFAULT 1,
  features TEXT[] DEFAULT '{}', -- e.g. ['aircon', 'own_cr', 'balcony', 'table_chair']
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_available_not_exceed_capacity CHECK (available_beds <= capacity)
);

-- 4. PROPERTY PHOTOS
CREATE TABLE public.property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  caption TEXT,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. FAVORITES
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, boarding_house_id)
);

-- 6. INQUIRIES
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  target_move_in DATE,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'replied', 'viewing_requested', 'viewing_scheduled', 'closed')) DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. CONVERSATIONS & MESSAGES
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID UNIQUE REFERENCES public.inquiries(id) ON DELETE CASCADE,
  seeker_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  boarding_house_id UUID NOT NULL REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. REPORTS
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  boarding_house_id UUID REFERENCES public.boarding_houses(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 6. Row Level Security (RLS) Protocol

All queries and mutations execute with RLS enabled. The Clerk sub claim bridges the identity:

```sql
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE sql STABLE;
```

### Policies:
1. **`boarding_houses`**:
   * *Public Select*: `USING (status = 'published')`
   * *Owner Select*: `USING (owner_id = requesting_user_id())`
   * *Owner Insert/Update/Delete*: `WITH CHECK (owner_id = requesting_user_id())`
2. **`rooms`**:
   * *Public Select*: `USING (EXISTS (SELECT 1 FROM boarding_houses bh WHERE bh.id = rooms.boarding_house_id AND (bh.status = 'published' OR bh.owner_id = requesting_user_id())))`
   * *Owner Mutation*: `USING (EXISTS (SELECT 1 FROM boarding_houses bh WHERE bh.id = rooms.boarding_house_id AND bh.owner_id = requesting_user_id()))`
3. **`favorites`**:
   * *Seeker All*: `USING (user_id = requesting_user_id())`
4. **`inquiries`**:
   * *Seeker / Owner Select*: `USING (seeker_id = requesting_user_id() OR EXISTS (SELECT 1 FROM boarding_houses bh WHERE bh.id = inquiries.boarding_house_id AND bh.owner_id = requesting_user_id()))`
   * *Seeker Insert*: `WITH CHECK (seeker_id = requesting_user_id())`
5. **`conversations` & `messages`**:
   * *Participant Select*: `USING (seeker_id = requesting_user_id() OR owner_id = requesting_user_id())`
   * *Sender Message Insert*: `WITH CHECK (sender_id = requesting_user_id())`

---

## 7. Butuan City Localization

### 7.1 Anchor Campuses & Spatial Proximity
*   **Father Saturnino Urios University (FSUU)**:
    *   *Main Campus*: San Francisco St / JC Aquino Ave, Butuan Downtown
    *   *Morelos Campus*: Libertad, Butuan City
*   **Caraga State University (CSU)**:
    *   *Main Campus*: Ampayon, Butuan City (Key transit hub: R-2 / Ampayon routes)
*   **Saint Joseph Institute of Technology (SJIT)**:
    *   Corner Montilla Blvd & Rosales St, Butuan City
*   **Butuan Doctors' College (BDC)**:
    *   JC Aquino Ave, Bayanihan, Butuan City
*   **Agusan Colleges, Inc. (ACI)**:
    *   P. Burgos St, Butuan City

### 7.2 Primary Barangays for Student Housing
*   *Downtown Core*: Dagohoy, Rajah Humabon, San Ignacio, Holy Redeemer, Imadejas, Bayanihan
*   *Western Corridor*: Libertad, Villa Kananga, Bancasi (near Airport)
*   *Eastern Corridor*: Ampayon (CSU student hub), Baan, Taguibo
*   *Southern Corridor*: Doongan, San Vicente, Ambago

### 7.3 Currency & Nomenclature
*   All prices displayed in **Philippine Pesos (PHP / ₱)**: e.g., `₱1,800/mo` for bedspaces, `₱3,500/mo` for solo aircon rooms.
*   Terms: `Boarding House`, `Dormitory`, `Pad / Studio`, `Bedspace`, `Sub-metered electricity`, `Shared CR`.

---

## 8. Target Route Architecture

```
Public Marketplace:
  /                               Landing page, campus quick-filters, search bar
  /listings                       Marketplace directory (grid/list with filters & map)
  /listings/[id]                  Boarding house presentation, room directory, inquiry form

Authentication:
  /sign-in                        Clerk sign-in modal/page
  /sign-up                        Clerk sign-up modal/page

Seeker Space:
  /dashboard                      Seeker dashboard summary
  /dashboard/favorites            Bookmarked boarding houses & rooms
  /dashboard/inquiries            Status of sent inquiries & viewing schedule
  /dashboard/messages             Direct chat threads with landlords

Owner Portal:
  /owner                          Landlord metrics (vacancies, inquiry volume)
  /owner/properties               Owned properties directory
  /owner/properties/new           Multi-step property registration wizard
  /owner/properties/[id]          Property management & room listing
  /owner/properties/[id]/edit     Update photos, description, policies
  /owner/properties/[id]/rooms    Add/modify rooms, pricing, vacancy status
  /owner/inquiries                Review incoming leads & viewing requests
  /owner/messages                 Chat threads with prospective boarders

Admin Portal:
  /admin                          System overview & moderation dashboard
  /admin/listings                 Property verification & moderation queue
  /admin/users                    Owner ID review & user management
  /admin/reports                  Dispute, spam, and safety report triage
```

---

## 9. Phased Implementation Scope

### Phase 1: Foundation Architecture & Specifications (CURRENT)
- [x] Install project-level official Agent Skills (`shadcn`, `clerk`, `supabase`, `supabase-postgres-best-practices`, `web-design-guidelines`).
- [x] Create Pabulong Master Skill (`.agents/skills/pabulong/SKILL.md`).
- [x] Author canonical Product Specification (`docs/PABULONG_PRODUCT_SPEC.md`).
- [x] Audit current codebase and safely classify legacy features (Second Brain, Placement Kanban).
- [x] Pass all quality gates (`npm run lint`, `npx tsc --noEmit`, `npm run build`).

### Phase 2: Marketplace Data Layer & Additive Schema (NEXT)
- Create migration for normalized marketplace tables (`profiles`, updated `boarding_houses`, `rooms`, `property_photos`, `favorites`, `inquiries`, `conversations`, `messages`, `reports`).
- Populate seed data localized for Butuan City (FSUU, CSU Ampayon, Libertad, Villa Kananga).
- Implement Server Actions for public listing queries and PostGIS nearby filtering around Butuan campuses.

### Phase 3: Seeker Discovery & Listing Interface
- Public marketplace directory (`/listings`) with filter sidebar (Barangay, Campus, Budget slider, Gender preference).
- Rich Listing Detail Page (`/listings/[id]`) with image gallery, room comparison table, house rules, and PostGIS map drawer.
- Seeker favorites and inquiry submission.

### Phase 4: Landlord Portal (`/owner/*`)
- Owner property creation wizard (`/owner/properties/new`).
- Multi-room manager (edit rates in PHP, update vacancy counts).
- Inquiry management and viewing coordinator.

### Phase 5: Messaging & Admin Moderation (`/admin/*`)
- Realtime chat between seekers and landlords.
- Admin review dashboard for pending listings and user reports.

### Deferred Scope (Out of Scope for Marketplace Foundation):
- **Stripe Escrow Payments**: Deferred until rental volume justifies local payment gateway integration (e.g. Maya / GCash).
- **OpenAI Automated Semantic Embedding**: Deferred; deterministic PostGIS spatial + structured filtering is prioritized.
