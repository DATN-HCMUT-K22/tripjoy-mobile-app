import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SharedHeader } from "@/components/common/SharedHeader";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotifications } from "@/hooks/useNotifications";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAppSelector } from "@/store/hooks";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { NotificationResponse } from "@/services/notifications";
import { EmptyState } from "./components/EmptyState";
import { NotificationItem } from "./components/NotificationItem";
import { NotificationSkeletonList } from "./components/NotificationSkeleton";

export function NotificationScreen() {
  const { requireAuth, checkAuth, showLoginModal, setShowLoginModal } = useRequireAuth();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const shouldLoadAuthenticatedData = isAuthenticated || !!accessToken;
  const {
    items,
    loading,
    error,
    unreadCount,
    hasMore,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ enabled: shouldLoadAuthenticatedData });

  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  React.useEffect(() => {
    if (!shouldLoadAuthenticatedData) {
      void checkAuth();
    }
  }, [checkAuth, shouldLoadAuthenticatedData]);

  const inboxItems = useMemo(
    () => items.filter((n) => !n.is_archived),
    [items]
  );

  const handlePressItem = useCallback(
    async (item: NotificationResponse) => {
      await requireAuth(async () => {
        await markAsRead(item.id);

        // Navigate based on notification type
        switch (item.type) {
          case "POST_LIKED":
          case "POST_COMMENTED":
          case "POST_SAVED":
          case "POST_SHARED":
            // Navigate to post detail (you may need to create this screen)
            if (item.entity_id) {
              console.log(`Navigating to post detail: ${item.entity_id}`);
              // TODO: Implement post detail screen navigation
              // router.push(`/post/${item.entity_id}`);
            }
            break;

          case "COMMENT_LIKED":
          case "COMMENT_REPLIED":
          case "COMMENT_MENTIONED":
            // Navigate to post with comment highlighted
            if (item.entity_id) {
              console.log(`Navigating to comment: ${item.entity_id}`);
              // TODO: Implement comment navigation
            }
            break;

          case "GROUP_INVITE":
          case "GROUP_MEMBER_JOINED":
          case "GROUP_UPDATED":
          case "GROUP_LEADERSHIP_TRANSFERRED":
            // Navigate to group detail
            if (item.entity_id) {
              console.log(`Navigating to group: ${item.entity_id}`);
              router.push(`/groups/${item.entity_id}`);
            }
            break;

          case "CHAT_MESSAGE":
          case "CHAT_MESSAGE_LIKED":
          case "CHAT_MENTIONED":
            // Navigate to chat conversation
            if (item.entity_id) {
              console.log(`Navigating to chat: ${item.entity_id}`);
              router.push(`/chat/${item.entity_id}`);
            }
            break;

          case "ITINERARY_SHARED":
          case "ITINERARY_UPDATED":
            // Navigate to itinerary detail
            if (item.entity_id) {
              console.log(`Navigating to itinerary: ${item.entity_id}`);
              router.push(`/itinerary/${item.entity_id}`);
            }
            break;

          default:
            console.log(`Unknown notification type: ${item.type}`);
            break;
        }
      });
    },
    [markAsRead, requireAuth, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationResponse }) => (
      <NotificationItem item={item} onPress={handlePressItem} />
    ),
    [handlePressItem]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    await requireAuth(async () => {
      if (unreadCount <= 0 || loading) return;
      await markAllAsRead();
    });
  }, [loading, markAllAsRead, requireAuth, unreadCount]);

  const keyExtractor = useCallback((item: NotificationResponse) => item.id, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SharedHeader
          leftElement={
            <Ionicons
              name="chevron-back"
              size={24}
              color={theme.text}
              onPress={() => navigation.goBack()}
            />
          }
          centerElement={
            <Text style={styles.headerTitle}>Thông báo</Text>
          }
          rightElement={
            unreadCount > 0 ? (
              <TouchableOpacity
                onPress={() => void handleMarkAllAsRead()}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={[styles.markAllText, loading && styles.markAllDisabled]}>
                  Đọc hết
                </Text>
              </TouchableOpacity>
            ) : null
          }
          withMenuDrawer={false}
          showBorderBottom
          backgroundColor="#FFFFFF"
        />

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading && inboxItems.length === 0 ? (
          <NotificationSkeletonList />
        ) : (
          <FlatList
            data={inboxItems}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListEmptyComponent={<EmptyState />}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={refresh} />
            }
            onEndReachedThreshold={0.2}
            onEndReached={() => {
              if (!loading && hasMore) {
                void loadMore();
              }
            }}
            contentContainerStyle={
              inboxItems.length === 0
                ? styles.emptyListContainer
                : styles.listContainer
            }
          />
        )}
        <LoginRequiredModal
          visible={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  container: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#10B981",
  },
  markAllDisabled: {
    opacity: 0.5,
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    fontSize: 13,
    color: "#B91C1C",
  },
  listContainer: {
    paddingBottom: 8,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
});


