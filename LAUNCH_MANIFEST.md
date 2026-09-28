# Pabulong Platform Production Launch Manifest

This launch manifest specifies the exact execution commands, database seeding protocols, end-to-end testing sequences, and production deployment instructions to bring the **Pabulong Unified Second Brain & Boarding House Placement Platform** live on Vercel and Supabase.

---

## 1. Pre-Flight Verification & Health Check

Run the following checks locally to verify that the codebase is completely clean of lint, type, and build issues:

```bash
# 1. Run ESLint across all routes, actions, and components
npm run lint

# 2. Run TypeScript strict typecheck
npx tsc --noEmit

# 3. Execute optimized production build
npm run build
```

Expected output:
- **Lint**: `0 errors`
- **TypeScript**: `0 errors`
- **Build**: `Compiled successfully` with all 11 static, server, and dynamic routes prerendered.

---

## 2. Playwright E2E Test Suite Execution

The repository is configured with Playwright automated tests verifying the critical user journeys across desktop and mobile PWA viewports:

| Test Suite | Spec File | Coverage Highlights |
|---|---|---|
| **Second Brain AI** | [`e2e/second-brain.spec.ts`](./e2e/second-brain.spec.ts) | Note creation dialog, GIN tag pill filters, AI vector semantic similarity `% Match` score badges. |
| **Placement Kanban** | [`e2e/placement-kanban.spec.ts`](./e2e/placement-kanban.spec.ts) | 4-stage pipeline verification, client intake modal, room matching, Stripe Escrow Deposit modal. |
| **PostGIS Spatial Map** | [`e2e/properties-map.spec.ts`](./e2e/properties-map.spec.ts) | Distance rings (150m, 300m, 450m), bidirectional card-to-map hover sync, split map toggle. |

### Run Automated E2E Tests:
```bash
# Run all tests headlessly
npx playwright test

# Run tests with interactive UI mode
npx playwright test --ui

# View generated test report
npx playwright show-report
```

---

## 3. Production Supabase Migration & Database Seeding

### 3.1 Execute Database Schema
1. Open your Supabase Dashboard ➔ **SQL Editor**.
2. Run the complete SQL migration script from [`supabase_schema.sql`](./supabase_schema.sql).
3. Confirm that `postgis`, `vector`, and `uuid-ossp` extensions are active.

### 3.2 Execute Database Seeder
The seeder populates **5 Verified Boarding Houses**, **12 Room Units**, **8 Placement Candidates**, and **10 Vector-embedded Notes**:

```bash
# Populate live database using Supabase credentials
npm run db:seed
```

---

## 4. Production Deployment to Vercel

### Step 1: Install Vercel CLI & Authenticate
```bash
npm install -g vercel
npx vercel login
```

### Step 2: Link Project to Vercel
```bash
npx vercel link
```

### Step 3: Configure Environment Variables
Copy and paste the keys specified in [`vercel-env.txt`](./vercel-env.txt) into your Vercel Dashboard or configure them via CLI:

```bash
# Example setting environment variables via Vercel CLI
npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
npx vercel env add CLERK_SECRET_KEY production
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
npx vercel env add STRIPE_WEBHOOK_SECRET production
npx vercel env add NEXT_PUBLIC_APP_URL production
```

### Step 4: Deploy Live to Production
```bash
npx vercel --prod
```

---

## 5. Post-Deployment Verification Checklist

1. **PWA Standalone Audit**: Open the production URL on mobile (iOS Safari / Android Chrome). Tap "Add to Home Screen" and verify standalone splash screen and offline service worker caching.
2. **Stripe Escrow Webhook**: In the Stripe Dashboard, set Webhook URL to `https://your-domain.vercel.app/api/webhooks/stripe` listening to `checkout.session.completed`.
3. **Clerk JWT Sub Claim**: In Clerk Dashboard ➔ JWT Templates, confirm the `supabase` template is configured and signing keys match Supabase JWT secret settings.
4. **PostGIS Radius Validation**: Visit `/dashboard/properties` on production and verify spatial distance calculation relative to campus reference coordinates.
