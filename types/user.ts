export interface User {
  id: string;
  username: string;
  email: string;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  credits: number;
  roles: {
    name: string;
    description: string;
    permissions: string[];
  }[];
  locked: boolean;
  emailVerified: boolean;
  deleted: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

/**
 * Public user profile data (visible to all users)
 * Returned by GET /users/{userId}/profile
 */
export interface UserPublicProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  createdAt: string; // ISO 8601 format
}
