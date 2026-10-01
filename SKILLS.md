# SKILLS.md: Pabulong Butuan Boarding House & Dorm Marketplace

> **SUPERSEDED / REDIRECT NOTICE:**  
> The canonical and authoritative agent skills are now located under:
> - **Master Orchestration Skill**: [`.agents/skills/pabulong/SKILL.md`](file:///.agents/skills/pabulong/SKILL.md)
> - **Product Specification**: [`docs/PABULONG_PRODUCT_SPEC.md`](file:///docs/PABULONG_PRODUCT_SPEC.md)
> - **Component System Skill**: [`.agents/skills/shadcn/SKILL.md`](file:///.agents/skills/shadcn/SKILL.md)
> - **Authentication Skill**: [`.agents/skills/clerk/SKILL.md`](file:///.agents/skills/clerk/SKILL.md)
> - **Database / Supabase Skills**: [`.agents/skills/supabase/SKILL.md`](file:///.agents/skills/supabase/SKILL.md) and [`.agents/skills/supabase-postgres-best-practices/SKILL.md`](file:///.agents/skills/supabase-postgres-best-practices/SKILL.md)
> - **Design Guidelines Skill**: [`.agents/skills/web-design-guidelines/SKILL.md`](file:///.agents/skills/web-design-guidelines/SKILL.md)

---

## 1. Product Identity

**Pabulong** is a local **boarding-house and dormitory marketplace** specifically designed for **Butuan City, Agusan del Norte, Philippines**.

It supports three distinct user roles:
1. **SEEKER**: Students and young professionals searching, comparing, favoriting, and inquiring about rooms near Butuan colleges and landmarks.
2. **OWNER / LANDLORD**: Boarding house operators creating properties, managing multi-room vacancies, and coordinating with prospective tenants.
3. **ADMIN**: Platform operators reviewing listings, verifying landlords, and moderating reports.

---

## 2. Legacy / Deprecated Features Notice

The existing routes in this repository:
- `src/app/dashboard/notes` (Second Brain / Vector Search)
- `src/app/dashboard/placements` (Placement Kanban / Coordinator Escrow)
- `src/app/dashboard/properties` (Legacy Internal Property Explorer)

Are classified as **`[LEGACY / INTERNAL / INCUBATION]`**.
- They are **retained** to preserve working Supabase server connections, PostGIS RPC verification, and test fixtures.
- They **no longer define the public product identity** of Pabulong.
- Do not build new seeker or owner features on top of the old placement or second brain mental models.

Refer to [`.agents/skills/pabulong/SKILL.md`](file:///.agents/skills/pabulong/SKILL.md) and [`docs/PABULONG_PRODUCT_SPEC.md`](file:///docs/PABULONG_PRODUCT_SPEC.md) for all future implementation phases.
