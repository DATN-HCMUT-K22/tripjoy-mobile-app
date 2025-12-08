import { BudgetItem } from "@/components/trip/BudgetItem";
import { Button } from "@/components/ui/Button";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const budgetOptions = [
  {
    id: "flexible",
    title: "Linh hoạt",
    subtitle: "Không giới hạn ngân sách",
    priceRange: "20.000.000 - 100.000.000+ VNĐ/người",
    icon: "diamond" as keyof typeof Ionicons.glyphMap,
    iconColor: "#34B27D",
  },
  {
    id: "budget",
    title: "Tiết kiệm",
    subtitle: "Tối ưu chi phí",
    priceRange: "5.000.000 - 10.000.000 VNĐ/người",
    icon: "wallet" as keyof typeof Ionicons.glyphMap,
    iconColor: "#F59E0B",
  },
  {
    id: "mid",
    title: "Trung bình",
    subtitle: "Cân bằng chất lượng và giá",
    priceRange: "10.000.000 - 20.000.000 VNĐ/người",
    icon: "cash" as keyof typeof Ionicons.glyphMap,
    iconColor: "#3B82F6",
  },
  {
    id: "luxury",
    title: "Cao cấp",
    subtitle: "Trải nghiệm sang trọng",
    priceRange: "50.000.000 - 200.000.000+ VNĐ/người",
    icon: "trophy" as keyof typeof Ionicons.glyphMap,
    iconColor: "#8B5CF6",
  },
];

export default function BudgetSelectionScreen() {
  const router = useRouter();
  const { setBudget, tripData } = useTripSetup();
  const [selectedBudget, setSelectedBudget] = useState<string>(
    tripData.budget || "flexible"
  );

  const handleSelect = (id: string) => {
    setSelectedBudget(id);
  };

  const handleConfirm = () => {
    setBudget(selectedBudget);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4 z-10"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black flex-1 text-center">
          Chọn kinh phí
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-5">
          {budgetOptions.map((option) => (
            <BudgetItem
              key={option.id}
              id={option.id}
              title={option.title}
              subtitle={option.subtitle}
              priceRange={option.priceRange}
              icon={option.icon}
              iconColor={option.iconColor}
              isSelected={selectedBudget === option.id}
              onSelect={handleSelect}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        <Button title="Xác nhận" onPress={handleConfirm} variant="full" />
      </View>
    </SafeAreaView>
  );
}
