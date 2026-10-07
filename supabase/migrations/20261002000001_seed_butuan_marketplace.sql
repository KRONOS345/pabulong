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
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;

-- 2. UPDATE EXISTING 5 BOARDING HOUSES WITH BUTUAN DATA
-- Boarding House 1: Near FSUU Main Downtown
UPDATE public.boarding_houses SET
    name = 'Balangay Student Residences - FSUU Campus',
    slug = 'balangay-student-residences-fsuu',
    description = 'Premier student boarding house located 2 blocks from Father Saturnino Urios University (Main Campus). Features gated 24/7 security, backup generator during brownouts, high-speed fiber internet, and sub-metered electricity.',
    address = 'Corner San Francisco & E. Luna St., Barangay Dagohoy',
    barangay = 'Dagohoy',
    city = 'Butuan City',
    province = 'Agusan del Norte',
    postal_code = '8600',
    location = ST_SetSRID(ST_MakePoint(125.5432, 8.9482), 4326),
    gender_restriction = 'coed',
    curfew_policy = '10:00 PM curfew for undergraduate students. Digital keycard access for registered tenants.',
    visitor_policy = 'Visitors allowed in ground-floor lobby and study lounge until 7:00 PM.',
    amenities = ARRAY['Fiber Wi-Fi (200Mbps)', 'Backup Generator (5kVA)', 'Study Lounge', 'CCTV Security', 'Purified Water Refilling Station', 'Sub-metered Power'],
    rules = ARRAY['No Smoking inside rooms', 'No loud music after 9:00 PM', 'No illegal appliances (electric stoves)'],
    contact_email = 'balangay.residences@pabulong.app',
    contact_phone = '+63 917 123 4567',
    status = 'published',
    featured = true,
    is_verified = true,
    cover_image_url = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80'
WHERE id = 'b0000000-0000-0000-0000-000000000001';

-- Boarding House 2: Near CSU Ampayon
UPDATE public.boarding_houses SET
    name = 'Green Valley Dormitory - CSU Ampayon',
    slug = 'green-valley-dormitory-csu-ampayon',
    description = 'Convenient and affordable dorm located just 150 meters from Caraga State University (CSU) main entrance in Ampayon. Clean shared rooms, private study desks, and dedicated motorcycle parking.',
    address = 'Purok 3, Barangay Ampayon',
    barangay = 'Ampayon',
    city = 'Butuan City',
    province = 'Agusan del Norte',
    postal_code = '8600',
    location = ST_SetSRID(ST_MakePoint(125.5973, 8.9561), 4326),
    gender_restriction = 'coed',
    curfew_policy = '9:30 PM gate closure. Late arrivals must pre-coordinate with dorm manager.',
    visitor_policy = 'Visiting hours strictly 9:00 AM to 6:00 PM on weekends.',
    amenities = ARRAY['Fiber Wi-Fi', 'Study Carrels', 'Motorcycle Parking', 'Laundry Area', 'Water Refilling Station'],
    rules = ARRAY['Quiet hours after 9:30 PM', 'Kitchen clean-up mandatory after use'],
    contact_email = 'greenvalley.ampayon@pabulong.app',
    contact_phone = '+63 918 987 6543',
    status = 'published',
    featured = true,
    is_verified = true,
    cover_image_url = 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80'
WHERE id = 'b0000000-0000-0000-0000-000000000002';

-- Boarding House 3: Libertad / FSUU Morelos
UPDATE public.boarding_houses SET
    name = 'Pinecrest Suites Libertad',
    slug = 'pinecrest-suites-libertad',
    description = 'Spacious solo rooms and studio pads near FSUU Morelos Campus and Robinsons Place Butuan. Ideal for working professionals, nursing students, and senior high students.',
    address = 'National Highway, Barangay Libertad',
    barangay = 'Libertad',
    city = 'Butuan City',
    province = 'Agusan del Norte',
    postal_code = '8600',
    location = ST_SetSRID(ST_MakePoint(125.5120, 8.9430), 4326),
    gender_restriction = 'coed',
    curfew_policy = 'No strict curfew. 24/7 biometric gate entry for verified tenants.',
    visitor_policy = 'Overnight guests allowed with prior notification to caretaker.',
    amenities = ARRAY['Ensuite Toilet & Bath', 'Air Conditioning', 'Fiber Wi-Fi', 'Individual Sub-meter', 'Gated Perimeter'],
    rules = ARRAY['Maintain cleanliness', 'Segregate waste per Butuan City ordinance'],
    contact_email = 'pinecrest.libertad@pabulong.app',
    contact_phone = '+63 919 444 3322',
    status = 'published',
    featured = false,
    is_verified = true,
    cover_image_url = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'
WHERE id = 'b0000000-0000-0000-0000-000000000003';

-- Boarding House 4: Villa Kananga
UPDATE public.boarding_houses SET
    name = 'Villa Kananga Student Haven',
    slug = 'villa-kananga-student-haven',
    description = 'Cozy and peaceful shared rooms in a residential subdivision in Villa Kananga. Only 1 tricycle ride to downtown Butuan, SJIT, and Butuan Doctors College.',
    address = 'Purok 4, Villa Kananga',
    barangay = 'Villa Kananga',
    city = 'Butuan City',
    province = 'Agusan del Norte',
    postal_code = '8600',
    location = ST_SetSRID(ST_MakePoint(125.5310, 8.9320), 4326),
    gender_restriction = 'male_only',
    curfew_policy = '10:00 PM curfew strictly observed.',
    visitor_policy = 'Male visitors only in common room.',
    amenities = ARRAY['Wi-Fi', 'Shared Kitchen', 'Locker Cabinet', 'Purified Water', 'CCTV on Entrance'],
    rules = ARRAY['No alcohol or gambling', 'Quiet hours starting 10:00 PM'],
    contact_email = 'kananga.haven@pabulong.app',
    contact_phone = '+63 920 111 2233',
    status = 'published',
    featured = false,
    is_verified = true,
    cover_image_url = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
WHERE id = 'b0000000-0000-0000-0000-000000000004';

-- Boarding House 5: Doongan / San Vicente
UPDATE public.boarding_houses SET
    name = 'St. Jude Ladies Dormitory - Doongan',
    slug = 'st-jude-ladies-dormitory-doongan',
    description = 'Exclusive female dormitory in Barangay Doongan with on-site caretaker and house mother. Quiet ambiance perfect for medical and nursing interns at MJ Santos and Butuan Med.',
    address = 'Rosales Extension, Barangay Doongan',
    barangay = 'Doongan',
    city = 'Butuan City',
    province = 'Agusan del Norte',
    postal_code = '8600',
    location = ST_SetSRID(ST_MakePoint(125.5380, 8.9590), 4326),
    gender_restriction = 'female_only',
    curfew_policy = '9:00 PM curfew. Monitored by resident house mother.',
    visitor_policy = 'Family members only in receiving lounge.',
    amenities = ARRAY['Female-Only', 'House Mother', 'Garden Courtyard', 'Fiber Wi-Fi', 'Individual Lockers', 'CCTV'],
    rules = ARRAY['Strict 9:00 PM Curfew', 'Male visitors strictly prohibited in dorm rooms'],
    contact_email = 'stjude.doongan@pabulong.app',
    contact_phone = '+63 922 888 7766',
    status = 'published',
    featured = true,
    is_verified = true,
    cover_image_url = 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&w=1200&q=80'
WHERE id = 'b0000000-0000-0000-0000-000000000005';

-- 3. UPDATE ROOMS WITH REALISTIC PHILIPPINE PESO (₱) PRICING & LOCAL ROOM TYPES
-- Balangay Residences Rooms (FSUU Downtown)
UPDATE public.rooms SET
    room_number = 'Unit 201',
    room_type = 'solo',
    capacity = 1,
    available_beds = 1,
    monthly_rent = 3500.00,
    security_deposit = 3500.00,
    is_available = true,
    floor_level = 2,
    features = ARRAY['Air Conditioning', 'Ensuite Bath', 'Fiber Wi-Fi', 'Study Table & Chair', 'Sub-metered Electric']
WHERE id = 'c0000000-0000-0000-0000-000000000001';

UPDATE public.rooms SET
    room_number = 'Unit 202',
    room_type = 'shared',
    capacity = 2,
    available_beds = 0,
    monthly_rent = 2200.00,
    security_deposit = 2200.00,
    is_available = false,
    floor_level = 2,
    features = ARRAY['Twin Single Beds', 'Wall Fan', 'Shared Bath', 'Individual Cabinets', 'Wi-Fi']
WHERE id = 'c0000000-0000-0000-0000-000000000002';

UPDATE public.rooms SET
    room_number = 'Unit 203',
    room_type = 'solo',
    capacity = 1,
    available_beds = 1,
    monthly_rent = 3800.00,
    security_deposit = 3800.00,
    is_available = true,
    floor_level = 2,
    features = ARRAY['Balcony View', 'Air Conditioning', 'Private Bathroom', 'Mini Bookshelf']
WHERE id = 'c0000000-0000-0000-0000-000000000003';

-- Green Valley Rooms (CSU Ampayon)
UPDATE public.rooms SET
    room_number = 'Unit 101',
    room_type = 'bedspace',
    capacity = 4,
    available_beds = 2,
    monthly_rent = 1600.00,
    security_deposit = 1600.00,
    is_available = true,
    floor_level = 1,
    features = ARRAY['Double Bunk Bed', 'Individual Study Lamp', 'Personal Locker', 'Ceiling Fan']
WHERE id = 'c0000000-0000-0000-0000-000000000004';

UPDATE public.rooms SET
    room_number = 'Unit 102',
    room_type = 'shared',
    capacity = 2,
    available_beds = 1,
    monthly_rent = 2400.00,
    security_deposit = 2400.00,
    is_available = true,
    floor_level = 1,
    features = ARRAY['Twin Beds', 'Shared Bathroom', 'Desk Table', 'Wi-Fi']
WHERE id = 'c0000000-0000-0000-0000-000000000005';

UPDATE public.rooms SET
    room_number = 'Unit 103',
    room_type = 'solo',
    capacity = 1,
    available_beds = 0,
    monthly_rent = 3200.00,
    security_deposit = 3200.00,
    is_available = false,
    floor_level = 1,
    features = ARRAY['Private Room', 'Air Conditioning', 'Study Pod', 'Wardrobe']
WHERE id = 'c0000000-0000-0000-0000-000000000006';

-- Pinecrest Suites Rooms (Libertad)
UPDATE public.rooms SET
    room_number = 'Pad A-1',
    room_type = 'solo',
    capacity = 1,
    available_beds = 1,
    monthly_rent = 4500.00,
    security_deposit = 4500.00,
    is_available = true,
    floor_level = 1,
    features = ARRAY['Studio Pad', 'Private Kitchenette', 'Ensuite Bathroom', 'Aircon', 'Submeter']
WHERE id = 'c0000000-0000-0000-0000-000000000007';

UPDATE public.rooms SET
    room_number = 'Pad A-2',
    room_type = 'shared',
    capacity = 2,
    available_beds = 0,
    monthly_rent = 2800.00,
    security_deposit = 2800.00,
    is_available = false,
    floor_level = 1,
    features = ARRAY['2 Single Beds', 'Ensuite Bathroom', 'Balcony', 'Air Conditioning']
WHERE id = 'c0000000-0000-0000-0000-000000000008';

-- Villa Kananga Rooms
UPDATE public.rooms SET
    room_number = 'Room 1',
    room_type = 'bedspace',
    capacity = 4,
    available_beds = 3,
    monthly_rent = 1500.00,
    security_deposit = 1500.00,
    is_available = true,
    floor_level = 1,
    features = ARRAY['Bunk Beds', 'Cabinet Lockers', 'Ceiling Fan', 'Free Drinking Water']
WHERE id = 'c0000000-0000-0000-0000-000000000009';

UPDATE public.rooms SET
    room_number = 'Room 2',
    room_type = 'shared',
    capacity = 2,
    available_beds = 0,
    monthly_rent = 2000.00,
    security_deposit = 2000.00,
    is_available = false,
    floor_level = 1,
    features = ARRAY['Twin Beds', 'Study Table', 'Fan Cooled', 'Shared CR']
WHERE id = 'c0000000-0000-0000-0000-000000000010';

-- St. Jude Doongan Rooms (Female Only)
UPDATE public.rooms SET
    room_number = 'Room 10',
    room_type = 'solo',
    capacity = 1,
    available_beds = 1,
    monthly_rent = 3000.00,
    security_deposit = 3000.00,
    is_available = true,
    floor_level = 1,
    features = ARRAY['Quiet Garden View', 'Private Wardrobe', 'Fan Cooled', 'Study Desk', 'Shared Clean CR']
WHERE id = 'c0000000-0000-0000-0000-000000000011';

UPDATE public.rooms SET
    room_number = 'Room 12',
    room_type = 'shared',
    capacity = 2,
    available_beds = 2,
    monthly_rent = 2100.00,
    security_deposit = 2100.00,
    is_available = true,
    floor_level = 1,
    features = ARRAY['Twin Single Beds', 'Large Wardrobe', 'Courtyard Facing', 'Shared CR']
WHERE id = 'c0000000-0000-0000-0000-000000000012';

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
