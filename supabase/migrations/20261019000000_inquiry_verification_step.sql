-- ========================================================================
-- Pabulong Migration: Rental Inquiry & Seeker Verification Step
-- Safe, additive migration adding rental background & inquiry details
-- ========================================================================

-- Add appropriate rental verification columns to public.inquiries
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS stay_duration TEXT,
  ADD COLUMN IF NOT EXISTS occupant_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS seeker_notes TEXT,
  ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false;

-- Document column semantics and privacy boundaries
COMMENT ON COLUMN public.inquiries.full_name IS 'Full legal or preferred name provided by seeker for landlord identity verification';
COMMENT ON COLUMN public.inquiries.contact_phone IS 'Primary phone or mobile contact for viewing and rental coordination';
COMMENT ON COLUMN public.inquiries.contact_email IS 'Email address for formal lease correspondence';
COMMENT ON COLUMN public.inquiries.stay_duration IS 'Expected duration of rental stay (e.g. 1 Semester, 1 Academic Year, Short-term)';
COMMENT ON COLUMN public.inquiries.occupant_count IS 'Total intended occupants for the requested room or unit';
COMMENT ON COLUMN public.inquiries.seeker_notes IS 'Optional student/renter profile information (e.g. university, year level, habits)';
COMMENT ON COLUMN public.inquiries.consent_given IS 'Explicit user consent to share verification details with the property owner';

-- Performance index for owner lead querying
CREATE INDEX IF NOT EXISTS idx_inquiries_owner_review
  ON public.inquiries (boarding_house_id, created_at DESC);
