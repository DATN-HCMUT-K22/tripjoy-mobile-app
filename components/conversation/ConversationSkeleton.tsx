import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

interface ConversationSkeletonProps {
  showPin?: boolean;
}

export const ConversationSkeleton: React.FC<ConversationSkeletonProps> = ({
  showPin = false,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
      {/* Avatar Skeleton */}
      <View className="relative">
        <Animated.View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#E5E7EB",
            opacity,
          }}
        />
        {/* Pin indicator skeleton */}
        {showPin && (
          <View
            className="absolute -top-1 -right-1 bg-gray-300 rounded-full"
            style={{ padding: 2 }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#D1D5DB",
              }}
            />
          </View>
        )}
      </View>

      {/* Content Skeleton */}
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between mb-1">
          {/* Name skeleton */}
          <Animated.View
            style={{
              width: 120,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#E5E7EB",
              opacity,
            }}
          />
          {/* Time skeleton */}
          <Animated.View
            style={{
              width: 50,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#E5E7EB",
              opacity,
              marginLeft: 8,
            }}
          />
        </View>
        {/* Message skeleton */}
        <View className="flex-row items-center">
          <Animated.View
            style={{
              flex: 1,
              height: 14,
              borderRadius: 7,
              backgroundColor: "#E5E7EB",
              opacity,
            }}
          />
          {/* Unread badge skeleton */}
          <Animated.View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#E5E7EB",
              opacity,
              marginLeft: 8,
            }}
          />
        </View>
      </View>
    </View>
  );
};

interface ConversationListSkeletonProps {
  count?: number;
  showPin?: boolean;
}

export const ConversationListSkeleton: React.FC<
  ConversationListSkeletonProps
> = ({ count = 5, showPin = false }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <ConversationSkeleton key={index} showPin={index < 2 && showPin} />
      ))}
    </View>
  );
};
