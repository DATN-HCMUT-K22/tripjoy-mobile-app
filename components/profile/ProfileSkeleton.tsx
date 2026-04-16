import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

const SKELETON_BG = "#E5E7EB";
const SKELETON_BG_LIGHT = "#F3F4F6";

export function ProfileSkeleton() {
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
    outputRange: [0.4, 0.8],
  });

  const SkeletonBox = ({
    width,
    height,
    borderRadius = 8,
    style,
  }: {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: object;
  }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: SKELETON_BG,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <View className="flex-1 bg-white">
      {/* User Info Section - giống layout khi có data */}
      <View className="px-4 pt-4 pb-3 bg-white">
        <View className="flex-row items-center justify-between mb-4 px-2">
          <View>
            <SkeletonBox width={160} height={22} borderRadius={6} />
            <SkeletonBox
              width={100}
              height={14}
              borderRadius={6}
              style={{ marginTop: 8 }}
            />
          </View>
          <View className="relative">
            <SkeletonBox width={60} height={60} borderRadius={30} />
            <View
              className="absolute -bottom-1 -right-1 rounded-full border-2 border-white"
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: SKELETON_BG_LIGHT,
              }}
            />
          </View>
        </View>
        <SkeletonBox
          width="100%"
          height={40}
          borderRadius={8}
          style={{ marginTop: 4 }}
        />
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-200 bg-white">
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-1 py-3 items-center">
            <SkeletonBox width={64} height={16} borderRadius={6} />
          </View>
        ))}
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3 bg-white">
        <SkeletonBox
          width="100%"
          height={40}
          borderRadius={8}
        />
      </View>

      {/* Content - post cards skeleton */}
      <View className="px-4 py-4">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="mb-4 bg-white rounded-xl overflow-hidden"
            style={{ borderWidth: 1, borderColor: "#F3F4F6" }}
          >
            <SkeletonBox
              width="100%"
              height={200}
              borderRadius={0}
            />
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <SkeletonBox width={140} height={16} borderRadius={6} />
                <View className="flex-row gap-3">
                  <SkeletonBox width={20} height={20} borderRadius={4} />
                  <SkeletonBox width={20} height={20} borderRadius={4} />
                </View>
              </View>
              <View className="flex-row flex-wrap items-center">
                <SkeletonBox width={180} height={14} borderRadius={6} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
