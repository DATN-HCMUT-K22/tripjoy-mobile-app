import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotebook, useGenerateNotebook, useRegenerateNotebook } from "@/hooks/useNotebook";
import { NotebookEmptyState } from "./EmptyState";
import { NotebookGeneratingState } from "./GeneratingState";
import { NotebookContent } from "./NotebookContent";
import { timeAgo } from "@/utils/format";
import { AppDialogModal } from "@/components/common/AppDialogModal";

interface TravelNotebookScreenProps {
  itineraryId: string;
  itineraryName?: string;
}

export function TravelNotebookScreen({
  itineraryId,
  itineraryName,
}: TravelNotebookScreenProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRegenerateModalVisible, setIsRegenerateModalVisible] = useState(false);

  // Fetch notebook data
  const {
    data: notebook,
    isLoading,
    error,
    refetch,
  } = useNotebook(itineraryId);

  // Mutations
  const generateMutation = useGenerateNotebook();
  const regenerateMutation = useRegenerateNotebook();

  // Check if generating
  const isGenerating = generateMutation.isPending || regenerateMutation.isPending;

  /**
   * Handle generate notebook (first time)
   */
  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync(itineraryId);
    } catch (err) {
      // Error handled in hook (shows toast)
      console.error("[TravelNotebookScreen] Generate error:", err);
    }
  };

  /**
   * Handle regenerate notebook (with confirmation)
   */
  const handleRegenerate = () => {
    setIsRegenerateModalVisible(true);
  };

  const confirmRegenerate = async () => {
    setIsRegenerateModalVisible(false);
    try {
      await regenerateMutation.mutateAsync(itineraryId);
    } catch (err) {
      console.error("[TravelNotebookScreen] Regenerate error:", err);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // STATE 1: Loading (initial fetch)
  if (isLoading && !notebook) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="mt-4 text-gray-500 font-medium">Đang tải hướng dẫn...</Text>
      </View>
    );
  }

  // STATE 2: Generating (AI in progress)
  if (isGenerating) {
    return (
      <View style={styles.centerContainer}>
        <NotebookGeneratingState isGenerating={true} />
      </View>
    );
  }

  // STATE 3: Empty (notebook not generated yet)
  if (!notebook && !error) {
    return (
      <View style={styles.centerContainer}>
        <NotebookEmptyState
          onGenerate={handleGenerate}
          isLoading={isGenerating}
        />
      </View>
    );
  }

  // STATE 4: Error (failed to load)
  if (error && !notebook) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Không thể tải hướng dẫn</Text>
          <Text style={styles.errorMessage}>
            {(error as any)?.message || "Đã xảy ra lỗi. Vui lòng thử lại."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // STATE 5: Success (display notebook)
  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {notebook?.name || itineraryName || "Hướng dẫn du lịch"}
          </Text>
          {notebook?.updated_at && (
            <Text style={styles.headerSubtitle}>
              Cập nhật {timeAgo(notebook.updated_at)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRegenerate}
          disabled={isGenerating}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {notebook && <NotebookContent notebook={notebook} />}
      </ScrollView>

      <AppDialogModal
        visible={isRegenerateModalVisible}
        onRequestClose={() => setIsRegenerateModalVisible(false)}
        title="Làm mới hướng dẫn?"
        message="AI sẽ tạo nội dung mới. Nội dung cũ sẽ bị thay thế. Quá trình này mất khoảng 20 giây."
        variant="warning"
        primaryLabel="Tiếp tục"
        onPrimaryPress={confirmRegenerate}
        secondaryLabel="Hủy"
        onSecondaryPress={() => setIsRegenerateModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#D1FAE5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#10B981",
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
