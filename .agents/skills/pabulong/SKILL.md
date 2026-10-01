---
name: "pabulong-master"
description: "Master orchestration and architectural rulebook for Pabulong — the local Butuan boarding house and dorm marketplace. Enforces multi-role engineering (Principal, Next.js, Postgres, Clerk, Supabase, UX, Accessibility, QA)."
---

# Pabulong Master Engineering & Architecture Skill

> **Target Platform:** Pabulong (`KRONOS345/pabulong`) — Hyper-Local Boarding House & Dorm Marketplace for Butuan City, Philippines.  
> **Authority Level:** Mandatory. Every coding agent must adopt the mindsets, architectural boundaries, security protocols, and UX standards defined in this specification.

---

## 1. Operating Mindsets & Engineering Personas

When working on any file in the Pabulong codebase, you must synthesize the following expert perspectives:

1. **Principal Software Engineer**: Maintain clean abstractions, deterministic data flows, strict type boundaries, and zero code duplication. Enforce unified error propagation and clean separation of concerns.
2. **Senior Next.js/React Engineer**: Maximize React 19 / Next.js 15 App Router capabilities. Leverage Server Actions (`'use server'`) with explicit validation, Server Components for data fetching, Client Components only when browser interactivity/state is required, and prevent request-store runtime exceptions.
3. **Database Architect**: Model normalized, referentially intact relational schemas in PostgreSQL. Design explicit foreign keys, `ON DELETE` rules, indexes for filter patterns, and PostGIS spatial geography columns for local map routing.
4. **Supabase & RLS Security Engineer**: Apply defense-in-depth with Row Level Security (RLS). Every query/mutation executed on behalf of a user must resolve through `requesting_user_id()` matching the Clerk JWT `sub` claim. Public endpoints must NEVER leak private owner or seeker data.
5. **Clerk Authentication Engineer**: Treat Clerk as the single source of authentication truth. Never trust client-submitted roles or user IDs. Synchronize roles authoritatively via metadata and server actions.
6. **UI/UX Product Designer**: Build a delightful, intuitive, modern marketplace experience tailored to university students, young professionals, and local landlords in Butuan. Never build an austere admin dashboard when consumer marketplace polish is expected.
7. **Accessibility Engineer**: Guarantee WCAG 2.1 AA compliance. Ensure logical keyboard navigation, discernible focus rings, screen-reader aria attributes, color contrast standards, and touch-target minimums (44x44px).
8. **Marketplace Product Architect**: Understand the dynamics of a two-sided marketplace with administrative governance. Prioritize discovery, photo visibility, upfront pricing, vacancy transparency, and trust signals (verified badges, landmark proximities).
9. **QA/Test Engineer**: Validate changes against automated suites (Playwright E2E, TypeScript `tsc --noEmit`, ESLint). Never consider a task finished without end-to-end verification across both desktop and mobile viewports.
10. **Performance Engineer**: Optimize Core Web Vitals (LCP, INP, CLS). Keep client bundle sizes minimal, leverage Next.js image optimization (`next/image`), and utilize database indexes for queries.

---

## 2. Integrated Official Skills

This master skill orchestrates and delegates to the official local skills located in `.agents/skills/`:

*   **`../shadcn`**: Source of truth for UI component scaffolding, preset configurations, and component composition.
*   **`../clerk`**: Source of truth for Next.js authentication patterns, session tokens, middleware routing, and user metadata.
*   **`../supabase`**: Source of truth for `@supabase/ssr` server/browser clients, Supabase RPC, Storage, and Realtime.
*   **`../supabase-postgres-best-practices`**: Source of truth for schema normalization, migration safety, index efficiency, connection pooling, and RLS policy design.
*   **`../web-design-guidelines`**: Source of truth for web interface ergonomics, touch targets, accessibility, layout stability, and motion.

---

## 3. Product Vision & Role Architecture

Pabulong connects students and young professionals with boarding houses, dormitories, and rooms for rent across Butuan City.

### The 3 Core Roles:

```
                  +-----------------------------------+
                  |             PABULONG              |
                  |     Butuan Housing Marketplace    |
                  +-----------------------------------+
                      /           |               \
                     /            |                \
                    ▼             ▼                 ▼
          +--------------+ +----------------+ +---------------+
          |    SEEKER    | | OWNER/LANDLORD | |     ADMIN     |
          +--------------+ +----------------+ +---------------+
          | Browse,      | | Create houses, | | Verify users, |
          | Filter map,  | | manage rooms,  | | moderate ads, |
          | Favorites,   | | update vacancy,| | audit reports,|
          | Inquire/Chat | | review leads   | | manage system |
          +--------------+ +----------------+ +---------------+
```

1. **SEEKER (Student / Boarder / Young Professional)**:
   * **Journey**: Browse map/listings ➔ Filter (budget, barangay, amenities, gender preference) ➔ View room details ➔ Compare rooms ➔ Save to favorites ➔ Submit inquiry / chat with landlord ➔ Schedule on-site viewing.
   * **Permissions**: Read published listings and rooms; create and manage own favorites; initiate and view own inquiries/messages.
2. **OWNER / LANDLORD (Boarding House Operator)**:
   * **Journey**: Sign up / verify ownership ➔ Register boarding house ➔ Add multiple rooms/units (solo, shared, bedspace) ➔ Upload room photos & amenities ➔ Toggle room availability/vacancies ➔ Receive seeker inquiries ➔ Reply via messaging ➔ Coordinate viewing requests.
   * **Permissions**: Full CRUD over own boarding houses, rooms, and media; read/reply to inquiries directed at own properties; cannot alter other landlords' data.
3. **ADMIN (Platform Moderator / Operations)**:
   * **Journey**: Access `/admin` ➔ Review pending property listings ➔ Verify landlord credentials / house safety ➔ Moderate reports & flagging ➔ Feature verified houses ➔ Archive fraudulent or inactive listings.
   * **Permissions**: System-wide moderation access through server-verified administrative sessions.

---

## 4. UI Architecture — Shadcn First

*   **Sole UI Component System**: `shadcn/ui` is the exclusive UI foundation.
*   **Active Preset Configuration**: Configured in `components.json`:
    *   Style: `base-nova`
    *   Base Color: `neutral`
    *   Tailwind Config: `tailwind.config.ts`
    *   CSS Variables: `true` (HSL color tokens in `src/app/globals.css`)
    *   Icons: `lucide-react`
*   **Strict Component Rule**: Never hand-craft custom replacements for components provided by shadcn:
    *   *Primitives*: `Button`, `Dialog`, `Sheet`, `DropdownMenu`, `Select`, `Input`, `Textarea`, `Tabs`, `Table`, `Popover`, `Tooltip`, `Card`, `Badge`, `Alert`, `Skeleton`, `Separator`, `Avatar`.
    *   *Feedback*: Use `sonner` (`toast.success()`, `toast.error()`) for operation feedback.
    *   *Mobile Primitives*: Use `Sheet` or `Drawer` for slide-over navigation and mobile filter panels.
*   **Tailwind Guidelines**: Use Tailwind utility classes strictly for layout, responsive grid/flex arrangements, and spacing. Never introduce arbitrary hardcoded hex codes (`bg-[#234]`) or inline styles; rely strictly on theme tokens (`bg-background`, `text-primary`, `border-border`, `rounded-md`).

---

## 5. Security & Authorization Protocol

1. **Authority Separation**:
   * **Clerk**: Authentication authority (Session validation, JWT issuance, identity claims).
   * **Supabase**: Data persistence and authorization boundary (Row Level Security).
2. **Identity Derivation**:
   * Every Server Action and Route Handler MUST extract the user identity via Clerk `auth()`:
     ```typescript
     const { userId } = await auth();
     if (!userId) throw new Error("Unauthorized");
     ```
   * Never trust client-provided `owner_id`, `user_id`, or `role` parameters in request payloads.
3. **Database RLS Boundary**:
   * Supabase tables enforce RLS utilizing Clerk's JWT template:
     ```sql
     CREATE OR REPLACE FUNCTION requesting_user_id()
     RETURNS text AS $$
       SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
     $$ LANGUAGE sql STABLE;
     ```
   * *Public Read*: Anyone (including anonymous seekers) can read `published` boarding houses and rooms.
   * *Owner Scoped*: Owners can `INSERT`, `UPDATE`, and `DELETE` only rows where `owner_id = requesting_user_id()`.
   * *Seeker Scoped*: Seekers can access only their own `favorites`, `inquiries`, and messages.
4. **Secret Protection**:
   * `SUPABASE_SERVICE_ROLE_KEY` and `CLERK_SECRET_KEY` must NEVER be prefixed with `NEXT_PUBLIC_` and must NEVER be referenced in client components.
   * The client bundle must contain only public tokens (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

---

## 6. Database Schema & Lifecycle Standards

The domain models a clean normalized entity hierarchy:

```
[profiles]
   ▲
   │ (1 to Many)
[boarding_houses] ─────────────── (1 to Many) ───► [property_photos]
   │
   │ (1 to Many)
[rooms] ◄───────────────────────── (Optional 1 to 1) ─── [inquiries]
   ▲                                                        │
   │                                                        ▼
[favorites]                                           [conversations]
                                                            │
                                                            ▼
                                                       [messages]
```

### Core Entities:
1. `profiles`: `id` (matches Clerk `userId`), `full_name`, `email`, `phone`, `role` (`seeker`, `owner`, `admin`), `avatar_url`, `is_verified`, `created_at`.
2. `boarding_houses`: `id`, `owner_id`, `name`, `slug`, `description`, `address`, `barangay`, `city` (default `'Butuan City'`), `location` (`geography(Point, 4326)`), `house_rules`, `amenities`, `gender_restriction` (`male_only`, `female_only`, `coed`), `status`, `featured`, `created_at`, `updated_at`.
3. `rooms`: `id`, `boarding_house_id`, `room_number`, `room_type` (`solo`, `shared`, `bedspace`), `capacity`, `available_beds`, `monthly_rent` (in PHP), `security_deposit`, `is_available`, `features`, `photos`, `created_at`.
4. `property_photos`: `id`, `boarding_house_id`, `room_id` (nullable), `url`, `caption`, `is_cover`, `display_order`.
5. `favorites`: `id`, `user_id`, `boarding_house_id`, `created_at`.
6. `inquiries`: `id`, `seeker_id`, `boarding_house_id`, `room_id`, `status`, `move_in_date`, `message`, `created_at`.
7. `conversations`: `id`, `inquiry_id`, `seeker_id`, `owner_id`, `updated_at`.
8. `messages`: `id`, `conversation_id`, `sender_id`, `content`, `is_read`, `created_at`.
9. `reports`: `id`, `reporter_id`, `boarding_house_id`, `reason`, `status`, `created_at`.

### Entity Lifecycles:
*   **Listing Lifecycle**: `draft` ➔ `pending_review` ➔ `published` ➔ `rejected` ➔ `archived`
*   **Inquiry Lifecycle**: `new` ➔ `replied` ➔ `viewing_requested` ➔ `viewing_scheduled` ➔ `closed`

---

## 7. Butuan City Localization Protocol

Pabulong is proudly built for **Butuan City, Agusan del Norte, Philippines**:

*   **Currency & Pricing**:
    *   Always display in Philippine Peso (`₱` or `PHP`). Example: `₱2,500 / month`.
    *   Never use US Dollars (`$`) or foreign notation.
*   **Geographic Hierarchy**:
    *   *Barangays*: Libertad, Ampayon, Villa Kananga, Doongan, San Vicente, Baan, Montilla, Bancasi, Holy Redeemer, etc.
    *   *Anchor Campuses & Landmarks*:
        *   Father Saturnino Urios University (FSUU) - Main & Morelos Campuses
        *   Caraga State University (CSU) - Ampayon
        *   Saint Joseph Institute of Technology (SJIT)
        *   Butuan Doctors' College (BDC)
        *   Agusan Colleges, Inc. (ACI)
        *   Gaisano Mall Butuan / Robinsons Place Butuan
        *   Butuan City Hall / Guingona Park
*   **Local Terminology**:
    *   *Property Types*: `Boarding House`, `Dormitory`, `Bedspace`, `Apartment Pad`
    *   *Room Types*: `Solo Room`, `Shared Room (2-4 pax)`, `Bedspace`
    *   *Commute & Proximity Notes*: Walking distance, 1 tricycle ride, jeepney route (e.g., R-2, Ampayon route), curfew rules, visitor policies, sub-metered water/electricity.
*   **Mock & Contact Data**:
    *   Phone formats must resemble local Philippine numbers: `+63 9XX XXX XXXX` or `09XX-XXX-XXXX`.
    *   No generic US addresses (no "California", no "Main St", no "$500").

---

## 8. Target Route Architecture

```
Public / Seeker Surface:
  /                               Landing page & search portal
  /listings                       Marketplace directory (grid/list with filters)
  /listings/[id]                  Boarding house & room detail page
  /sign-in                        Clerk authentication sign-in
  /sign-up                        Clerk authentication sign-up

Seeker Dashboard:
  /dashboard                      Seeker overview
  /dashboard/favorites            Saved boarding houses & rooms
  /dashboard/inquiries            Sent inquiries & viewing schedule
  /dashboard/messages             Direct chats with landlords

Owner / Landlord Portal:
  /owner                          Landlord command center & occupancy metrics
  /owner/properties               Owned properties directory
  /owner/properties/new           Boarding house creation wizard
  /owner/properties/[id]          Property management & room listing
  /owner/properties/[id]/edit     Edit property metadata
  /owner/properties/[id]/rooms    Room vacancy & rate manager
  /owner/inquiries                Incoming seeker inquiries
  /owner/messages                 Chat threads with prospective tenants

Admin Moderation Portal:
  /admin                          Platform health & moderation queue
  /admin/listings                 Listing approval / verification review
  /admin/users                    Landlord and student directory
  /admin/reports                  User reports & dispute moderation
```

---

## 9. Legacy / Deprecated System Policy

The repository contains pre-reset features:
*   *Second Brain (`src/app/dashboard/notes`)*
*   *Placement Kanban (`src/app/dashboard/placements`)*
*   *Legacy Properties Manager (`src/app/dashboard/properties`)*

**Policy**:
1. **Do not delete legacy files** indiscriminately. They contain working Supabase server connections, PostGIS RPC calls, and test infrastructure.
2. Label these views internally as `[LEGACY / INTERNAL / INCUBATION]`.
3. They must **no longer define Pabulong's public brand or navigation**.
4. Future development phases will gracefully supersede or integrate their battle-tested utilities into the new marketplace routes.

---

## 10. Quality Gates & Validation Contract

Before completing any task, every agent MUST execute and pass:
1. `npm run lint` — Zero ESLint errors or unhandled warnings.
2. `npx tsc --noEmit` — Zero TypeScript compilation issues.
3. `npm run build` — Next.js production build succeeds without prerender crashes.
4. `npm run test:e2e` — Playwright tests pass on both Desktop Chrome and Mobile iPhone 14 viewports.
5. **No git push** until explicitly authorized by the user.
