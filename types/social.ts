export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Post {
  id: string;
  content: string;
  media_urls: string[];
  visibility: 'PUBLIC' | 'PRIVATE';
  share_quantity: number;

  // Creator info
  creator_id: string;
  created_by_user: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };

  // Itinerary link (optional)
  itinerary_id?: string;
  itinerary?: {
    id: string;
    name: string;
    title?: string;
    start_date?: string;
    duration_days?: number;
    budget_estimate?: number;
  };

  // Hashtags
  hashtags: string[];

  // Social metrics
  like_count: number;
  comment_count: number;
  shared_quantity: number;
  is_liked: boolean;
  is_saved: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Soft delete info
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;

  // Legacy fields for backward compatibility with display layer
  user: User;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  timeAgo: string;
  isBookmarked: boolean;
  isLiked: boolean;
}

export interface CreatePostRequest {
  content: string;
  media_urls?: string[];
  hashtags?: string[];
  visibility?: 'PUBLIC' | 'PRIVATE';
  itinerary_id?: string;
}

export type TabType = "popular" | "recent";
