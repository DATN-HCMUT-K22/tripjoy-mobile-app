import { SharedHeader } from "@/components/common/SharedHeader";
import { useFeedback } from "@/hooks/useFeedback";
import { useGuestMode } from "@/hooks/useGuestMode";
import { FeedbackType } from "@/types/feedback";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FeedbackScreen() {
  const router = useRouter();
  const { isGuest } = useGuestMode();
  const submitFeedbackMutation = useFeedback();

  // Form state
  const [type, setType] = useState<FeedbackType>("BUG_REPORT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Validation state
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const validate = () => {
    const tempErrors: { title?: string; content?: string } = {};
    let isValid = true;

    if (!title.trim()) {
      tempErrors.title = "Tiêu đề không được để trống";
      isValid = false;
    } else if (title.trim().length < 5) {
      tempErrors.title = "Tiêu đề cần tối thiểu 5 ký tự";
      isValid = false;
    }

    if (!content.trim()) {
      tempErrors.content = "Nội dung phản hồi không được để trống";
      isValid = false;
    } else if (content.trim().length < 10) {
      tempErrors.content = "Nội dung cần tối thiểu 10 ký tự để mô tả chi tiết";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await submitFeedbackMutation.mutateAsync({
        type,
        title: title.trim(),
        content: content.trim(),
      });
      // Reset form on success
      setTitle("");
      setContent("");
      // Navigate back after toast success
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      // Handled by mutation onError hook
    }
  };

  if (isGuest) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F7FA]" edges={["top", "left", "right"]}>
        <SharedHeader
          showBackButton={true}
          centerElement={
            <Text className="text-lg font-bold text-[#111827]">
              Góp ý & Báo lỗi
            </Text>
          }
          rightElement={null}
        />
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-white p-8 rounded-3xl items-center shadow-sm border border-gray-100 w-full max-w-sm">
            <View className="w-16 h-16 bg-[#FEF3C7] rounded-full items-center justify-center mb-6">
              <Ionicons name="lock-closed" size={30} color="#D97706" />
            </View>
            <Text className="text-xl font-bold text-[#111827] text-center mb-2">
              Yêu cầu đăng nhập
            </Text>
            <Text className="text-gray-500 text-center text-sm mb-6 leading-5">
              Bạn cần đăng nhập để gửi ý kiến phản hồi hoặc báo lỗi hệ thống cho chúng tôi.
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/login")}
              className="bg-[#34B27D] py-3.5 px-6 rounded-2xl w-full flex-row justify-center items-center"
            >
              <Ionicons name="log-in-outline" size={20} color="white" className="mr-2" />
              <Text className="text-white font-bold text-base ml-2">Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isSubmitting = submitFeedbackMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]" edges={["top", "left", "right"]}>
      <SharedHeader
        showBackButton={true}
        centerElement={
          <Text className="text-lg font-bold text-[#111827]">
            Góp ý & Báo lỗi
          </Text>
        }
        rightElement={null}
      />

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={50}
      >
        <Text className="text-[#4B5563] text-sm leading-5 mb-6">
          Ý kiến đóng góp của bạn rất quan trọng để giúp TripJoy cải tiến chất lượng và khắc phục các vấn đề kỹ thuật kịp thời.
        </Text>

        {/* Category Selection */}
        <Text className="text-[#1F2937] font-bold text-[15px] mb-3">
          Phân loại phản hồi
        </Text>
        <View className="flex-row gap-2.5 mb-6">
          {/* Bug Report Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setType("BUG_REPORT")}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-2xl border ${
              type === "BUG_REPORT"
                ? "bg-[#FEF2F2] border-[#EF4444]"
                : "bg-white border-[#E5E7EB]"
            }`}
          >
            <Ionicons
              name="bug-outline"
              size={18}
              color={type === "BUG_REPORT" ? "#EF4444" : "#9CA3AF"}
            />
            <Text
              className={`font-semibold text-xs ml-1.5 ${
                type === "BUG_REPORT" ? "text-[#EF4444]" : "text-[#6B7280]"
              }`}
            >
              Báo lỗi
            </Text>
          </TouchableOpacity>

          {/* Suggestion Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setType("SUGGESTION")}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-2xl border ${
              type === "SUGGESTION"
                ? "bg-[#EFF6FF] border-[#3B82F6]"
                : "bg-white border-[#E5E7EB]"
            }`}
          >
            <Ionicons
              name="bulb-outline"
              size={18}
              color={type === "SUGGESTION" ? "#3B82F6" : "#9CA3AF"}
            />
            <Text
              className={`font-semibold text-xs ml-1.5 ${
                type === "SUGGESTION" ? "text-[#3B82F6]" : "text-[#6B7280]"
              }`}
            >
              Góp ý
            </Text>
          </TouchableOpacity>

          {/* Other Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setType("OTHER")}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-2xl border ${
              type === "OTHER"
                ? "bg-[#F9FAFB] border-[#6B7280]"
                : "bg-white border-[#E5E7EB]"
            }`}
          >
            <Ionicons
              name="ellipsis-horizontal-circle-outline"
              size={18}
              color={type === "OTHER" ? "#4B5563" : "#9CA3AF"}
            />
            <Text
              className={`font-semibold text-xs ml-1.5 ${
                type === "OTHER" ? "text-[#374151]" : "text-[#6B7280]"
              }`}
            >
              Khác
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Fields Container */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-8">
          {/* Title Input */}
          <View className="mb-5">
            <Text className="text-[#4B5563] font-semibold text-[13px] mb-2">
              Tiêu đề ngắn gọn
            </Text>
            <View
              className={`flex-row items-center bg-[#FAFAFA] rounded-2xl px-4 py-3 border ${
                errors.title ? "border-[#EF4444]" : "border-[#E5E7EB]"
              }`}
            >
              <Ionicons name="document-text-outline" size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Nhập tiêu đề phản hồi..."
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className="flex-1 ml-3 text-[15px] text-[#111827]"
              />
            </View>
            {errors.title && (
              <Text className="text-[#EF4444] text-[11px] mt-1.5 ml-1">
                {errors.title}
              </Text>
            )}
          </View>

          {/* Content Input */}
          <View>
            <Text className="text-[#4B5563] font-semibold text-[13px] mb-2">
              Nội dung chi tiết
            </Text>
            <View
              className={`flex-row items-start bg-[#FAFAFA] rounded-2xl px-4 py-3.5 border ${
                errors.content ? "border-[#EF4444]" : "border-[#E5E7EB]"
              }`}
              style={{ minHeight: 140 }}
            >
              <Ionicons
                name="chatbox-ellipses-outline"
                size={18}
                color="#9CA3AF"
                style={{ marginTop: 2 }}
              />
              <TextInput
                placeholder={
                  type === "BUG_REPORT"
                    ? "Mô tả cụ thể lỗi xảy ra (thao tác nào gây ra lỗi, hiện tượng thế nào...)"
                    : "Chia sẻ ý tưởng, góp ý của bạn để giúp chúng tôi hoàn thiện ứng dụng..."
                }
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={content}
                onChangeText={(text) => {
                  setContent(text);
                  if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
                }}
                className="flex-1 ml-3 text-[15px] text-[#111827] h-full"
              />
            </View>
            {errors.content && (
              <Text className="text-[#EF4444] text-[11px] mt-1.5 ml-1">
                {errors.content}
              </Text>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`py-4 rounded-2xl flex-row justify-center items-center shadow-sm ${
            isSubmitting ? "bg-gray-300" : "bg-[#34B27D]"
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={18} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Gửi phản hồi
              </Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
