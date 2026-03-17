import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { SharedHeader } from "@/components/common/SharedHeader";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotifications } from "@/hooks/useNotifications";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { NotificationResponse } from "@/services/notifications";
import { EmptyState } from "./components/EmptyState";
import { NotificationItem } from "./components/NotificationItem";
import { NotificationSkeletonList } from "./components/NotificationSkeleton";

export function NotificationScreen() {
  const { requireAuth } = useRequireAuth();
  const {
    items,
    loading,
    error,
    unreadCount,
    hasMore,
    refresh,
    loadMore,
    markAsRead,
  } = useNotifications();

  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const inboxItems = useMemo(
    () => items.filter((n) => !n.is_archived),
    [items]
  );

  const handlePressItem = useCallback(
    async (item: NotificationResponse) => {
      await requireAuth(async () => {
        await markAsRead(item.id);
        // TODO: điều hướng chi tiết theo entity_type/entity_id/metadata
      });
    },
    [markAsRead, requireAuth]
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationResponse }) => (
      <NotificationItem item={item} onPress={handlePressItem} />
    ),
    [handlePressItem]
  );

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
              <Text style={styles.markAllText}>Đọc hết</Text>
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


