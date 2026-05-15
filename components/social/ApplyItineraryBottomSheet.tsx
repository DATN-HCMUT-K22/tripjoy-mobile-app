import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useGroups } from "@/hooks/useGroups";
import { useApplyItinerary } from "@/hooks/useSocial";
import { useRouter } from "expo-router";
import { trackEvent } from "@/utils/analytics";
import type { Post } from "@/types/social";
import type { Group } from "@/types/group";

type ApplyItineraryStep = "select-group" | "customize" | "applying";

interface ApplyItineraryBottomSheetProps {
  post: Post;
  visible: boolean;
  onClose: () => void;
}

export const ApplyItineraryBottomSheet: React.FC<ApplyItineraryBottomSheetProps> = ({
  post,
  visible,
  onClose,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%", "90%"], []);
  const router = useRouter();

  const { data: groups, isLoading: loadingGroups } = useGroups();
  const { mutate: applyItinerary, isPending } = useApplyItinerary();

  const [step, setStep] = useState<ApplyItineraryStep>("select-group");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [customName, setCustomName] = useState(post.itinerary?.title || post.itinerary?.name || "");
  const [customDescription, setCustomDescription] = useState("");

  const selectedGroup = useMemo(
    () => groups?.find((g: Group) => g.id === selectedGroupId),
    [groups, selectedGroupId]
  );

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setStep("select-group");
        setSelectedGroupId(null);
        onClose();
      }
    },
    [onClose]
  );

  const handleGroupSelect = useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
    setStep("customize");
    trackEvent("apply_itinerary_group_selected", { groupId, postId: post.id });
  }, [post.id]);

  const handleBack = useCallback(() => {
    if (step === "customize") {
      setStep("select-group");
      setSelectedGroupId(null);
    }
  }, [step]);

  const handleApply = useCallback(() => {
    if (!selectedGroupId || !post.itinerary?.id) {
      Alert.alert("Lỗi", "Vui lòng chọn nhóm và đảm bảo bài viết có lịch trình");
      return;
    }

    setStep("applying");
    trackEvent("apply_itinerary_initiated", {
      sourceItineraryId: post.itinerary.id,
      groupId: selectedGroupId,
      postId: post.id,
    });

    applyItinerary(
      {
        sourceItineraryId: post.itinerary.id,
        groupId: selectedGroupId,
        name: customName || undefined,
        description: customDescription || undefined,
      },
      {
        onSuccess: (data) => {
          onClose();
          setStep("select-group");
          setSelectedGroupId(null);

          if (data?.newItineraryId) {
            setTimeout(() => {
              router.push(`/itinerary/${data.newItineraryId}`);
            }, 500);
          }
        },
        onError: () => {
          setStep("customize");
        },
      }
    );
  }, [selectedGroupId, post, customName, customDescription, applyItinerary, onClose, router]);

  const renderGroupItem = useCallback(
    ({ item }: { item: Group }) => (
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() => handleGroupSelect(item.id)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Chọn nhóm ${item.name}`}
      >
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupMembers}>
            {item.members?.length || 0} thành viên
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    ),
    [handleGroupSelect]
  );

  const renderContent = () => {
    if (step === "applying") {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang áp dụng lịch trình...</Text>
          <Text style={styles.loadingSubtext}>
            Có thể mất vài giây để tạo lịch trình mới
          </Text>
        </View>
      );
    }

    if (step === "select-group") {
      return (
        <>
          <Text style={styles.title}>Chọn nhóm</Text>
          <Text style={styles.subtitle}>
            Chọn nhóm để áp dụng lịch trình này
          </Text>

          {loadingGroups ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : groups && groups.length > 0 ? (
            <FlatList
              data={groups}
              keyExtractor={(item: Group) => item.id}
              renderItem={renderGroupItem}
              style={styles.groupList}
              contentContainerStyle={styles.groupListContent}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>Bạn chưa có nhóm nào</Text>
              <Text style={styles.emptySubtext}>
                Tạo nhóm để áp dụng lịch trình
              </Text>
            </View>
          )}
        </>
      );
    }

    if (step === "customize") {
      return (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Tùy chỉnh lịch trình</Text>
          </View>

          <BottomSheetScrollView style={styles.scrollView}>
            <View style={styles.section}>
              <Text style={styles.label}>Nhóm đã chọn</Text>
              <View style={styles.selectedGroup}>
                <Text style={styles.selectedGroupName}>{selectedGroup?.name}</Text>
                <Text style={styles.selectedGroupMembers}>
                  {selectedGroup?.members?.length || 0} thành viên
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Tên lịch trình</Text>
              <TextInput
                style={styles.input}
                value={customName}
                onChangeText={setCustomName}
                placeholder="Nhập tên lịch trình"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Mô tả (tùy chọn)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={customDescription}
                onChangeText={setCustomDescription}
                placeholder="Nhập mô tả cho lịch trình"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.applyButton, isPending && styles.applyButtonDisabled]}
              onPress={handleApply}
              disabled={isPending}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Áp dụng lịch trình"
            >
              {isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.applyButtonText}>Áp dụng lịch trình</Text>
              )}
            </TouchableOpacity>
          </BottomSheetScrollView>
        </>
      );
    }

    return null;
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
    >
      <View style={styles.container}>{renderContent()}</View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  groupList: {
    flex: 1,
  },
  groupListContent: {
    paddingBottom: 20,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 14,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  selectedGroup: {
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  selectedGroupName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  selectedGroupMembers: {
    fontSize: 14,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#FFF",
  },
  textArea: {
    height: 100,
  },
  applyButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  applyButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000",
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
