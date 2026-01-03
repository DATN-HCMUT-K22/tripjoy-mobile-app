import { User } from "./user";

export interface GroupMember {
  id: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  role: "LEADER" | "MEMBER";
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  theme: string | null;
  isDeleted: boolean | null;
  members: GroupMember[];
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  theme_color: string | null;
  is_pro: boolean;
  chatbot_count: number;
}

// Legacy interface for backward compatibility
export interface LegacyGroup {
  id: string;
  name: string;
  description: string;
  image: string;
  initial: string;
  itineraryCount: number;
  memberCount: number;
  createdAt: string;
}

export interface Itinerary {
  id: string;
  groupId: string;
  name: string;
  image: string;
  startDate: string;
  endDate: string;
  duration: string;
  memberCount: number;
  budget: number;
}
