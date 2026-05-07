import { useGroup } from "@/hooks/useGroups";
import { useLocationSuggestions, useDeleteLocationSuggestion } from "@/hooks/useLocationSuggestions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isGroupManager } from "@/utils/roleUtils";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LocationImage } from "@/components/location/LocationImage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SuggestLocationResponse } from "@/types/locationSuggestion";

export default function GroupSuggestionsScreen() {
  console.log('====================================');
  console.log('🚀 [DEBUG] GroupSuggestionsScreen IS RUNNING');
  console.log('====================================');
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { data: group, isLoading: isGroupLoading } = useGroup(id);
  const { data: suggestions, isLoading: isSuggestionsLoading } = useLocationSuggestions(id);
  const { data: currentUser } = useCurrentUser();
  const deleteSuggestionMutation = useDeleteLocationSuggestion(id);

  const isManager = useMemo(() => isGroupManager(group || undefined, currentUser?.id), [group, currentUser]);

  const handleDelete = (suggestionId: string) => {
    Alert.alert(
      "Xóa gợi ý",
      "Bạn có chắc chắn muốn xóa địa điểm gợi ý này không?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: () => deleteSuggestionMutation.mutate(suggestionId)
        },
      ]
    );
  };

  const renderSuggestionItem = ({ item }: { item: SuggestLocationResponse }) => {
    const creator = item.suggested_by;
    const isOwner = creator?.id === currentUser?.id;
    const canDelete = isManager || isOwner;
    const location = item.location;

    return (
      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={styles.cardHeader}>
          <View style={styles.locationInfo}>
            <LocationImage
              location={location}
              style={styles.locationImage}
              containerStyle={styles.iconContainer}
              placeholderIcon="location"
            />
            <View style={styles.textContainer}>
              <Text style={[styles.locationName, isDark && styles.textWhite]} numberOfLines={1}>
                {location?.name || "Địa điểm không tên"}
              </Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {location?.full_address || location?.place_formatted || "Không có địa chỉ"}
              </Text>
            </View>
          </View>
          {canDelete && (
            <TouchableOpacity 
              onPress={() => item.id && handleDelete(item.id)}
              style={styles.deleteBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {item.notes ? (
          <View style={[styles.notesContainer, isDark && styles.notesContainerDark]}>
            <Text style={[styles.notesText, isDark && styles.textGrayLight]}>
              "{item.notes}"
            </Text>
          </View>
        ) : null}

        <View style={[styles.cardFooter, isDark && styles.cardFooterDark]}>
          <View style={styles.creatorInfo}>
            <Image
              source={{ uri: resolveUserAvatarUri(creator?.avatarUrl, creator?.fullName || creator?.username) }}
              style={styles.creatorAvatar}
              contentFit="cover"
            />
            <Text style={styles.creatorName}>
              Gợi ý bởi <Text style={styles.creatorHighlight}>{isOwner ? "Bạn" : creator?.fullName || creator?.username || "Thành viên"}</Text>
            </Text>
          </View>
          <Text style={styles.dateText}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString("vi-VN") : ""}
          </Text>
        </View>
      </View>
    );
  };

  if (isGroupLoading || isSuggestionsLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D9488" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={["top"]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Địa điểm gợi ý
          </Text>
          <Text style={styles.headerSubtitle}>
            {group?.name}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => router.push(`/create/add-location?groupId=${id}&mode=suggestion` as any)}
        >
          <Ionicons name="add-circle" size={32} color="#0D9488" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={suggestions}
        renderItem={renderSuggestionItem}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={64} color={isDark ? "#4B5563" : "#D1D5DB"} />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Chưa có địa điểm gợi ý nào.
            </Text>
            <TouchableOpacity 
              style={styles.emptyAddBtn}
              onPress={() => router.push(`/create/add-location?groupId=${id}&mode=suggestion` as any)}
            >
              <Text style={styles.emptyAddBtnText}>Gợi ý địa điểm ngay</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  containerDark: { backgroundColor: "#111827" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerDark: { backgroundColor: "#1F2937", borderBottomColor: "#374151" },
  backBtn: { padding: 4 },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  headerTitleDark: { color: "#fff" },
  headerSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  addBtn: { padding: 4 },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardDark: { backgroundColor: "#1F2937", elevation: 0 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  locationInfo: { flex: 1, flexDirection: "row", alignItems: "center" },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  locationImage: {
    width: "100%",
    height: "100%",
  },
  textContainer: { flex: 1 },
  locationName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  locationAddress: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  deleteBtn: { padding: 4 },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#0D9488",
  },
  notesContainerDark: { backgroundColor: "#374151" },
  notesText: { fontSize: 13, color: "#4B5563", fontStyle: "italic", lineHeight: 18 },
  cardFooter: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  cardFooterDark: { borderTopColor: "#374151" },
  creatorInfo: { flexDirection: "row", alignItems: "center" },
  creatorAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  creatorName: { fontSize: 12, color: "#6B7280" },
  creatorHighlight: { fontWeight: "600", color: "#374151" },
  dateText: { fontSize: 11, color: "#9CA3AF" },
  textWhite: { color: "#fff" },
  textGrayLight: { color: "#D1D5DB" },
  emptyContainer: { marginTop: 100, alignItems: "center", paddingHorizontal: 40 },
  emptyText: { fontSize: 15, color: "#6B7280", marginTop: 16, textAlign: "center" },
  emptyTextDark: { color: "#9CA3AF" },
  emptyAddBtn: {
    marginTop: 24,
    backgroundColor: "#0D9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddBtnText: { color: "#fff", fontWeight: "700" },
});
