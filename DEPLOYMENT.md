# Production Deployment & Migration Guide: Pabulong Platform

This guide outlines the complete operational roadmap for deploying the **Pabulong Unified Second Brain & Boarding House Placement Platform** to production using Supabase, Clerk, and Vercel.

---

## 1. Supabase Database Migration & Extensions

### Prerequisites:
- A Supabase Project created at [supabase.com](https://supabase.com).

### Step-by-Step SQL Execution:
1. Open your Supabase Dashboard and navigate to the **SQL Editor**.
2. Open the [`supabase_schema.sql`](./supabase_schema.sql) file located in the root of this repository.
3. Paste the contents into the SQL Editor and click **Run**.
4. The script automatically executes the following:
   - Enables **`postgis`** for spatial dorm coordinates (`ST_Point`, `ST_DWithin`, `ST_Distance`).
   - Enables **`vector`** for semantic 1536-dimensional OpenAI embeddings in the Second Brain.
   - Creates the core schema tables: `notes`, `boarding_houses`, `rooms`, and `placements`.
   - Establishes **Row Level Security (RLS)** policies that enforce user isolation via Clerk JWT sub claims (`auth.jwt() ->> 'sub'`).
   - Configures the stored database functions `match_notes` (pgvector cosine similarity) and `nearby_boarding_houses` (geodesic distance search).

---

## 2. Clerk Authentication & Supabase JWT Integration

To allow Supabase RLS to authenticate requests directly from Clerk tokens:

1. Go to your **Clerk Dashboard** > **Configure** > **JWT Templates**.
2. Click **New Template** and select **Supabase**.
3. Name the template `supabase`.
4. Ensure the claims include:
   ```json
   {
     "aud": "authenticated",
     "role": "authenticated",
     "sub": "{{user.id}}"
   }
   ```
5. Copy the **Signing Key** from Clerk and paste it into **Supabase Dashboard** > **Project Settings** > **API** > **JWT Settings**.

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env.local` for local development or configure them in your **Vercel Project Settings**:

| Variable Name | Description | Source |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Publishable API Key | Clerk Dashboard > API Keys |
| `CLERK_SECRET_KEY` | Clerk Secret Key | Clerk Dashboard > API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Route for sign in (`/sign-in`) | Standard config |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Route for sign up (`/sign-up`) | Standard config |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Post sign-in redirect (`/dashboard`) | Standard config |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Post sign-up redirect (`/dashboard`) | Standard config |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | Supabase Dashboard > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Client Key | Supabase Dashboard > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Admin Secret Key | Supabase Dashboard > API |
| `OPENAI_API_KEY` | (Optional) Key for live vector embeddings | OpenAI Platform |

---

## 4. Vercel Deployment Guide

### Option A: Automated Git Push (Recommended)
1. Push your repository to GitHub (`main` branch).
2. Import the repository in [vercel.com](https://vercel.com).
3. Under **Environment Variables**, paste the keys from table above.
4. Set Framework Preset to **Next.js** and click **Deploy**.

### Option B: Vercel CLI
```bash
npx vercel login
npx vercel link
npx vercel --prod
```

---

## 5. Security & Architectural Verification

- **Zero-Trust SQL RLS**: Supabase tables reject unauthorized selects and mutations if the user ID does not match the token's `sub` claim.
- **Middleware Guard**: Next.js App Router route matcher in `src/middleware.ts` guards `/dashboard` and `/api` endpoints against unauthenticated access.
- **Type Safety**: Strictly typed TypeScript data models across database queries, Server Actions, and UI components.
