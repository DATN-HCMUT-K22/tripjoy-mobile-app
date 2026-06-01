import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, TextInput, Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";

interface CommentInputProps {
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
  replyToUsername?: string;
  onCancelReply?: () => void;
  placeholder?: string;
  useBottomSheetInput?: boolean;
  autoFocus?: boolean;
}

const MAX_CHARS = 500;

export const CommentInput = React.forwardRef<any, CommentInputProps>(({
  onSubmit,
  isSubmitting = false,
  replyToUsername,
  onCancelReply,
  placeholder = "Nhập bình luận...",
  useBottomSheetInput = true,
  autoFocus = false,
}, ref) => {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  React.useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const isValid = text.trim().length > 0 && text.length <= MAX_CHARS;
  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;

  const inputRef = React.useRef<any>(null);

  React.useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    clear: () => {
      setText("");
    }
  }));

  React.useEffect(() => {
    if (replyToUsername) {
      inputRef.current?.focus();
    }
  }, [replyToUsername]);

  const handleSubmit = () => {
    if (!isValid || isSubmitting) return;
    onSubmit(text.trim());
    setText("");
  };

  const InputComponent = useBottomSheetInput ? BottomSheetTextInput : TextInput;

  return (
    <View style={[styles.container, { paddingBottom: isKeyboardVisible ? 12 : Math.max(12, insets.bottom) }]}>
      {/* Reply indicator */}
      {replyToUsername && (
        <View style={styles.replyIndicator}>
          <View style={styles.replyInfo}>
            <Ionicons name="arrow-undo" size={14} color="#34B27D" style={{ marginRight: 6 }} />
            <Text style={styles.replyText}>
              Đang trả lời <Text style={styles.replyUsername}>@{replyToUsername}</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        <InputComponent
          ref={inputRef}
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
          autoFocus={autoFocus}
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
  );
});

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
  replyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
