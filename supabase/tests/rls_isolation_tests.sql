-- Switch to authenticated role so Postgres superuser bypass is NOT active
SET ROLE authenticated;

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
  v_rows_affected INT;
BEGIN
  RAISE NOTICE '=== STARTING PABULONG RLS ISOLATION TESTS (AS AUTHENTICATED) ===';

  -- Fetch existing IDs for testing
  SELECT id INTO v_house_a FROM public.boarding_houses WHERE owner_id = v_owner_a_id LIMIT 1;
  SELECT id INTO v_room_a FROM public.rooms WHERE boarding_house_id = v_house_a LIMIT 1;
  SELECT id INTO v_fav_a FROM public.favorites WHERE user_id = v_seeker_a_id LIMIT 1;
  SELECT id INTO v_inquiry_a FROM public.inquiries WHERE seeker_id = v_seeker_a_id LIMIT 1;
  SELECT id INTO v_conv_a FROM public.conversations WHERE seeker_id = v_seeker_a_id LIMIT 1;

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
  BEGIN
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (v_conv_a, v_stranger_id, 'Intruder message');
    
    RAISE EXCEPTION 'TEST 6 FAILED: Stranger was able to insert message into private conversation!';
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      RAISE NOTICE '✅ TEST 6 PASSED: Stranger blocked from sending message to private conversation (RLS violation)';
  END;

  -- --------------------------------------------------------------------------
  -- TEST 7: Non-Admin CANNOT update Reports status (Admin-only moderation)
  -- --------------------------------------------------------------------------
  UPDATE public.reports
  SET status = 'resolved'
  WHERE true;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected > 0 THEN
    RAISE EXCEPTION 'TEST 7 FAILED: Non-admin was able to moderate reports!';
  ELSE
    RAISE NOTICE '✅ TEST 7 PASSED: Non-admin CANNOT moderate reports (0 rows affected)';
  END IF;

  RAISE NOTICE '=== ALL 7 RLS ISOLATION TESTS PASSED SUCCESSFULLY! ===';
END $$;

RESET ROLE;
