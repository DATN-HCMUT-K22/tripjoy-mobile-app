import React, { useRef } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { ChatMessageResponse } from "@/types/message";

interface SwipeableMessageProps {
  message: ChatMessageResponse;
  currentUserId?: string;
  onSwipeToReply: (message: ChatMessageResponse) => void;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 80; // Khoảng cách swipe tối thiểu để trigger reply
const MAX_SWIPE = 100; // Giới hạn khoảng cách swipe tối đa

export const SwipeableMessage: React.FC<SwipeableMessageProps> = ({
  message,
  currentUserId,
  onSwipeToReply,
  children,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const translateX = useSharedValue(0);
  const hasTriggered = useRef(false);

  const isMe = message.sender?.id === currentUserId ||
               (message.sender as any)?.sender_id === currentUserId;

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Chỉ kích hoạt khi swipe ngang > 10px
    .onUpdate((event) => {
      // Chỉ cho phép swipe sang phải (translateX > 0)
      if (event.translationX > 0) {
        // Giới hạn swipe không quá MAX_SWIPE
        translateX.value = Math.min(event.translationX, MAX_SWIPE);
      }
    })
    .onEnd((event) => {
      // Kiểm tra nếu swipe đủ xa
      if (translateX.value >= SWIPE_THRESHOLD && !hasTriggered.current) {
        hasTriggered.current = true;
        // Trigger reply callback
        runOnJS(onSwipeToReply)(message);
      }

      // Reset về vị trí ban đầu
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });

      // Reset flag sau animation
      setTimeout(() => {
        hasTriggered.current = false;
      }, 300);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const replyIconStyle = useAnimatedStyle(() => {
    // Opacity từ 0 -> 1 khi swipe từ 0 -> SWIPE_THRESHOLD
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );

    // Scale từ 0.5 -> 1 để tạo hiệu ứng "pop"
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
      [0.5, 0.8, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Reply icon - hiển thị ở bên trái khi swipe */}
      <Animated.View
        style={[
          styles.replyIconContainer,
          replyIconStyle,
          {
            left: isMe ? 20 : 60, // Điều chỉnh vị trí theo message của mình/người khác
          },
        ]}
      >
        <Ionicons
          name="arrow-undo"
          size={24}
          color={isDark ? "#60A5FA" : "#3B82F6"}
        />
      </Animated.View>

      {/* Message content với swipe gesture */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.messageContainer, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  messageContainer: {
    flex: 1,
  },
  replyIconContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: -1, // Đặt icon phía sau message
  },
});
