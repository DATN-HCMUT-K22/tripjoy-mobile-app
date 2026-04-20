export interface CommentUser {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface CommentResponse {
  id: string;
  content: string;
  post_id: string;
  parent_comment_id?: string;
  created_by_user: CommentUser;
  created_at: string;
  like_count: number;
  is_liked: boolean;
  reply_count: number;
  latest_replies?: CommentResponse[];
}

export interface PageCommentResponse {
  content: CommentResponse[];
  pageable?: {
    page_number: number;
    page_size: number;
  };
  total_elements?: number;
  total_pages?: number;
  size?: number;
  number?: number;
}

export interface ApiCommentResponse {
  code: number;
  message?: string;
  data: PageCommentResponse;
}

export interface ApiResponseVoid {
  code: number;
  message: string;
  data?: null;
}
