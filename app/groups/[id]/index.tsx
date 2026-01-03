import { ItineraryCard, ItineraryListItem } from "@/components/group";
import { BottomNavigation } from "@/components/social/BottomNavigation";
import { mockGroups } from "@/data/mockGroups";
import { mockItineraries } from "@/data/mockItineraries";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ViewMode = "card" | "list";

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const group = mockGroups.find((g) => g.id === id);
  const itineraries = mockItineraries.filter((it) => it.groupId === id);

  if (!group) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Không tìm thấy nhóm</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-2 bg-primary rounded-lg"
        >
          <Text className="text-white">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#0D9488", "#047857"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          minHeight: 140,
        }}
        className="pt-4 pb-6"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4 top-4 z-10"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View className="flex-row items-start gap-3 mt-16 px-4">
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "#14B8A6",
              borderWidth: 3,
              borderColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-white font-bold text-2xl">
              {group.initial}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white mb-2">
              {group.name}
            </Text>
            <View className="flex-row items-end gap-4">
              <View className="flex-row items-center gap-1">
                <Ionicons name="people" size={16} color="#86EFAC" />
                <Text className="text-white text-sm">
                  {group.memberCount} thành viên
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="location" size={16} color="#86EFAC" />
                <Text className="text-white text-sm">
                  {group.itineraryCount} lịch trình
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Group Description */}
        <View className="bg-gray-100 px-4 py-3 mt-4">
          <Text className="text-sm text-gray-700">{group.description}</Text>
        </View>

        {/* Itineraries Section */}
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-black">Lịch trình</Text>
            <View className="flex-row items-center gap-3">
              {itineraries.length > 0 && (
                <View className="flex-row bg-gray-100 rounded-lg p-1">
                  <TouchableOpacity
                    onPress={() => setViewMode("card")}
                    activeOpacity={0.7}
                    className={`px-3 py-1 rounded ${
                      viewMode === "card" ? "bg-primary" : "bg-transparent"
                    }`}
                  >
                    <Ionicons
                      name="grid-outline"
                      size={18}
                      color={viewMode === "card" ? "#fff" : "#666"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setViewMode("list")}
                    activeOpacity={0.7}
                    className={`px-3 py-1 rounded ${
                      viewMode === "list" ? "bg-primary" : "bg-transparent"
                    }`}
                  >
                    <Ionicons
                      name="list-outline"
                      size={18}
                      color={viewMode === "list" ? "#fff" : "#666"}
                    />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                activeOpacity={0.7}
                className="px-4 py-2 bg-primary rounded-lg"
                onPress={() => router.push("/create" as any)}
              >
                <Text className="text-white font-semibold text-sm">+ Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Empty State */}
          {itineraries.length === 0 ? (
            <View className="bg-gray-100 rounded-xl py-16 items-center">
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#E5E5E5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="location-outline" size={48} color="#34B27D" />
              </View>
              <Text className="text-lg font-bold text-black mt-4 mb-2">
                Chưa có lịch trình
              </Text>
              <Text className="text-sm text-gray-600 text-center px-4">
                Thêm lịch trình cho nhóm này
              </Text>
            </View>
          ) : (
            /* Itineraries List */
            <>
              {viewMode === "card" ? (
                <>
                  {itineraries.map((itinerary) => (
                    <ItineraryCard key={itinerary.id} itinerary={itinerary} />
                  ))}
                </>
              ) : (
                <>
                  {itineraries.map((itinerary) => (
                    <ItineraryListItem
                      key={itinerary.id}
                      itinerary={itinerary}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </SafeAreaView>
  );
}
