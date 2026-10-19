-- ========================================================================
-- Pabulong Migration: Prevent Admin Role Escalation (Hardened)
-- File: supabase/migrations/20261019000001_prevent_admin_escalation.sql
-- Enforces multi-tier protection against client self-promotion to admin.
-- Only trusted server-side processes (service_role / postgres) can assign
-- the 'admin' role.
-- ========================================================================

-- 1. DROP EXISTING POLICIES FIRST TO PREVENT DEPENDENCY CONFLICTS ON RERUN
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Clean up any obsolete function overload
DROP FUNCTION IF EXISTS public.is_admin(TEXT);

-- 2. HELPER FUNCTION: NON-RECURSIVE ADMIN VERIFICATION
-- Runs as SECURITY DEFINER STABLE with search_path = '' (empty search path)
-- to completely prevent search path hijacking. All non-system objects are fully schema-qualified.
-- Uses CREATE OR REPLACE so rerunning the migration updates the function in-place.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = public.requesting_user_id() AND role = 'admin'
    );
$$;

ALTER FUNCTION public.is_admin() OWNER TO postgres;
COMMENT ON FUNCTION public.is_admin() IS
'Non-recursive, parameterless helper function to verify if the requesting caller already possesses the admin role.';

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 3. HARDEN RLS INSERT POLICY ON PROFILES
-- Authenticated users can insert their own profile, but only as 'seeker' or 'owner'.
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (
    id = public.requesting_user_id()
    AND role IN ('seeker', 'owner')
);

-- 4. HARDEN RLS UPDATE POLICY ON PROFILES
-- Authenticated users can update their own profile.
-- If the resulting role is 'admin', the user must ALREADY have had the 'admin' role.
-- Ordinary seekers/owners can never escalate to 'admin' via direct client updates.
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = public.requesting_user_id())
WITH CHECK (
    id = public.requesting_user_id()
    AND (
        role IN ('seeker', 'owner')
        OR (role = 'admin' AND public.is_admin())
    )
);

-- 4. DEFENSE-IN-DEPTH TRIGGER: PREVENT PRIVILEGE ESCALATION
-- Declared as standard SECURITY INVOKER with fixed search_path so current_user reflects the actual caller.
CREATE OR REPLACE FUNCTION public.prevent_admin_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_jwt_role TEXT;
BEGIN
    -- In Supabase PostgREST, authenticated web clients run with current_user = 'authenticated'
    -- and request.jwt.claim.role = 'authenticated'.
    -- Privileged connections run as 'postgres' (Supabase SQL Editor / migrations)
    -- or 'service_role' (administrative scripts / backend jobs).

    BEGIN
        v_jwt_role := nullif(current_setting('request.jwt.claim.role', true), '');
    EXCEPTION WHEN OTHERS THEN
        v_jwt_role := NULL;
    END;

    -- Allow privileged execution:
    -- 1. Direct superuser/database owner (postgres, supabase_admin) in SQL Editor (where no client JWT exists)
    -- 2. Supabase administrative service_role connection (API admin client / server scripts)
    IF (current_user IN ('postgres', 'supabase_admin') AND v_jwt_role IS NULL)
       OR current_user = 'service_role'
       OR v_jwt_role = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- Block any client-side insertion of admin role
    IF TG_OP = 'INSERT' AND NEW.role = 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Client cannot assign the admin role upon registration.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Block any client-side escalation from non-admin to admin
    IF TG_OP = 'UPDATE' AND NEW.role = 'admin' AND OLD.role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Client cannot escalate role to admin.'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION public.prevent_admin_role_escalation() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.prevent_admin_role_escalation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_admin_role_escalation() TO authenticated, service_role, postgres;

DROP TRIGGER IF EXISTS trg_prevent_admin_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_admin_role_escalation
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_admin_role_escalation();

COMMENT ON FUNCTION public.prevent_admin_role_escalation() IS
'Enforces that the admin role can only be assigned via trusted server-side scripts or administrative service_role connections.';

-- ========================================================================
-- ROLLBACK INSTRUCTIONS (FOR REFERENCE ONLY)
--
-- SECURITY WARNING:
-- Reverting this migration restores the less-restrictive baseline policies
-- from 20261002000000_marketplace_foundation.sql. Doing so removes the
-- defense-in-depth trigger and allows authenticated clients to update their
-- own role to 'admin' via direct PostgREST calls unless blocked elsewhere.
--
-- To revert this migration if needed:
-- DROP TRIGGER IF EXISTS trg_prevent_admin_role_escalation ON public.profiles;
-- DROP FUNCTION IF EXISTS public.prevent_admin_role_escalation();
-- DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
-- CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = public.requesting_user_id()) WITH CHECK (id = public.requesting_user_id());
-- DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
-- CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = public.requesting_user_id());
-- DROP FUNCTION IF EXISTS public.is_admin();
-- DROP FUNCTION IF EXISTS public.is_admin(TEXT);
-- ========================================================================
