import { SharedHeader } from "@/components/common/SharedHeader";
import { useNotifications } from "@/hooks/useNotifications";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NotificationsScreen() {
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
    markAllAsRead,
    toggleArchive,
    deleteOne,
  } = useNotifications();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const inboxItems = useMemo(
    () => items.filter((n) => !n.is_archived),
    [items]
  );

  const handlePressItem = async (id: string) => {
    await requireAuth(async () => {
      await markAsRead(id);
      // TODO: điều hướng chi tiết theo entity_type/entity_id/metadata sau
    });
  };

  const renderItem = ({ item }: { item: (typeof items)[number] }) => {
    const isUnread = !item.is_read;
    return (
      <TouchableOpacity
        onPress={() => handlePressItem(item.id)}
        activeOpacity={0.8}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: isUnread ? "#ECFDF3" : "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isUnread ? "#22C55E" : "transparent",
                marginTop: 7,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontWeight: isUnread ? "700" : "500",
                  fontSize: 14,
                  color: "#111827",
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#4B5563",
                }}
                numberOfLines={2}
              >
                {item.message}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => {
    if (loading) return null;
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 80,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Chưa có thông báo nào
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          Khi có hoạt động mới như like, bình luận, lời mời nhóm... chúng tôi sẽ
          hiển thị tại đây.
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SharedHeader
        centerElement={
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: theme.text,
            }}
          >
            Thông báo
          </Text>
        }
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={() => markAllAsRead()}
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.tint,
                }}
              >
                Đánh dấu đã đọc hết
              </Text>
            </TouchableOpacity>
          ) : null
        }
        withMenuDrawer={true}
        showBorderBottom
      />

      {error ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: "#FEF2F2",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: "#B91C1C",
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={inboxItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        onEndReachedThreshold={0.2}
        onEndReached={() => {
          if (!loading && hasMore) {
            void loadMore();
          }
        }}
        ListFooterComponent={
          loading && inboxItems.length > 0 ? (
            <ActivityIndicator style={{ paddingVertical: 16 }} />
          ) : null
        }
        contentContainerStyle={
          inboxItems.length === 0 ? { flexGrow: 1 } : undefined
        }
      />
    </View>
  );
}


