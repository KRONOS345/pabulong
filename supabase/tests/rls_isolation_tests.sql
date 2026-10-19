BEGIN;

-- Switch to authenticated role locally so Postgres superuser bypass is NOT active
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_owner_a_id TEXT := 'user_operator_default';
  v_owner_b_id TEXT := 'user_landlord_ampayon';
  v_seeker_a_id TEXT := 'user_seeker_demo';
  v_stranger_id TEXT := 'user_stranger_intruder';
  
  v_house_a UUID;
  v_room_a UUID;
  v_fav_a UUID;
  v_inquiry_a UUID;
  v_conv_a UUID;
  v_report_a UUID := 'd0000000-0000-0000-0000-000000000001';
  v_rows_affected INT;
BEGIN
  RAISE NOTICE '=== STARTING PABULONG RLS ISOLATION TESTS (AS AUTHENTICATED) ===';
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_seeker_a_id, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_seeker_a_id, 'role', 'authenticated')::text, true);

  -- Fetch existing IDs for testing (with authenticated seeker claim active)
  SELECT id INTO v_house_a FROM public.boarding_houses WHERE owner_id = v_owner_a_id LIMIT 1;
  SELECT id INTO v_room_a FROM public.rooms WHERE boarding_house_id = v_house_a LIMIT 1;
  SELECT id INTO v_fav_a FROM public.favorites WHERE user_id = v_seeker_a_id LIMIT 1;
  SELECT id INTO v_inquiry_a FROM public.inquiries WHERE seeker_id = v_seeker_a_id LIMIT 1;
  SELECT id INTO v_conv_a FROM public.conversations WHERE seeker_id = v_seeker_a_id LIMIT 1;

  -- --------------------------------------------------------------------------
  -- PRE-CHECKS: Verify all required test fixtures exist before executing tests
  -- --------------------------------------------------------------------------
  IF v_house_a IS NULL THEN
    RAISE EXCEPTION 'PRE-CHECK FAILED: Boarding house for owner % does not exist in database', v_owner_a_id;
  END IF;
  IF v_room_a IS NULL THEN
    RAISE EXCEPTION 'PRE-CHECK FAILED: Room for boarding house % does not exist in database', v_house_a;
  END IF;
  IF v_fav_a IS NULL THEN
    RAISE EXCEPTION 'PRE-CHECK FAILED: Favorite for seeker % does not exist in database', v_seeker_a_id;
  END IF;
  IF v_inquiry_a IS NULL THEN
    RAISE EXCEPTION 'PRE-CHECK FAILED: Inquiry for seeker % does not exist in database', v_seeker_a_id;
  END IF;
  IF v_conv_a IS NULL THEN
    RAISE EXCEPTION 'PRE-CHECK FAILED: Conversation for seeker % does not exist in database', v_seeker_a_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_seeker_a_id) THEN
    RAISE EXCEPTION 'PRE-CHECK FAILED: Profile for seeker % does not exist in database', v_seeker_a_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_owner_a_id) THEN
    RAISE EXCEPTION 'PRE-CHECK FAILED: Profile for owner A % does not exist in database', v_owner_a_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_owner_b_id) THEN
    RAISE EXCEPTION 'PRE-CHECK FAILED: Profile for owner B % does not exist in database', v_owner_b_id;
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 1: Owner B CANNOT modify Owner A's Boarding House
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_owner_b_id, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_owner_b_id)::text, true);
  
  UPDATE public.boarding_houses 
  SET name = 'HACKED BY OWNER B' 
  WHERE id = v_house_a;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected > 0 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Owner B was able to modify Owner A''s property!';
  ELSE
    RAISE NOTICE '✅ TEST 1 PASSED: Owner B CANNOT modify Owner A''s property (0 rows affected)';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 2: Owner B CANNOT modify Owner A's Rooms
  -- --------------------------------------------------------------------------
  UPDATE public.rooms
  SET monthly_rent = 1.00
  WHERE id = v_room_a;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected > 0 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Owner B was able to modify Owner A''s room!';
  ELSE
    RAISE NOTICE '✅ TEST 2 PASSED: Owner B CANNOT modify Owner A''s rooms (0 rows affected)';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 3: Stranger CANNOT delete or modify Seeker A's Favorites
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_stranger_id, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_stranger_id)::text, true);

  DELETE FROM public.favorites WHERE id = v_fav_a;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected > 0 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Stranger was able to delete Seeker A''s favorite!';
  ELSE
    RAISE NOTICE '✅ TEST 3 PASSED: Stranger CANNOT delete Seeker A''s favorite (0 rows affected)';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 4: Stranger CANNOT view or modify Seeker A's Inquiries
  -- --------------------------------------------------------------------------
  UPDATE public.inquiries
  SET status = 'closed'
  WHERE id = v_inquiry_a;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected > 0 THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Stranger was able to update Seeker A''s inquiry!';
  ELSE
    RAISE NOTICE '✅ TEST 4 PASSED: Stranger CANNOT update Seeker A''s inquiry (0 rows affected)';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 5: Stranger CANNOT view or access another user''s Conversation
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_rows_affected FROM public.conversations WHERE id = v_conv_a;
  IF v_rows_affected > 0 THEN
    RAISE EXCEPTION 'TEST 5 FAILED: Stranger was able to read conversation between Seeker A and Owner A!';
  ELSE
    RAISE NOTICE '✅ TEST 5 PASSED: Stranger CANNOT view another user''s conversation (0 rows visible)';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 6: Stranger CANNOT insert messages into another user''s Conversation
  -- --------------------------------------------------------------------------
  DECLARE
    v_test6_failed BOOLEAN := false;
  BEGIN
    BEGIN
      INSERT INTO public.messages (conversation_id, sender_id, content)
      VALUES (v_conv_a, v_stranger_id, 'Intruder message');
      v_test6_failed := true;
    EXCEPTION
      WHEN insufficient_privilege OR check_violation THEN
        RAISE NOTICE '✅ TEST 6 PASSED: Stranger blocked from sending message to private conversation (RLS violation)';
    END;

    IF v_test6_failed THEN
      RAISE EXCEPTION 'TEST 6 FAILED: Stranger was able to insert message into private conversation!';
    END IF;
  END;

  -- --------------------------------------------------------------------------
  -- TEST 7: Non-Admin CANNOT update Reports status (Admin-only moderation)
  -- --------------------------------------------------------------------------
  -- Insert an isolated test report as Seeker A (legitimate reporter) to ensure the table has an active target fixture
  PERFORM set_config('request.jwt.claim.sub', v_seeker_a_id, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_seeker_a_id, 'role', 'authenticated')::text, true);

  INSERT INTO public.reports (id, reporter_id, boarding_house_id, reason, details)
  VALUES (
    v_report_a,
    v_seeker_a_id,
    v_house_a,
    'safety_concern',
    'Test report details regarding safety inspection'
  );

  -- Verify fixture exists
  IF NOT EXISTS (SELECT 1 FROM public.reports WHERE id = v_report_a) THEN
    RAISE EXCEPTION 'PRE-CHECK FAILED: Unable to set up test report fixture %', v_report_a;
  END IF;

  -- Seeker A (or any non-admin) attempts to moderate/update the report status
  UPDATE public.reports
  SET status = 'resolved'
  WHERE id = v_report_a;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected > 0 THEN
    RAISE EXCEPTION 'TEST 7 FAILED: Non-admin was able to moderate reports!';
  ELSE
    RAISE NOTICE '✅ TEST 7 PASSED: Non-admin CANNOT moderate reports (0 rows affected on existing fixture)';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 8: Authenticated user CANNOT insert a profile with role = 'admin'
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', 'user_rogue_applicant', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', 'user_rogue_applicant', 'role', 'authenticated')::text, true);

  DECLARE
    v_test8_failed BOOLEAN := false;
  BEGIN
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES ('user_rogue_applicant', 'rogue@example.com', 'Rogue Admin Candidate', 'admin');
      v_test8_failed := true;
    EXCEPTION
      WHEN insufficient_privilege OR check_violation THEN
        RAISE NOTICE '✅ TEST 8 PASSED: Authenticated user blocked from inserting admin profile (RLS/trigger violation)';
    END;

    IF v_test8_failed THEN
      RAISE EXCEPTION 'TEST 8 FAILED: Authenticated user was able to self-insert as admin!';
    END IF;
  END;

  -- --------------------------------------------------------------------------
  -- TEST 9: Authenticated Seeker CANNOT escalate own profile to role = 'admin'
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_seeker_a_id, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_seeker_a_id, 'role', 'authenticated')::text, true);

  DECLARE
    v_test9_failed BOOLEAN := false;
  BEGIN
    BEGIN
      UPDATE public.profiles
      SET role = 'admin'
      WHERE id = v_seeker_a_id;

      GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
      IF v_rows_affected > 0 THEN
        v_test9_failed := true;
      ELSE
        RAISE NOTICE '✅ TEST 9 PASSED: Seeker CANNOT escalate role to admin (0 rows updated)';
      END IF;
    EXCEPTION
      WHEN insufficient_privilege OR check_violation THEN
        RAISE NOTICE '✅ TEST 9 PASSED: Seeker blocked from updating role to admin (RLS/trigger violation)';
    END;

    IF v_test9_failed THEN
      RAISE EXCEPTION 'TEST 9 FAILED: Seeker was able to self-escalate role to admin!';
    END IF;
  END;

  -- Sub-check 9B: Stranger CANNOT modify or escalate another user's profile
  PERFORM set_config('request.jwt.claim.sub', v_stranger_id, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_stranger_id, 'role', 'authenticated')::text, true);

  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = v_seeker_a_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected > 0 THEN
    RAISE EXCEPTION 'TEST 9B FAILED: Stranger was able to modify another user''s profile role!';
  ELSE
    RAISE NOTICE '✅ TEST 9B PASSED: Stranger CANNOT modify or escalate another user''s profile (0 rows updated)';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 10: Authenticated user CAN legitimately update profile as seeker/owner
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_seeker_a_id, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_seeker_a_id, 'role', 'authenticated')::text, true);

  DECLARE
    v_test10_success BOOLEAN := false;
  BEGIN
    BEGIN
      UPDATE public.profiles
      SET full_name = 'Updated Seeker Name', phone = '09171234567'
      WHERE id = v_seeker_a_id;

      GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
      IF v_rows_affected = 0 THEN
        RAISE EXCEPTION 'TEST 10 FAILED: Legitimate seeker profile update was unexpectedly blocked!';
      ELSE
        v_test10_success := true;
      END IF;

      -- Intentional subtransaction rollback: revert mutation so test fixture stays pristine
      RAISE EXCEPTION 'INTENTIONAL_TEST10_ROLLBACK' USING ERRCODE = 'P0001';
    EXCEPTION
      WHEN raise_exception THEN
        IF SQLERRM = 'INTENTIONAL_TEST10_ROLLBACK' THEN
          NULL; -- Subtransaction safely rolled back
        ELSE
          RAISE; -- Re-raise genuine assertion failures
        END IF;
    END;

    IF v_test10_success THEN
      RAISE NOTICE '✅ TEST 10 PASSED: Legitimate seeker profile update succeeded (1 row updated, subtransaction rolled back cleanly)';
    END IF;
  END;

  RAISE NOTICE '=== ALL 10 RLS ISOLATION & ROLE SECURITY TESTS PASSED SUCCESSFULLY! ===';
END $$;

RESET ROLE;
ROLLBACK;
