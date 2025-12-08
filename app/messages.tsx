import { mockGroups } from "@/data/mockGroups";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "personal" | "group";

export default function MessagesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("group");

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4 z-10"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black flex-1 text-center">
          Tin nhắn
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setActiveTab("personal")}
          className="flex-1 py-3 items-center"
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "personal" ? "text-primary" : "text-black"
            }`}
          >
            Cá nhân
          </Text>
          {activeTab === "personal" && (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("group")}
          className="flex-1 py-3 items-center"
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "group" ? "text-primary" : "text-black"
            }`}
          >
            Nhóm
          </Text>
          {activeTab === "group" && (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {activeTab === "group" ? (
          <View>
            {mockGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                activeOpacity={0.7}
                className="flex-row items-center px-4 py-3 border-b border-gray-100"
              >
                {/* Avatar */}
                <Image
                  source={{ uri: group.image }}
                  style={{ width: 56, height: 56, borderRadius: 28 }}
                  contentFit="cover"
                />

                {/* Content */}
                <View className="flex-1 ml-3">
                  <Text className="text-base font-bold text-black mb-1">
                    {group.name}
                  </Text>
                  <Text className="text-sm text-gray-600" numberOfLines={1}>
                    {group.lastMessage || "Chưa có tin nhắn"}
                  </Text>
                </View>

                {/* Badge */}
                {group.unreadCount > 0 && (
                  <View className="ml-3 bg-red-500 rounded-full min-w-[24px] h-6 items-center justify-center px-2">
                    <Text className="text-xs text-white font-bold">
                      {group.unreadCount > 9 ? "9+" : group.unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-center">
              Chưa có tin nhắn cá nhân nào
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
