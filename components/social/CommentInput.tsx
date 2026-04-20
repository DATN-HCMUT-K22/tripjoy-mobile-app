import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CommentInputProps {
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
  replyToUsername?: string;
  onCancelReply?: () => void;
  placeholder?: string;
}

const MAX_CHARS = 500;

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  isSubmitting = false,
  replyToUsername,
  onCancelReply,
  placeholder = "Nhập bình luận...",
}) => {
  const [text, setText] = useState("");
  const isValid = text.trim().length > 0 && text.length <= MAX_CHARS;
  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;

  const handleSubmit = () => {
    if (!isValid || isSubmitting) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.container}>
        {/* Reply indicator */}
        {replyToUsername && (
          <View style={styles.replyIndicator}>
            <Text style={styles.replyText}>
              Đang trả lời <Text style={styles.replyUsername}>@{replyToUsername}</Text>
            </Text>
            <TouchableOpacity onPress={onCancelReply} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              isOverLimit && styles.inputError,
            ]}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={MAX_CHARS + 50} // Allow typing a bit over for visual feedback
            editable={!isSubmitting}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!isValid || isSubmitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <Ionicons name="hourglass-outline" size={20} color="#ccc" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={isValid ? "#34B27D" : "#ccc"}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Character count */}
        {charCount > 0 && (
          <View style={styles.footer}>
            <Text style={[styles.charCount, isOverLimit && styles.charCountError]}>
              {charCount}/{MAX_CHARS}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
  },
  replyText: {
    fontSize: 14,
    color: "#666",
  },
  replyUsername: {
    fontWeight: "600",
    color: "#34B27D",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#000",
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 4,
    paddingRight: 4,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
  },
  charCountError: {
    color: "#ef4444",
    fontWeight: "600",
  },
});
