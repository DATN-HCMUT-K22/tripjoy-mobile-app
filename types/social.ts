export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Post {
  id: string;
  user: User;
  image: string;
  caption: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  timeAgo: string;
  isBookmarked: boolean;
}

export type TabType = "popular" | "recent";
