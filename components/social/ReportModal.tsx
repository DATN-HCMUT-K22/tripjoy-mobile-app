import React, { useState } from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSubmitReport } from "@/hooks/useReports";
import {
  ContentType,
  ReportType,
  REPORT_TYPE_LABELS,
  CONTENT_TYPE_LABELS,
} from "@/types/report";
import { showErrorToast } from "@/utils/toast";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  contentId: string;
  contentType: ContentType;
  contentTitle?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  contentId,
  contentType,
  contentTitle,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportType | null>(null);
  const [description, setDescription] = useState("");
  const { mutate: submit, isPending } = useSubmitReport();

  const handleSubmit = () => {
    if (!selectedReason) {
      showErrorToast("Vui lòng chọn lý do báo cáo");
      return;
    }

    if (description.length > 500) {
      showErrorToast("Mô tả không được vượt quá 500 ký tự");
      return;
    }

    submit(
      {
        content_id: contentId,
        content_type: contentType,
        report_type: selectedReason,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setSelectedReason(null);
          setDescription("");
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
      setTimeout(() => {
        setSelectedReason(null);
        setDescription("");
      }, 300);
    }
  };

  const reportOptions = Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => ({
    value: key as ReportType,
    label,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50"
        activeOpacity={1}
        onPress={handleClose}
        disabled={isPending}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-white rounded-t-3xl max-h-[85%]">
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    Báo cáo vi phạm
                  </Text>
                  {contentTitle && (
                    <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
                      {CONTENT_TYPE_LABELS[contentType]}: {contentTitle}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  activeOpacity={0.7}
                  disabled={isPending}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView className="px-6 py-4">
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Chọn lý do báo cáo: <Text className="text-red-500">*</Text>
                </Text>

                {reportOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setSelectedReason(option.value)}
                    className={`flex-row items-center py-3 px-4 mb-2 rounded-lg border ${
                      selectedReason === option.value
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 bg-white"
                    }`}
                    activeOpacity={0.7}
                    disabled={isPending}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                        selectedReason === option.value
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedReason === option.value && (
                        <View className="w-3 h-3 rounded-full bg-red-500" />
                      )}
                    </View>
                    <Text
                      className={`flex-1 ${
                        selectedReason === option.value
                          ? "text-red-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text className="text-base font-semibold text-gray-800 mt-4 mb-2">
                  Mô tả thêm (tùy chọn):
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-lg p-3 min-h-[100px] text-gray-800"
                  placeholder="Nhập lý do chi tiết để chúng tôi xem xét tốt hơn..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={500}
                  editable={!isPending}
                />
                <Text className="text-xs text-gray-500 mt-1 text-right">
                  {description.length}/500
                </Text>

                <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 flex-row">
                  <Ionicons name="information-circle" size={20} color="#3B82F6" />
                  <Text className="text-sm text-blue-700 ml-2 flex-1">
                    Báo cáo của bạn sẽ được kiểm tra bởi đội ngũ quản trị.
                    Chúng tôi cam kết xử lý trong vòng 24 giờ.
                  </Text>
                </View>
              </ScrollView>

              {/* Footer Actions */}
              <View className="px-6 py-4 border-t border-gray-100 flex-row space-x-3">
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 py-3 rounded-lg border border-gray-300"
                  activeOpacity={0.7}
                  disabled={isPending}
                >
                  <Text className="text-center text-gray-700 font-semibold">
                    Hủy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  className={`flex-1 py-3 rounded-lg ${
                    isPending || !selectedReason
                      ? "bg-gray-300"
                      : "bg-red-500"
                  }`}
                  activeOpacity={0.7}
                  disabled={isPending || !selectedReason}
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-center text-white font-semibold">
                      Gửi báo cáo
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View className="h-4" />
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
