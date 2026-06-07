import type { TripItemResponse } from "@/services/itineraries";
import { Ionicons } from "@expo/vector-icons";
import { LocationImage } from "@/components/location/LocationImage";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

/**
 * Helper functions - matching app/itinerary/[id].tsx
 */
function locationDisplayName(loc?: TripItemResponse["location"] | null, note?: string): string {
  if (loc) {
    if (loc.name?.trim()) return loc.name.trim();
    if (loc.full_address?.trim()) return loc.full_address.trim();
    if (loc.place_formatted?.trim()) return loc.place_formatted.trim();
  }
  if (note?.trim()) {
    const cleanNote = note.trim();
    const match = cleanNote.match(/^([^.,!?:;]+?)\s+(là|có|mang đến|mang lại|là bãi biển|là địa điểm|là một ngôi đền)/i);
    if (match && match[1].length < 60) return match[1].trim();

    const firstPart = cleanNote.split(/[.,!?:;]/)[0].trim();
    if (firstPart.length > 0 && firstPart.length < 60) return firstPart;

    return cleanNote.length > 50 ? cleanNote.substring(0, 47) + "..." : cleanNote;
  }
  return "Hoạt động";
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
    canUseAi = false,
    onMove,
    onDelete,
    onSuggest,
    onEdit,
    onPressLocation,
  }: {
    row: TripItemResponse;
    index: number;
    total: number;
    canInteract: boolean;
    canUseAi?: boolean;
    onMove: (from: number, to: number) => void;
    onDelete: () => void;
    onSuggest?: () => void;
    onEdit?: () => void;
    onPressLocation?: () => void;
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
  const name = locationDisplayName(row.location, row.note);
  const address = locationAddress(row.location);
  const timeRange = formatTimeRange(row.start_time, row.duration);

  return (
    <Animated.View style={animatedStyle} className="mb-3">
      <GestureDetector gesture={panGesture}>
        <View className="flex-row items-center py-4 px-4 w-full">
          {/* Drag handle - visual indicator */}
          {canInteract && (
            <View className="mr-3 flex-row items-center">
              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color="#666"
                style={{ marginLeft: -10 }}
              />
            </View>
          )}

          {/* Image and Info */}
          <TouchableOpacity onPress={onPressLocation} activeOpacity={0.7} disabled={!onPressLocation} className="flex-1 flex-row items-center">
            {/* Image */}
            <LocationImage
              location={row.location}
              style={{ width: '100%', height: '100%' }}
              containerStyle={{ width: 135, height: 80, borderRadius: 12 }}
            />

            {/* Info */}
            <View className="flex-1 ml-3">
              <Text className="text-base font-bold text-black mb-1" numberOfLines={1}>
                {name}
              </Text>
              {address ? (
                <Text className="text-xs text-gray-500 mb-1" numberOfLines={1}>
                  {address}
                </Text>
              ) : null}
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text className="ml-1 text-sm text-gray-600">
                  {timeRange || "Chưa đặt giờ"}
                </Text>
                {canInteract && onEdit && (
                  <TouchableOpacity
                    onPress={onEdit}
                    className="ml-2 rounded-full border border-blue-200 bg-blue-50 px-2 py-1"
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="pencil" size={14} color="#2563EB" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Actions */}
          <View className="ml-2 flex-row items-center">
            {canUseAi && onSuggest && (
              <TouchableOpacity
                onPress={onSuggest}
                activeOpacity={0.7}
                className="mr-2 p-2 bg-amber-50 rounded-full"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="sparkles" size={18} color="#D97706" />
              </TouchableOpacity>
            )}

            {canInteract && (
              <TouchableOpacity
                onPress={onDelete}
                activeOpacity={0.7}
                className="p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
  },
  (prev, next) =>
    prev.row.id === next.row.id &&
    prev.index === next.index &&
    prev.total === next.total &&
    prev.canInteract === next.canInteract &&
    prev.row.start_time === next.row.start_time &&
    prev.row.duration === next.row.duration
);
