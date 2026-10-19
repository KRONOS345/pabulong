-- ========================================================================
-- Seed Data: Authentic Butuan City Marketplace Listings & Rooms
-- Localized with Butuan Barangays, Coordinates, and Philippine Peso (₱) Rents
-- ========================================================================

-- 1. SEED PROFILES
INSERT INTO public.profiles (id, email, full_name, phone, role, is_verified, bio)
VALUES
    ('user_operator_default', 'landlord.butuan@pabulong.app', 'Aling Maria Santos', '+63 917 123 4567', 'owner', true, 'Operating student dormitories near FSUU and downtown Butuan since 2018.'),
    ('user_landlord_ampayon', 'csu.housing@pabulong.app', 'Engr. Danilo Tan', '+63 918 987 6543', 'owner', true, 'Quality, safe bedspaces and studio units right outside CSU Ampayon gate.'),
    ('user_seeker_demo', 'student.csu@urios.edu.ph', 'Joshua Dela Cruz', '+63 929 555 8899', 'seeker', false, '3rd year IT student looking for quiet boarding house with strong fiber internet.')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED 5 BUTUAN CITY BOARDING HOUSES (IDEMPOTENT UPSERT)
INSERT INTO public.boarding_houses (
    id,
    owner_id,
    name,
    slug,
    description,
    address,
    barangay,
    city,
    province,
    postal_code,
    location,
    gender_restriction,
    curfew_policy,
    visitor_policy,
    amenities,
    rules,
    contact_email,
    contact_phone,
    status,
    featured,
    is_verified,
    cover_image_url
) VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'user_operator_default',
    'Balangay Student Residences - FSUU Campus',
    'balangay-student-residences-fsuu',
    'Premier student boarding house located 2 blocks from Father Saturnino Urios University (Main Campus). Features gated 24/7 security, backup generator during brownouts, high-speed fiber internet, and sub-metered electricity.',
    'Corner San Francisco & E. Luna St., Barangay Dagohoy',
    'Dagohoy',
    'Butuan City',
    'Agusan del Norte',
    '8600',
    ST_SetSRID(ST_MakePoint(125.5432, 8.9482), 4326),
    'coed',
    '10:00 PM curfew for undergraduate students. Digital keycard access for registered tenants.',
    'Visitors allowed in ground-floor lobby and study lounge until 7:00 PM.',
    ARRAY['Fiber Wi-Fi (200Mbps)', 'Backup Generator (5kVA)', 'Study Lounge', 'CCTV Security', 'Purified Water Refilling Station', 'Sub-metered Power'],
    ARRAY['No Smoking inside rooms', 'No loud music after 9:00 PM', 'No illegal appliances (electric stoves)'],
    'balangay.residences@pabulong.app',
    '+63 917 123 4567',
    'published',
    true,
    true,
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80'
),
(
    'b0000000-0000-0000-0000-000000000002',
    'user_landlord_ampayon',
    'Green Valley Dormitory - CSU Ampayon',
    'green-valley-dormitory-csu-ampayon',
    'Convenient and affordable dorm located just 150 meters from Caraga State University (CSU) main entrance in Ampayon. Clean shared rooms, private study desks, and dedicated motorcycle parking.',
    'Purok 3, Barangay Ampayon',
    'Ampayon',
    'Butuan City',
    'Agusan del Norte',
    '8600',
    ST_SetSRID(ST_MakePoint(125.5973, 8.9561), 4326),
    'coed',
    '9:30 PM gate closure. Late arrivals must pre-coordinate with dorm manager.',
    'Visiting hours strictly 9:00 AM to 6:00 PM on weekends.',
    ARRAY['Fiber Wi-Fi', 'Study Carrels', 'Motorcycle Parking', 'Laundry Area', 'Water Refilling Station'],
    ARRAY['Quiet hours after 9:30 PM', 'Kitchen clean-up mandatory after use'],
    'greenvalley.ampayon@pabulong.app',
    '+63 918 987 6543',
    'published',
    true,
    true,
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80'
),
(
    'b0000000-0000-0000-0000-000000000003',
    'user_operator_default',
    'Pinecrest Suites Libertad',
    'pinecrest-suites-libertad',
    'Spacious solo rooms and studio pads near FSUU Morelos Campus and Robinsons Place Butuan. Ideal for working professionals, nursing students, and senior high students.',
    'National Highway, Barangay Libertad',
    'Libertad',
    'Butuan City',
    'Agusan del Norte',
    '8600',
    ST_SetSRID(ST_MakePoint(125.5120, 8.9430), 4326),
    'coed',
    'No strict curfew. 24/7 biometric gate entry for verified tenants.',
    'Overnight guests allowed with prior notification to caretaker.',
    ARRAY['Ensuite Toilet & Bath', 'Air Conditioning', 'Fiber Wi-Fi', 'Individual Sub-meter', 'Gated Perimeter'],
    ARRAY['Maintain cleanliness', 'Segregate waste per Butuan City ordinance'],
    'pinecrest.libertad@pabulong.app',
    '+63 919 444 3322',
    'published',
    false,
    true,
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'
),
(
    'b0000000-0000-0000-0000-000000000004',
    'user_operator_default',
    'Villa Kananga Student Haven',
    'villa-kananga-student-haven',
    'Cozy and peaceful shared rooms in a residential subdivision in Villa Kananga. Only 1 tricycle ride to downtown Butuan, SJIT, and Butuan Doctors College.',
    'Purok 4, Villa Kananga',
    'Villa Kananga',
    'Butuan City',
    'Agusan del Norte',
    '8600',
    ST_SetSRID(ST_MakePoint(125.5310, 8.9320), 4326),
    'male_only',
    '10:00 PM curfew strictly observed.',
    'Male visitors only in common room.',
    ARRAY['Wi-Fi', 'Shared Kitchen', 'Locker Cabinet', 'Purified Water', 'CCTV on Entrance'],
    ARRAY['No alcohol or gambling', 'Quiet hours starting 10:00 PM'],
    'kananga.haven@pabulong.app',
    '+63 920 111 2233',
    'published',
    false,
    true,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
),
(
    'b0000000-0000-0000-0000-000000000005',
    'user_operator_default',
    'St. Jude Ladies Dormitory - Doongan',
    'st-jude-ladies-dormitory-doongan',
    'Exclusive female dormitory in Barangay Doongan with on-site caretaker and house mother. Quiet ambiance perfect for medical and nursing interns at MJ Santos and Butuan Med.',
    'Rosales Extension, Barangay Doongan',
    'Doongan',
    'Butuan City',
    'Agusan del Norte',
    '8600',
    ST_SetSRID(ST_MakePoint(125.5380, 8.9590), 4326),
    'female_only',
    '9:00 PM curfew. Monitored by resident house mother.',
    'Family members only in receiving lounge.',
    ARRAY['Female-Only', 'House Mother', 'Garden Courtyard', 'Fiber Wi-Fi', 'Individual Lockers', 'CCTV'],
    ARRAY['Strict 9:00 PM Curfew', 'Male visitors strictly prohibited in dorm rooms'],
    'stjude.doongan@pabulong.app',
    '+63 922 888 7766',
    'published',
    true,
    true,
    'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&w=1200&q=80'
)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED 12 ROOM INVENTORY UNITS (IDEMPOTENT UPSERT)
INSERT INTO public.rooms (
    id,
    boarding_house_id,
    room_number,
    room_type,
    capacity,
    available_beds,
    monthly_rent,
    security_deposit,
    is_available,
    status,
    gender_preference,
    floor_level,
    features
) VALUES
-- Balangay Residences Rooms (FSUU Downtown)
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Unit 201',
    'solo',
    1,
    1,
    3500.00,
    3500.00,
    true,
    'available',
    'any',
    2,
    ARRAY['Air Conditioning', 'Ensuite Bath', 'Fiber Wi-Fi', 'Study Table & Chair', 'Sub-metered Electric']
),
(
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Unit 202',
    'shared',
    2,
    0,
    2200.00,
    2200.00,
    false,
    'occupied',
    'any',
    2,
    ARRAY['Twin Single Beds', 'Wall Fan', 'Shared Bath', 'Individual Cabinets', 'Wi-Fi']
),
(
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'Unit 203',
    'solo',
    1,
    1,
    3800.00,
    3800.00,
    true,
    'available',
    'any',
    2,
    ARRAY['Balcony View', 'Air Conditioning', 'Private Bathroom', 'Mini Bookshelf']
),
-- Green Valley Rooms (CSU Ampayon)
(
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000002',
    'Unit 101',
    'bedspace',
    4,
    2,
    1600.00,
    1600.00,
    true,
    'available',
    'any',
    1,
    ARRAY['Double Bunk Bed', 'Individual Study Lamp', 'Personal Locker', 'Ceiling Fan']
),
(
    'c0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000002',
    'Unit 102',
    'shared',
    2,
    1,
    2400.00,
    2400.00,
    true,
    'available',
    'any',
    1,
    ARRAY['Twin Beds', 'Shared Bathroom', 'Desk Table', 'Wi-Fi']
),
(
    'c0000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000002',
    'Unit 103',
    'solo',
    1,
    0,
    3200.00,
    3200.00,
    false,
    'occupied',
    'any',
    1,
    ARRAY['Private Room', 'Air Conditioning', 'Study Pod', 'Wardrobe']
),
-- Pinecrest Suites Rooms (Libertad)
(
    'c0000000-0000-0000-0000-000000000007',
    'b0000000-0000-0000-0000-000000000003',
    'Pad A-1',
    'solo',
    1,
    1,
    4500.00,
    4500.00,
    true,
    'available',
    'any',
    1,
    ARRAY['Studio Pad', 'Private Kitchenette', 'Ensuite Bathroom', 'Aircon', 'Submeter']
),
(
    'c0000000-0000-0000-0000-000000000008',
    'b0000000-0000-0000-0000-000000000003',
    'Pad A-2',
    'shared',
    2,
    0,
    2800.00,
    2800.00,
    false,
    'occupied',
    'any',
    1,
    ARRAY['2 Single Beds', 'Ensuite Bathroom', 'Balcony', 'Air Conditioning']
),
-- Villa Kananga Rooms
(
    'c0000000-0000-0000-0000-000000000009',
    'b0000000-0000-0000-0000-000000000004',
    'Room 1',
    'bedspace',
    4,
    3,
    1500.00,
    1500.00,
    true,
    'available',
    'male',
    1,
    ARRAY['Bunk Beds', 'Cabinet Lockers', 'Ceiling Fan', 'Free Drinking Water']
),
(
    'c0000000-0000-0000-0000-000000000010',
    'b0000000-0000-0000-0000-000000000004',
    'Room 2',
    'shared',
    2,
    0,
    2000.00,
    2000.00,
    false,
    'occupied',
    'male',
    1,
    ARRAY['Twin Beds', 'Study Table', 'Fan Cooled', 'Shared CR']
),
-- St. Jude Doongan Rooms (Female Only)
(
    'c0000000-0000-0000-0000-000000000011',
    'b0000000-0000-0000-0000-000000000005',
    'Room 10',
    'solo',
    1,
    1,
    3000.00,
    3000.00,
    true,
    'available',
    'female',
    1,
    ARRAY['Quiet Garden View', 'Private Wardrobe', 'Fan Cooled', 'Study Desk', 'Shared Clean CR']
),
(
    'c0000000-0000-0000-0000-000000000012',
    'b0000000-0000-0000-0000-000000000005',
    'Room 12',
    'shared',
    2,
    2,
    2100.00,
    2100.00,
    true,
    'available',
    'female',
    1,
    ARRAY['Twin Single Beds', 'Large Wardrobe', 'Courtyard Facing', 'Shared CR']
)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED SAMPLE INQUIRY, CONVERSATION, MESSAGE & FAVORITE
INSERT INTO public.favorites (user_id, boarding_house_id)
VALUES
    ('user_seeker_demo', 'b0000000-0000-0000-0000-000000000001'),
    ('user_seeker_demo', 'b0000000-0000-0000-0000-000000000002')
ON CONFLICT (user_id, boarding_house_id) DO NOTHING;

INSERT INTO public.inquiries (
    id,
    seeker_id,
    boarding_house_id,
    room_id,
    target_move_in,
    message,
    status
)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'user_seeker_demo',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '14 days',
    'Hello Aling Maria, good day! Is Unit 201 still available for the second semester? I am an incoming 3rd year student at FSUU. Can I schedule a viewing this Saturday morning?',
    'replied'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.conversations (
    id,
    inquiry_id,
    seeker_id,
    owner_id,
    boarding_house_id
)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'user_seeker_demo',
    'user_operator_default',
    'b0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.messages (
    id,
    conversation_id,
    sender_id,
    content,
    is_read
)
VALUES
    ('e0000000-0000-0000-0000-000000000091', 'a0000000-0000-0000-0000-000000000001', 'user_seeker_demo', 'Hello Aling Maria, is Unit 201 still available for the 2nd semester?', true),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'user_operator_default', 'Hello Joshua! Yes, Unit 201 is available. It has aircon, own CR, and fiber internet. You are welcome to view on Saturday at 10:00 AM.', false)
ON CONFLICT (id) DO NOTHING;
