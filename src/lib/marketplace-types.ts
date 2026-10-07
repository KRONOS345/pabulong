/**
 * Pabulong Marketplace Domain Types
 * Canonical TypeScript definitions for Butuan City housing marketplace
 */

export type UserRole = "seeker" | "owner" | "admin";

export interface Profile {
  id: string; // Clerk User ID ('user_xxx')
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_verified: boolean;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export type GenderRestriction = "male_only" | "female_only" | "coed";

export type ListingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "archived"
  | "suspended";

export interface BoardingHouse {
  id: string;
  owner_id: string;
  name: string;
  slug?: string | null;
  description: string;
  address: string;
  barangay: string;
  city: string;
  province: string;
  postal_code?: string | null;
  latitude: number;
  longitude: number;
  gender_restriction: GenderRestriction;
  curfew_policy?: string | null;
  visitor_policy?: string | null;
  amenities: string[];
  rules: string[];
  status: ListingStatus;
  featured: boolean;
  is_verified: boolean;
  cover_image_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_at: string;
  updated_at: string;
  // Relational joins
  owner?: Profile;
  rooms?: Room[];
  photos?: PropertyPhoto[];
  min_rent?: number;
  distance_meters?: number;
}

export type RoomType = "solo" | "shared" | "bedspace";
export type RoomStatus = "available" | "occupied" | "maintenance";

export interface Room {
  id: string;
  boarding_house_id: string;
  room_number: string;
  room_type: RoomType;
  capacity: number;
  available_beds: number;
  monthly_rent: number; // Stored in Philippine Pesos (PHP / ₱)
  security_deposit: number;
  is_available: boolean;
  floor_level: number;
  status: RoomStatus;
  gender_preference: "male" | "female" | "any";
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface PropertyPhoto {
  id: string;
  boarding_house_id: string;
  room_id?: string | null;
  url: string;
  caption?: string | null;
  is_cover: boolean;
  display_order: number;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  boarding_house_id: string;
  created_at: string;
  boarding_house?: BoardingHouse;
}

export type InquiryStatus =
  | "new"
  | "replied"
  | "viewing_requested"
  | "viewing_scheduled"
  | "closed";

export interface Inquiry {
  id: string;
  seeker_id: string;
  boarding_house_id: string;
  room_id?: string | null;
  target_move_in?: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
  // Relational joins
  seeker?: Profile;
  boarding_house?: BoardingHouse;
  room?: Room;
}

export interface Conversation {
  id: string;
  inquiry_id: string;
  seeker_id: string;
  owner_id: string;
  boarding_house_id: string;
  created_at: string;
  updated_at: string;
  // Relational joins
  seeker?: Profile;
  owner?: Profile;
  boarding_house?: BoardingHouse;
  last_message?: Message;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporter_id: string;
  boarding_house_id: string;
  reason: string;
  details?: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Filter parameters for public marketplace queries
 */
export interface MarketplaceSearchParams {
  query?: string;
  barangay?: string;
  gender_restriction?: GenderRestriction | "all";
  room_type?: RoomType | "all";
  min_rent?: number;
  max_rent?: number;
  amenities?: string[];
  campus_lat?: number;
  campus_lng?: number;
  radius_meters?: number;
}
