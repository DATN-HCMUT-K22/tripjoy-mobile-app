import { Post } from "@/types/social";
import { timeAgo } from "./format";

/**
 * Mapper function to convert API post data to UI-friendly format (including legacy fields)
 * Robustly handles both snake_case (API default) and camelCase (Spring default)
 */
export const mapPostData = (post: any): Post => {
  // Handle media URLs (could be media_urls or mediaUrls)
  const mediaUrls = post.media_urls || post.mediaUrls || [];
  const firstImage = mediaUrls.length > 0 ? mediaUrls[0] : (post.image || "");

  // Handle itinerary mapping
  const rawItinerary = post.itinerary;
  const itinerary = rawItinerary ? {
    ...rawItinerary,
    id: rawItinerary.id,
    name: rawItinerary.name || rawItinerary.title || "Hành trình",
    title: rawItinerary.title || rawItinerary.name || "Hành trình",
    start_date: rawItinerary.start_date || rawItinerary.startDate,
    duration_days: rawItinerary.duration_days || rawItinerary.durationDays || 0,
    budget_estimate: rawItinerary.budget_estimate || rawItinerary.budgetEstimate || 0,
  } : undefined;

  // Map user info
  const createdBy = post.created_by_user || post.createdByUser || {};
  const user = {
    id: createdBy.id || post.creator_id || post.creatorId,
    name: createdBy.full_name || createdBy.fullName || createdBy.username || createdBy.name || "Người dùng",
    avatar: createdBy.avatar_url || createdBy.avatarUrl || createdBy.avatar || "",
  };

  return {
    ...post,
    id: post.id,
    content: post.content || post.caption || "",
    media_urls: mediaUrls,
    visibility: post.visibility || 'PUBLIC',
    
    creator_id: post.creator_id || post.creatorId || user.id,
    created_by_user: {
      ...createdBy,
      id: createdBy.id,
      username: createdBy.username,
      fullName: createdBy.full_name || createdBy.fullName,
      avatarUrl: createdBy.avatar_url || createdBy.avatarUrl,
    },
    
    itinerary_id: post.itinerary_id || post.itineraryId,
    itinerary,
    
    hashtags: post.hashtags || [],
    
    like_count: post.like_count ?? post.likeCount ?? 0,
    comment_count: post.comment_count ?? post.commentCount ?? 0,
    shared_quantity: post.shared_quantity ?? post.sharedQuantity ?? 0,
    is_liked: post.is_liked ?? post.isLiked ?? false,
    is_saved: post.is_saved ?? post.isSaved ?? false,
    
    created_at: post.created_at || post.createdAt,
    updated_at: post.updated_at || post.updatedAt,
    
    // UI compatibility fields (Legacy)
    user,
    image: firstImage,
    caption: post.content || post.caption || "",
    likes: post.like_count ?? post.likeCount ?? 0,
    comments: post.comment_count ?? post.commentCount ?? 0,
    shares: post.shared_quantity ?? post.sharedQuantity ?? 0,
    timestamp: (post.created_at || post.createdAt) ? new Date(post.created_at || post.createdAt).toLocaleDateString("vi-VN") : "",
    timeAgo: (post.created_at || post.createdAt) ? timeAgo(post.created_at || post.createdAt) : "Vừa xong",
    isBookmarked: post.is_saved ?? post.isSaved ?? post.isBookmarked ?? false,
    isLiked: post.is_liked ?? post.isLiked ?? false,
  };
};
