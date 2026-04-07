import { useItinerary } from "@/contexts/ItineraryContext";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import { ItineraryItem } from "@/types/itinerary";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// Component riêng cho mỗi draggable item
function DraggableItem({
  item,
  index,
  onDelete,
  onAddLocation,
  onMove,
  totalItems,
}: {
  item: ItineraryItem;
  index: number;
  onDelete: (id: string) => void;
  onAddLocation: (index: number) => void;
  onMove: (from: number, to: number) => void;
  totalItems: number;
}) {
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const itemHeight = 200; // Chiều cao ước tính của mỗi item
      const newIndex = Math.round(index + e.translationY / itemHeight);
      if (newIndex >= 0 && newIndex < totalItems && newIndex !== index) {
        onMove(index, newIndex);
      }
      translateY.value = withSpring(0);
      isDragging.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: isDragging.value ? 0.8 : 1,
      zIndex: isDragging.value ? 1000 : 1,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle} className="mb-4">
        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Drag handle và Delete button */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <View className="flex-row items-center gap-3">
              <Ionicons name="reorder-three-outline" size={24} color="#666" />
              <Text className="text-sm font-semibold text-gray-700">
                Kéo để sắp xếp
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Item content */}
          <View className="px-4 py-3">
            <View className="flex-row items-center mb-3">
              <Image
                source={{ uri: item.image }}
                style={{ width: 80, height: 80, borderRadius: 8 }}
                contentFit="cover"
              />
              <View className="flex-1 ml-3">
                <Text className="text-base font-bold text-black mb-1">
                  {item.name}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text className="text-sm text-gray-600">
                    {item.timeRange.start} - {item.timeRange.end}
                  </Text>
                </View>
              </View>
            </View>

            {/* Add location button */}
            <TouchableOpacity
              activeOpacity={0.8}
              className="mt-2 flex-row items-center justify-center py-3 rounded-lg border border-dashed border-primary bg-[#D1FAE5]"
              onPress={() => onAddLocation(index + 1)}
            >
              <View
                style={{
                  position: "relative",
                  width: 20,
                  height: 20,
                  marginRight: 8,
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="#34B27D"
                  style={{ position: "absolute" }}
                />
                <Ionicons
                  name="add"
                  size={8}
                  color="#34B27D"
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                  }}
                />
              </View>
              <Text className="text-sm font-semibold text-primary">
                Thêm địa điểm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function EditItineraryScreen() {
  const router = useRouter();
  const { exitToHome } = useCreateTripExitToHome();
  const { dayKey } = useLocalSearchParams<{ dayKey: string }>();
  const { itineraryItemsByDay, addItineraryItemsToDay } = useItinerary();
  const [items, setItems] = useState<ItineraryItem[]>(
    dayKey ? itineraryItemsByDay[dayKey] || [] : []
  );

  const handleDelete = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddLocation = (index: number) => {
    // Navigate to add location screen, với index để biết chèn vào đâu
    router.push({
      pathname: "/create/add-location",
      params: { dayKey: dayKey || "", insertIndex: index.toString() },
    } as any);
  };

  const handleSave = () => {
    if (dayKey) {
      addItineraryItemsToDay(dayKey, items);
    }
    router.back();
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    setItems(newItems);
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: ItineraryItem;
    index: number;
  }) => {
    return (
      <DraggableItem
        item={item}
        index={index}
        onDelete={handleDelete}
        onAddLocation={handleAddLocation}
        onMove={moveItem}
        totalItems={items.length}
      />
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center border-b border-gray-200 bg-white px-2 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-12 items-center justify-center"
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
          </TouchableOpacity>
          <View className="min-w-0 flex-1 items-center justify-center px-1">
            <Text className="text-center text-xl font-bold text-black" numberOfLines={1}>
              Chỉnh sửa lịch trình
            </Text>
          </View>
          <TouchableOpacity
            onPress={exitToHome}
            className="h-10 w-12 items-center justify-center"
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="home-outline" size={22} color="#34B27D" />
          </TouchableOpacity>
        </View>

        {/* Draggable List */}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          scrollEnabled={true}
        />

        {/* Save Button */}
        <View className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-primary rounded-full py-4 items-center justify-center"
            onPress={handleSave}
          >
            <Text className="text-white text-base font-semibold">Lưu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
