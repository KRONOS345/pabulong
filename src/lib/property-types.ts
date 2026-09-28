export interface RoomItem {
  id: string;
  boarding_house_id: string;
  room_number: string;
  capacity: number;
  monthly_rent: number;
  status: "available" | "occupied" | "maintenance";
  gender_preference: "male" | "female" | "any";
  features: string[];
  created_at?: string;
}

export interface BoardingHouseItem {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  rules: string[];
  contact_email: string;
  contact_phone: string;
  created_at?: string;
  rooms?: RoomItem[];
}

export const DEFAULT_MOCK_PROPERTIES: BoardingHouseItem[] = [
  {
    id: "bh-1",
    owner_id: "user_owner_01",
    name: "Greenfield Dormitory Block A",
    description: "Premium university residence with 24/7 security, high-speed fiber internet, and dedicated study pods.",
    address: "142 University Avenue, Academic District",
    latitude: 14.5995,
    longitude: 120.9842,
    amenities: ["Fiber Wi-Fi (300Mbps)", "Generator Backup", "Study Lounge", "CCTV Security", "Water Station"],
    rules: ["Curfew: 10:00 PM for Undergrads", "No Smoking", "Quiet Hours after 9:00 PM", "Visitor Sign-in Required"],
    contact_email: "management@greenfieldresidences.com",
    contact_phone: "+1 (555) 019-2831",
    rooms: [
      {
        id: "room-101",
        boarding_house_id: "bh-1",
        room_number: "Unit 204",
        capacity: 1,
        monthly_rent: 380,
        status: "available",
        gender_preference: "any",
        features: ["Ensuite Bath", "Fiber Wi-Fi", "Aircon", "Desk & Chair"],
      },
      {
        id: "room-105",
        boarding_house_id: "bh-1",
        room_number: "Unit 205",
        capacity: 2,
        monthly_rent: 260,
        status: "occupied",
        gender_preference: "female",
        features: ["Twin Beds", "Shared Bath", "Individual Lockers"],
      },
    ],
  },
  {
    id: "bh-2",
    owner_id: "user_owner_02",
    name: "University Heights Residences",
    description: "Modern student living located 250 meters from campus gate. Ensuite bathrooms and biometric access control.",
    address: "88 College Boulevard, Campus North",
    latitude: 14.6012,
    longitude: 120.9855,
    amenities: ["Biometric Entry", "Fiber Wi-Fi", "Balcony", "Laundry Facility", "Bike Racks"],
    rules: ["No Overnight Guests without Approval", "No Cooking inside Bedrooms", "Keep Common Areas Clean"],
    contact_email: "inquiries@heightsresidences.edu",
    contact_phone: "+1 (555) 014-9922",
    rooms: [
      {
        id: "room-102",
        boarding_house_id: "bh-2",
        room_number: "Unit 312",
        capacity: 1,
        monthly_rent: 420,
        status: "available",
        gender_preference: "female",
        features: ["Study Pod", "Balcony", "24/7 CCTV", "Mini Fridge"],
      },
      {
        id: "room-106",
        boarding_house_id: "bh-2",
        room_number: "Unit 314",
        capacity: 2,
        monthly_rent: 310,
        status: "maintenance",
        gender_preference: "any",
        features: ["Double Occupancy", "Ensuite Bath", "Desk Lamp"],
      },
    ],
  },
  {
    id: "bh-3",
    owner_id: "user_owner_03",
    name: "Pinecrest Student Suites",
    description: "Budget-friendly shared suites with full kitchen access and quiet study corridors.",
    address: "52 Elm Parkway, South Science Quad",
    latitude: 14.598,
    longitude: 120.982,
    amenities: ["Shared Kitchen", "Generator Backup", "Water Dispenser", "Rooftop Terrace"],
    rules: ["Kitchen clean-up mandatory after cooking", "Non-smoking building"],
    contact_email: "desk@pinecrestsuites.com",
    contact_phone: "+1 (555) 018-7711",
    rooms: [
      {
        id: "room-103",
        boarding_house_id: "bh-3",
        room_number: "Unit 108",
        capacity: 2,
        monthly_rent: 220,
        status: "available",
        gender_preference: "male",
        features: ["Shared Kitchen", "Generator Backup", "Water Dispenser"],
      },
    ],
  },
];
