# SKILLS.md: Pabulong Unified Second Brain & Placement Platform
*Comprehensive Architecture, Design System, Security Protocol, and Operational Manual*

---

## 1. EXECUTIVE OVERVIEW & VALUE PROPOSITION (Product Marketing & Strategy)

### 1.1 Product Vision & Positioning
**Pabulong** is an enterprise-grade, dual-engine platform purpose-built to eliminate operational friction in the off-campus student and young-professional housing market. By combining a **high-throughput Placement Control Center** with an **AI-powered Second Brain knowledge repository**, Pabulong replaces fragmented spreadsheets, disconnected chat threads, and manual paper tenancy logs with a cohesive, real-time operating system.

The platform unifies **spatial intelligence** (PostGIS-backed dorm and transit mapping), **semantic intelligence** (1536-dimensional vector search across lease contracts, room inspection audits, and local policies), and **pipeline automation** (real-time Kanban tracking from inquiry to settlement).

```
                      +-----------------------------------------------+
                      |               PABULONG PLATFORM               |
                      +-----------------------------------------------+
                                      /               \
                                     /                 \
         +-----------------------------+             +-------------------------------+
         |   PLACEMENT CONTROL CENTER  |             |      SECOND BRAIN ENGINE      |
         +-----------------------------+             +-------------------------------+
         | * 4-Stage Kanban Pipeline   |             | * 1536-Dim Vector Embeddings  |
         | * Instant Room Match Engine |             | * Semantic Knowledge Retrieval|
         | * Capacity & Budget Filters |             | * Regulatory & Inspection Logs|
         | * PostGIS Geospatial Radius |             | * Inverted GIN Indexing       |
         +-----------------------------+             +-------------------------------+
                                     \                 /
                                      \               /
                      +-----------------------------------------------+
                      |        ZERO-TRUST IDENTITY & DATA FABRIC       |
                      | Clerk JWT Sub Claim  <-> Supabase PostgreSQL  |
                      +-----------------------------------------------+
```

---

### 1.2 Target Personas & Core Use Cases

| Persona | Primary Challenges Solved | Core Platform Workflows | Measurable ROI / Value |
|---|---|---|---|
| **Placement Agents & Dorm Coordinators** | Manual lead tracking across chats, double-booking rooms, disjointed tenant preference matching. | Drives candidate pipeline on the Kanban board (`Inquiry` ➔ `Viewing` ➔ `Deposit Pending` ➔ `Placed`), matches clients to rooms under their budget constraints in 1 click. | 70% reduction in lead-to-lease cycle; zero duplicate allocations. |
| **Boarding House Owners & Landlords** | Managing room occupancy, handling tenant gender policies, publishing accurate vacancies, enforcing contracts. | Lists properties with PostGIS geographic coordinates, configures room capacity, tracks occupied vs. available inventory, accesses lease templates in Second Brain. | Maximize room utilization, lower vacancy durations to under 5 days. |
| **Student & Professional Boarders** | Inaccurate rental costs, predatory deposits, distant locations, lack of transparency regarding room rules and amenities. | Filter by monthly budget, verify gender restrictions and amenities (aircon, ensuite bath, fiber Wi-Fi), review standardized house rules. | Guaranteed verified housing matching commute and budgetary needs. |
| **Institutional Knowledge Workers** | Dispersed municipal ordinances, fire safety protocols, inspection checklists, landlord contract terms. | Tag, search, and semantically query knowledge notes using high-dimensional cosine similarity embeddings via `match_notes()`. | Instant answers to legal, zoning, and safety compliance questions. |

---

### 1.3 Key Competitive Advantages & Unique Selling Propositions (USPs)

1. **Context-Aware Semantic Matching**: Unlike standard rental listing boards that rely on rigid keyword lookups, Pabulong couples OpenAI/pgvector embeddings with structured metadata. Operators can query *"boarding houses with backup power for late-night computer science study"* and retrieve matching dorm notes and room listings.
2. **Integrated Geodesic Proximity Engine**: Powered by PostGIS `ST_DWithin` and `ST_Distance`, Pabulong calculates exact walking/transit distance from university campus gates rather than relying on crude city-level filtering.
3. **Frictionless Candidate Pipeline**: A Kanban board designed for placement officers. Transitioning a student from viewing to placed updates inventory availability across the entire housing directory.
4. **Zero-Trust Multi-Tenant Isolation**: RLS policies enforce isolation directly at the database layer using cryptographic Clerk JWT claims (`auth.jwt() ->> 'sub'`).

---

## 2. SYSTEM ARCHITECTURE & TECH STACK SKILLS (Senior Software Architect)

### 2.1 Technology Stack Matrix

```
[Client Tier]              Next.js 15 App Router (React 19, TypeScript 5)
                            ├── Tailwind CSS 3.4 (Tailored HSL Design Tokens)
                            ├── Radix UI Primitives (shadcn/ui accessible components)
                            └── Lucide React Iconography

[Application Tier]         Server Actions ('use server') & Route Handlers
                            ├── Clerk Middleware Engine (clerkMiddleware)
                            ├── Next Cache Invalidation (revalidatePath)
                            └── Shared Domain Types & Constants (src/lib/placement-types.ts)

[Security & Auth Tier]     Clerk Authentication
                            ├── Cryptographic RS256/ES256 Session JWTs
                            └── Supabase JWT Template Mapping ('sub' claim integration)

[Data & Persistence Tier]  Supabase Cloud (PostgreSQL 15+)
                            ├── PostGIS (Geospatial coordinates & distance calculations)
                            ├── pgvector (1536-dimensional vector embedding search)
                            └── Row Level Security (RLS) Kernel with requesting_user_id()
```

---

### 2.2 Data Flow Architecture & Server Action Boundaries

```
[Browser Client: Next.js 'use client']
   │
   │ 1. User triggers action (e.g., handleCreateInquiry, handleMatchRoom)
   │
   ▼
[Next.js Server Actions: 'use server' in src/app/actions/]
   │
   │ 2. Extracts caller credentials & validates payload
   │ 3. Instantiates Supabase Server Client (src/lib/supabase/server.ts)
   │    via @supabase/ssr with Next.js cookieStore headers
   │
   ▼
[Supabase SSR Client: createServerClient]
   │
   │ 4. Passes bearer token with Clerk JWT claim ('sub')
   │
   ▼
[PostgreSQL Database: supabase_schema.sql]
   │
   ├── RLS Policy Evaluation: USING (user_id = public.requesting_user_id())
   ├── PostGIS Spatial Computation: ST_Distance / ST_DWithin
   └── Vector Similarity Matching: 1 - (embedding <=> query_embedding)
   │
   ▼
[Response Revalidation]
   │
   │ 5. revalidatePath('/dashboard/placements') triggers Next.js cache refresh
   │ 6. Strongly-typed JSON payload returned to Client Component
   │
   ▼
[Client UI State Updates] (Optimistic updates + state reconciliation)
```

#### Server Action Architectural Rule
In Next.js App Router, any file marked with `"use server"` must **strictly export async functions**. Exporting JavaScript arrays, objects, or non-function constants across the client/server boundary throws runtime boundary serialization errors (`TypeError: A.map is not a function`).
* **Rule**: Place all shared constants (e.g. `AVAILABLE_ROOMS`), enums, and TypeScript interfaces into independent modules such as [`src/lib/placement-types.ts`](file:///c:/Users/USER/Desktop/PABULONG/src/lib/placement-types.ts) or [`src/lib/types.ts`](file:///c:/Users/USER/Desktop/PABULONG/src/lib/types.ts), importing them into both Server Actions and Client Components.

---

### 2.3 Database Relationship Modeling (`supabase_schema.sql`)

```
 +----------------------------------+            +----------------------------------+
 |           public.notes           |            |      public.boarding_houses      |
 +----------------------------------+            +----------------------------------+
 | id: UUID (PK, gen_random_uuid()) |            | id: UUID (PK, gen_random_uuid()) |
 | user_id: TEXT (Clerk sub) [IDX]  |            | owner_id: TEXT (Clerk sub) [IDX] |
 | title: TEXT                      |            | name: TEXT                       |
 | content: TEXT                    |            | description: TEXT                |
 | tags: TEXT[] [GIN IDX]           |            | address: TEXT                    |
 | embedding: VECTOR(1536)          |            | location: GEOMETRY(Point, 4326)  |
 | created_at: TIMESTAMPTZ          |            | amenities: TEXT[]                |
 | updated_at: TIMESTAMPTZ          |            | rules: TEXT[]                    |
 +----------------------------------+            | contact_email: TEXT              |
                                                 | contact_phone: TEXT              |
                                                 | created_at / updated_at          |
                                                 +----------------------------------+
                                                                  │ 1
                                                                  │
                                                                  │ cascades
                                                                  ▼ N
 +----------------------------------+            +----------------------------------+
 |        public.placements         |            |           public.rooms           |
 +----------------------------------+            +----------------------------------+
 | id: UUID (PK, gen_random_uuid()) |            | id: UUID (PK, gen_random_uuid()) |
 | user_id: TEXT (Clerk sub) [IDX]  |            | boarding_house_id: UUID (FK)     |
 | client_name: TEXT                |            | room_number: TEXT                |
 | client_email: TEXT               |            | capacity: INTEGER (min 1)        |
 | client_phone: TEXT               |            | monthly_rent: NUMERIC(10, 2)     |
 | budget_max: NUMERIC(10, 2)       |            | status: 'available'|'occupied'...|
 | preferred_location: TEXT         |            | gender_preference: 'male'|'female'
 | room_id: UUID (FK) ──────────────┼───────────>| features: TEXT[]                 |
 | stage: 'Inquiry'|'Viewing'|...   | [SET NULL] | created_at / updated_at          |
 | notes: TEXT                      |            +----------------------------------+
 | created_at / updated_at          |
 +----------------------------------+
```

---

## 3. UI/UX DESIGN SYSTEM & PATTERNS (UI/UX Principal)

### 3.1 Design System Foundations & Tokens

The platform features an ultra-premium, dark-mode-first aesthetic with calibrated HSL color tokens in [`src/app/globals.css`](file:///c:/Users/USER/Desktop/PABULONG/src/app/globals.css) and [`tailwind.config.ts`](file:///c:/Users/USER/Desktop/PABULONG/tailwind.config.ts).

#### Color Tokens
- **Background**: `hsl(224, 71%, 4%)` (`#030712` deep cosmic slate)
- **Foreground / Text**: `hsl(213, 31%, 91%)` (high-contrast crisp slate)
- **Card / Surface**: `hsl(224, 71%, 7%)` with `border-slate-800/80` and `backdrop-blur-md`
- **Primary Accent**: `hsl(250, 89%, 65%)` (electric indigo / violet gradient)
- **Status Accents**:
  - `Inquiry`: Indigo (`text-indigo-400 bg-indigo-500/10 border-indigo-500/30`)
  - `Viewing`: Amber (`text-amber-400 bg-amber-500/10 border-amber-500/30`)
  - `Deposit Pending`: Blue (`text-blue-400 bg-blue-500/10 border-blue-500/30`)
  - `Placed`: Emerald (`text-emerald-400 bg-emerald-500/10 border-emerald-500/30`)

#### Typography
- Systematic scale: Headings `text-2xl` to `text-4xl font-bold tracking-tight text-white`.
- Numerical metadata, prices, and IDs: Monospace typography (`font-mono text-emerald-400`).
- Body text: `text-sm text-slate-300`, captions `text-xs text-slate-400`.

---

### 3.2 Core Visual Workflows & UX Rules

#### 1. Kanban Placement Board (`src/app/dashboard/placements/page.tsx`)
- **Visual Scaffolding**: 4-column responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).
- **Interactive Controls**: Each candidate card provides bidirectional stage advancement buttons (`ArrowLeft` and `ArrowRight`) to smoothly move records without clunky page reloads.
- **Budget Highlighting**: Prominent `${item.budget_max}/mo` badge allows agents to identify high-priority or budget-constrained boarders immediately.
- **Room Assignment Flow**: Unmatched candidates feature a dashed button (`Match to Room`). Clicking opens a modal comparing candidate budget against verified room inventory. Rooms within budget display in emerald; rooms exceeding budget show alert badges.

#### 2. Second Brain Knowledge Explorer (`src/app/dashboard/notes/page.tsx`)
- **Multi-Modal Retrieval**: Live keyword search across note title/content, GIN tag pills for one-click tag filtering, and a Vector Query bar for semantic similarity retrieval.
- **Card Hierarchy**: Displays note title, tags as rounded pills, creation timestamps, and a copy-to-clipboard action.
- **Responsive Dialog**: Modal form allows rapid authoring with real-time tag tokenization.

#### 3. Accessibility & Interaction Standards (a11y)
- All interactive triggers use accessible Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`).
- ARIA labeling, focus rings (`focus-visible:ring-2 focus-visible:ring-indigo-500`), and keyboard dismissability (`Escape` key closes all sheets and dialogs).

---

## 4. SECURITY, PRIVACY & COMPLIANCE ARCHITECTURE (Chief Security Officer)

### 4.1 Zero-Trust Authentication & Row Level Security (RLS)

Pabulong enforces security at the data layer rather than relying on application code alone:

```
[Incoming Request]
       │
       ▼
[Next.js Middleware: src/middleware.ts]
       │
       ├── Protects /dashboard/(.*) and /api/(.*) via clerkMiddleware()
       └── Passes validated session claims downstream
       │
       ▼
[Supabase RLS Engine: supabase_schema.sql]
       │
       ├── Calls public.requesting_user_id()
       │   SELECT coalesce(
       │       nullif(current_setting('request.jwt.claim.sub', true), ''),
       │       (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
       │   );
       │
       ▼
[Table Security Policies]
       ├── notes: USING (user_id = public.requesting_user_id())
       ├── boarding_houses: USING (owner_id = public.requesting_user_id()) [mutation]
       │                    USING (true) [SELECT for authenticated search]
       ├── rooms: USING (EXISTS in boarding_houses where owner_id = requesting_user_id)
       └── placements: USING (user_id = public.requesting_user_id())
```

### 4.2 Data Protection & PII Standards

1. **Personally Identifiable Information (PII)**:
   - Tenant names, email addresses, and phone numbers in `public.placements` are protected by strict RLS. Placement coordinators cannot view or query placements managed by competing agencies.
2. **Encrypted In-Transit & At-Rest**:
   - All client-to-server traffic is TLS 1.3 encrypted. Supabase databases enforce AES-256 storage encryption at rest.
3. **OWASP Top 10 Protections**:
   - **SQL Injection Prevention**: All queries use parameterized Supabase PostgREST client methods or Postgres prepared statements. No raw string interpolation is permitted.
   - **Cross-Site Scripting (XSS)**: React 19 JSX engine escapes all text expressions by default.
   - **Broken Access Control**: Guarded at the edge via `src/middleware.ts` and guaranteed at the database via Postgres RLS.
   - **Sensitive Data Exposure**: Service role keys (`SUPABASE_SERVICE_ROLE_KEY`) are kept on the server only and never exposed with the `NEXT_PUBLIC_` prefix.

---

## 5. AGENT SKILLS & OPERATIONAL MANUAL (Antigravity & Developer Guide)

### 5.1 Local Development Quickstart

```bash
# 1. Clone repository and navigate to root
cd c:\Users\USER\Desktop\PABULONG

# 2. Install dependencies (Node.js 20+ required)
npm install

# 3. Configure environment variables
# Copy .env.example to .env.local and update keys
cp .env.example .env.local

# 4. Run the development server
npm run dev
# Server boots at http://localhost:3000

# 5. Execute production build and typecheck
npm run build
```

---

### 5.2 Required Environment Variables (`.env.local`)

```env
# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... # Must be valid base64 dev format
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase Database & API Keys
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# OpenAI Embedding Key (Optional for live embeddings generation)
OPENAI_API_KEY=sk-...
```

---

### 5.3 Database Migration Execution Protocol

1. Open your Supabase Project Dashboard and navigate to the **SQL Editor**.
2. Open [`supabase_schema.sql`](file:///c:/Users/USER/Desktop/PABULONG/supabase_schema.sql).
3. Paste the complete script and click **Run**.
4. Configure Clerk JWT Template:
   - Go to **Clerk Dashboard** ➔ **JWT Templates** ➔ **New Template** ➔ **Supabase**.
   - Set template name to `supabase` and add the claim:
     ```json
     {
       "aud": "authenticated",
       "role": "authenticated",
       "sub": "{{user.id}}"
     }
     ```
   - Copy the Clerk Signing Key and paste it into **Supabase Dashboard** ➔ **Project Settings** ➔ **API** ➔ **JWT Settings**.

---

### 5.4 Directory Structure Guidelines for Future Agents

```
c:\Users\USER\Desktop\PABULONG\
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD typechecking, linting, and Vercel pipeline
├── public/                       # Static public assets
├── src/
│   ├── app/
│   │   ├── actions/              # Next.js Server Actions ('use server' only!)
│   │   │   ├── notes.ts          # Note creation & semantic search actions
│   │   │   └── placements.ts     # Kanban placement stage mutations & matching
│   │   ├── dashboard/            # Protected Dashboard Shell
│   │   │   ├── layout.tsx        # Responsive sidebar, navigation, UserButton
│   │   │   ├── page.tsx          # Dashboard overview & analytics widgets
│   │   │   ├── notes/page.tsx    # Second Brain notes interface
│   │   │   └── placements/page.tsx# Placement Control Center Kanban board
│   │   ├── globals.css           # Tailwind custom utilities & HSL tokens
│   │   ├── layout.tsx            # Root layout with <ClerkProvider>
│   │   └── page.tsx              # Public landing page with hero & features
│   ├── components/
│   │   └── ui/                   # shadcn/ui accessible components (Radix UI)
│   ├── lib/
│   │   ├── placement-types.ts    # Shared data types & constants (No 'use server')
│   │   ├── utils.ts              # cn() clsx & twMerge helper
│   │   └── supabase/
│   │       ├── client.ts         # Browser client (@supabase/ssr createBrowserClient)
│   │       └── server.ts         # Server client (@supabase/ssr createServerClient)
│   └── middleware.ts             # Clerk route protection engine
├── DEPLOYMENT.md                 # Production deployment & Vercel manual
├── SKILLS.md                     # Architecture, Design System & Operational manual
├── supabase_schema.sql           # PostGIS, pgvector, and RLS database schema
└── tailwind.config.ts            # Tailwind CSS configuration and theme extensions
```

---

### 5.5 Coding Conventions & Best Practices for AI Agents

1. **Strict TypeScript Typing**:
   - Avoid `any` at all costs. Utilize `unknown` with `err instanceof Error` narrowing in `catch` blocks.
   - Use `Parameters<typeof fn>[index]` or concrete interface types for third-party library signatures.
2. **React 19 & Next.js 15 Effect Rules**:
   - Do **NOT** invoke synchronous `setState()` calls directly at the top level of a `useEffect` callback (violates `react-hooks/set-state-in-effect`).
   - Use `startTransition()` or asynchronous `.then()` resolution to update state based on external queries.
3. **Server Action Purity**:
   - Keep `"use server"` files limited to async server functions. Place all constants, arrays, and interfaces in shared modules outside `"use server"`.
4. **Fallback Mock Data Pattern**:
   - All server actions must provide graceful mock fallbacks (e.g. `DEFAULT_MOCK_NOTES`, `AVAILABLE_ROOMS`) so the frontend compiles and renders seamlessly during development or testing before live database keys are provisioned.
