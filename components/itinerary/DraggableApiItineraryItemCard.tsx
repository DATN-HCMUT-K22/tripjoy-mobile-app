import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import type { TripItemResponse } from "@/services/itineraries";

/**
 * Helper functions - matching app/itinerary/[id].tsx
 */
function locationDisplayName(loc?: TripItemResponse["location"] | null): string {
  if (!loc) return "(Chưa rõ)";
  if (loc.name) return loc.name;
  if (loc.full_address) return loc.full_address;
  if (loc.place_formatted) return loc.place_formatted;
  return "(Chưa đặt tên)";
}

function locationAddress(loc?: TripItemResponse["location"] | null): string {
  if (!loc) return "";
  return loc.full_address || loc.place_formatted || "";
}

function formatTimeRange(start?: string, durationMin?: number): string {
  if (!start) return "";

  try {
    const dt = new Date(start);
    const hh = String(dt.getHours()).padStart(2, "0");
    const mm = String(dt.getMinutes()).padStart(2, "0");
    const startStr = `${hh}:${mm}`;

    if (!durationMin || durationMin <= 0) return startStr;

    const endDt = new Date(dt.getTime() + durationMin * 60 * 1000);
    const ehh = String(endDt.getHours()).padStart(2, "0");
    const emm = String(endDt.getMinutes()).padStart(2, "0");
    const endStr = `${ehh}:${emm}`;

    return `${startStr} - ${endStr}`;
  } catch {
    return "";
  }
}

/**
 * Draggable API Itinerary Item Card
 * Combines drag & drop logic from AdjustableItem with TripItemResponse data structure
 */
export const DraggableApiItineraryItemCard = React.memo(
  function DraggableApiItineraryItemCard({
    row,
    index,
    total,
    canInteract,
    imageUrl,
    onMove,
    onDelete,
  }: {
    row: TripItemResponse;
    index: number;
    total: number;
    canInteract: boolean;
    imageUrl?: string;
    onMove: (from: number, to: number) => void;
    onDelete: () => void;
  }) {
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Reset animated values when index or total changes (item deleted or moved)
  useEffect(() => {
    translateY.value = 0;
    isDragging.value = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total]);

  const panGesture = Gesture.Pan()
    .enabled(canInteract)
    .activeOffsetY([-10, 10]) // Only activate when dragging vertically at least 10px
    .failOffsetX([-50, 50]) // Cancel if horizontal drag is too much
    .onStart(() => {
      "worklet";
      isDragging.value = true;
    })
    .onUpdate((e) => {
      "worklet";
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      "worklet";
      const itemHeight = 108; // 72px image + 2*12px padding + 12px margin
      const newIndex = Math.round(index + e.translationY / itemHeight);

      // Validate index before calling onMove
      if (
        newIndex >= 0 &&
        newIndex < total &&
        newIndex !== index &&
        !isNaN(newIndex) &&
        isFinite(newIndex)
      ) {
        // Use runOnJS to call JavaScript function from worklet
        runOnJS(onMove)(index, newIndex);
      }

      translateY.value = withSpring(0);
      isDragging.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: isDragging.value ? 0.8 : 1,
    zIndex: isDragging.value ? 1000 : 1,
  }));

  // Extract data from TripItemResponse
  const name = locationDisplayName(row.location);
  const address = locationAddress(row.location);
  const timeRange = formatTimeRange(row.start_time, row.duration);

  return (
    <Animated.View style={animatedStyle} className="mb-3">
      <View className="rounded-xl border border-gray-200 bg-white p-3">
        <View className="flex-row items-center">
          {/* Drag handle - only visible when can interact */}
          {canInteract && (
            <GestureDetector gesture={panGesture}>
              <View className="mr-3 flex-row">
                <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                <Ionicons
                  name="ellipsis-vertical"
                  size={20}
                  color="#666"
                  style={{ marginLeft: -10 }}
                />
              </View>
            </GestureDetector>
          )}

          {/* Image or placeholder */}
          <View
            className="rounded-lg overflow-hidden bg-gray-100"
            style={{ width: 112, height: 72 }}
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: 112, height: 72 }}
                contentFit="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="image-outline" size={30} color="#D1D5DB" />
              </View>
            )}
          </View>

          {/* Info */}
          <View className="flex-1 ml-3">
            <Text className="text-base font-bold text-black mb-1" numberOfLines={2}>
              {name}
            </Text>
            {timeRange ? (
              <Text className="text-xs text-gray-500 mb-1">{timeRange}</Text>
            ) : null}
            {address ? (
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {address}
              </Text>
            ) : null}
          </View>

          {/* Delete button - only visible when can interact */}
          {canInteract && (
            <TouchableOpacity
              onPress={onDelete}
              activeOpacity={0.7}
              className="ml-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
  },
  (prev, next) =>
    prev.row.id === next.row.id &&
    prev.index === next.index &&
    prev.total === next.total &&
    prev.canInteract === next.canInteract &&
    prev.imageUrl === next.imageUrl
);
