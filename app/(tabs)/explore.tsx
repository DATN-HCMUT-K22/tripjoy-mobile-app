import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNavigation } from "@/components/social/BottomNavigation";
import { SearchBar } from "@/components/social/SearchBar";
import { PostCard } from "@/components/social/PostCard";
import { FilterModal } from "@/components/social/filters/FilterModal";
import { usePosts, useLikePost, useCommentPost, useSharePost, useBookmarkPost } from "@/hooks/useSocial";
import type { GetPostsParams } from "@/services/social";
import type { Post } from "@/types/social";

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<GetPostsParams>({});
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Read hashtag from URL params (when user clicks hashtag in a post)
  useEffect(() => {
    if (params.hashtag && typeof params.hashtag === "string") {
      setFilters({ hashtag: params.hashtag });
    }
  }, [params.hashtag]);

  // Fetch posts with search/filter params
  const { data: posts = [], isLoading } = usePosts({
    q: searchQuery,
    ...filters,
    sort: "relevance",
  });

  // Post interaction hooks
  const likeMutation = useLikePost();
  const commentMutation = useCommentPost();
  const shareMutation = useSharePost();
  const bookmarkMutation = useBookmarkPost();

  const handleLike = (postId: string) => {
    likeMutation.mutate(postId);
  };

  const handleComment = (postId: string) => {
    // TODO: Open comment modal (Phase 4)
    console.log("Comment on post:", postId);
  };

  const handleShare = (postId: string) => {
    shareMutation.mutate(postId);
  };

  const handleBookmark = (postId: string) => {
    bookmarkMutation.mutate(postId);
  };

  const handlePostPress = (post: Post) => {
    router.push(`/post/${post.id}` as any);
  };

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}` as any);
  };

  // Clear a specific filter
  const clearFilter = (key: keyof GetPostsParams) => {
    setFilters((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof GetPostsParams] !== undefined
  ).length;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Không tìm thấy bài viết</Text>
      <Text style={styles.emptyText}>
        {searchQuery || activeFilterCount > 0
          ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
          : "Bắt đầu tìm kiếm bài viết du lịch"}
      </Text>
      {(searchQuery || activeFilterCount > 0) && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearAllFilters}
          activeOpacity={0.7}
        >
          <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderActiveFilters = () => {
    if (activeFilterCount === 0) return null;

    return (
      <View style={styles.filtersContainer}>
        <View style={styles.filtersHeader}>
          <Text style={styles.filtersTitle}>
            Bộ lọc ({activeFilterCount})
          </Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearAllText}>Xóa tất cả</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filtersChips}>
          {filters.hashtag && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>#{filters.hashtag}</Text>
              <TouchableOpacity onPress={() => clearFilter("hashtag")}>
                <Ionicons name="close-circle" size={18} color="#0369A1" />
              </TouchableOpacity>
            </View>
          )}
          {(filters.min_budget || filters.max_budget) && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Ngân sách: {filters.min_budget || 0}đ - {filters.max_budget || "∞"}đ
              </Text>
              <TouchableOpacity
                onPress={() => {
                  clearFilter("min_budget");
                  clearFilter("max_budget");
                }}
              >
                <Ionicons name="close-circle" size={18} color="#0369A1" />
              </TouchableOpacity>
            </View>
          )}
          {(filters.start_date || filters.end_date) && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Thời gian: {filters.start_date || "?"} - {filters.end_date || "?"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  clearFilter("start_date");
                  clearFilter("end_date");
                }}
              >
                <Ionicons name="close-circle" size={18} color="#0369A1" />
              </TouchableOpacity>
            </View>
          )}
          {(filters.min_days || filters.max_days) && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Thời lượng: {filters.min_days || 0} - {filters.max_days || "∞"} ngày
              </Text>
              <TouchableOpacity
                onPress={() => {
                  clearFilter("min_days");
                  clearFilter("max_days");
                }}
              >
                <Ionicons name="close-circle" size={18} color="#0369A1" />
              </TouchableOpacity>
            </View>
          )}
          {(filters.min_people || filters.max_people) && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Số người: {filters.min_people || 0} - {filters.max_people || "∞"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  clearFilter("min_people");
                  clearFilter("max_people");
                }}
              >
                <Ionicons name="close-circle" size={18} color="#0369A1" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Khám phá</Text>
        </View>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setShowFilterModal(true)}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khám phá</Text>
        <Text style={styles.headerSubtitle}>
          {posts.length} bài viết
        </Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilterPress={() => setShowFilterModal(true)}
      />

      {renderActiveFilters()}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onBookmark={handleBookmark}
            onPostPress={handlePostPress}
            onUserPress={handleUserPress}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState()}
        showsVerticalScrollIndicator={false}
      />

      <BottomNavigation />

      <FilterModal
        visible={showFilterModal}
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilterModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  clearButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#16A34A",
    borderRadius: 8,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  clearAllText: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
  },
  filtersChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipText: {
    color: "#0369A1",
    fontSize: 13,
    fontWeight: "600",
  },
});
