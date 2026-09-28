# Pabulong Production Deployment & Operations Guide

This guide provides end-to-end operational instructions for deploying the **Pabulong Unified Second Brain & Boarding House Placement Platform** to production using Supabase Cloud, Clerk Authentication, and Vercel.

---

## 1. Supabase Cloud Database & Extensions Setup

### 1.1 Create Supabase Project
1. Log in to [supabase.com](https://supabase.com) and create a new project.
2. Select your closest hosting region and record your database password.

### 1.2 Run SQL Migrations
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Copy and paste the entire contents of [`supabase_schema.sql`](./supabase_schema.sql).
3. Click **Run**.
4. The script activates:
   - **`postgis`**: PostGIS geometric types (`GEOMETRY(Point, 4326)`) and spatial indexing (`GIST(location)`).
   - **`vector`**: `pgvector` extension supporting 1536-dimensional embeddings.
   - **`uuid-ossp`**: Native UUID generators.
   - **Tables**: `notes`, `boarding_houses`, `rooms`, and `placements`.
   - **Stored Procedures**:
     - `match_notes`: Fast cosine similarity lookup using the `<=>` distance operator.
     - `nearby_boarding_houses`: Radial spatial query calculating distance in meters using `ST_DWithin` and `ST_Distance`.
   - **Row Level Security (RLS)**: Cryptographically verified access using `public.requesting_user_id()`.

---

## 2. Clerk Authentication & Supabase JWT Integration

### 2.1 Configure Supabase JWT Template in Clerk
1. In your [Clerk Dashboard](https://dashboard.clerk.com), navigate to **Configure** ➔ **JWT Templates**.
2. Click **New Template** and select the **Supabase** template.
3. Keep the template name as `supabase`.
4. Ensure the token claims include:
   ```json
   {
     "aud": "authenticated",
     "role": "authenticated",
     "sub": "{{user.id}}"
   }
   ```
5. Copy the **Signing Key** from the bottom of the template page.

### 2.2 Paste JWT Secret into Supabase
1. In your Supabase Dashboard, navigate to **Project Settings** ➔ **API** ➔ **JWT Settings**.
2. Paste the Clerk signing key into the **JWT Secret** field and save.
3. Supabase will now decode Clerk session tokens and enforce RLS policies based on `auth.jwt() ->> 'sub'`.

---

## 3. Clerk Webhook Synchronization (Optional Tenant Sync)

To capture user creation events and automatically bootstrap landlord or tenant profiles:
1. In the Clerk Dashboard, go to **Webhooks** ➔ **Add Endpoint**.
2. Set Endpoint URL to: `https://your-production-domain.vercel.app/api/webhooks/clerk`.
3. Subscribe to the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy the **Signing Secret** and configure it as `CLERK_WEBHOOK_SECRET` in your Vercel project environment variables.

---

## 4. Vercel Production Deployment

### 4.1 Required Environment Variables
Configure the following keys in **Vercel Project Settings** ➔ **Environment Variables**:

| Variable Name | Description | Example / Source |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Publishable API Key | `pk_live_...` or `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk Secret API Key | `sk_live_...` or `sk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in route | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up route | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Post sign-in redirect | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Post sign-up redirect | `/dashboard` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret | `eyJhbGciOi...` |
| `OPENAI_API_KEY` | (Optional) Key for live embeddings | `sk-...` |

### 4.2 Automated Deployment with Vercel Git Integration
1. Push your repository to GitHub (`main` branch).
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Select your repository.
4. Set Framework Preset to **Next.js**.
5. Under **Environment Variables**, paste the keys from the table above.
6. Click **Deploy**.

### 4.3 Deploy via Vercel CLI (Alternative)
```bash
npx vercel login
npx vercel link
npx vercel --prod
```

---

## 5. Security & Verification Checklist

- [x] **Zero-Trust SQL RLS**: Supabase tables reject unauthorized selects and mutations if the user ID does not match the token's `sub` claim.
- [x] **Next.js Middleware Guard**: Route matcher in `src/middleware.ts` guards `/dashboard` and `/api` endpoints against unauthenticated access.
- [x] **Production Security Headers**: Configured in `vercel.json` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`).
- [x] **Zero TypeScript Errors**: Strict compilation verified via `npx tsc --noEmit`.
- [x] **Automated CI/CD**: GitHub Actions pipeline runs lint, typecheck, and build on every push to `main`.
