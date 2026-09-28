export type PlacementStage = "Inquiry" | "Viewing" | "Deposit Pending" | "Placed";

export interface RoomOption {
  id: string;
  boardingHouseName: string;
  roomNumber: string;
  monthlyRent: number;
  capacity: number;
  genderPreference: string;
  features: string[];
}

export interface PlacementItem {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  budget_max: number;
  preferred_location: string;
  room_id?: string | null;
  stage: PlacementStage;
  notes?: string;
  created_at: string;
  matched_room?: RoomOption;
}

export const AVAILABLE_ROOMS: RoomOption[] = [
  {
    id: "room-101",
    boardingHouseName: "Greenfield Dormitory Block A",
    roomNumber: "Unit 204",
    monthlyRent: 380,
    capacity: 1,
    genderPreference: "any",
    features: ["Ensuite Bath", "Fiber Wi-Fi", "Aircon"],
  },
  {
    id: "room-102",
    boardingHouseName: "University Heights Residences",
    roomNumber: "Unit 312",
    monthlyRent: 420,
    capacity: 1,
    genderPreference: "female",
    features: ["Study Pod", "Balcony", "24/7 CCTV"],
  },
  {
    id: "room-103",
    boardingHouseName: "Pinecrest Student Suites",
    roomNumber: "Unit 108",
    monthlyRent: 220,
    capacity: 2,
    genderPreference: "male",
    features: ["Shared Kitchen", "Generator Backup", "Water Dispenser"],
  },
  {
    id: "room-104",
    boardingHouseName: "Vista Heights Boarding House",
    roomNumber: "Unit 401",
    monthlyRent: 180,
    capacity: 4,
    genderPreference: "any",
    features: ["Near Campus Gate", "Bunk Bed", "Lockers"],
  },
];
