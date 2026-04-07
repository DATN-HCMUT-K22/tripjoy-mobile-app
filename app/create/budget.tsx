import { BudgetItem } from "@/components/trip/BudgetItem";
import { BudgetManualRange } from "@/components/trip/BudgetManualRange";
import { Button } from "@/components/ui/Button";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { BUDGET_CUSTOM_ID, budgetOptions } from "@/data/budgetOptions";
import { Ionicons } from "@expo/vector-icons";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BudgetSelectionScreen() {
  const router = useRouter();
  const { exitToHome } = useCreateTripExitToHome();
  const { setBudget, setCustomBudgetRange, tripData } = useTripSetup();

  const handleSelect = (id: string) => {
    if (tripData.budget === id) {
      setBudget(null);
    } else {
      setBudget(id);
    }
  };

  const handleManualCommit = useCallback(
    (minVnd: number | null, maxVnd: number | null) => {
      setCustomBudgetRange(minVnd, maxVnd);
    },
    [setCustomBudgetRange],
  );

  const handleConfirm = () => {
    router.back();
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right", "bottom"]}
    >
      {/* Header: 3 cột — tránh absolute đè lên Text (bị cắt chữ / chỉ thấy một phần) */}
      <View className="flex-row items-center border-b border-gray-200 px-2 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-12 items-center justify-center"
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <View className="min-w-0 flex-1 items-center justify-center px-1">
          <Text
            className="text-center text-xl font-bold text-black"
            numberOfLines={1}
          >
            Chọn kinh phí
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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-5">
          <Text className="text-sm text-gray-600 mb-4">
            Chọn mức kinh phí phù hợp — bạn có thể đổi lại sau trong thiết lập
            chuyến.
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {budgetOptions.map((option) => (
              <BudgetItem
                key={option.id}
                id={option.id}
                title={option.title}
                subtitle={option.subtitle}
                priceRange={option.priceRange}
                icon={option.icon}
                iconColor={option.iconColor}
                gradient={option.gradient}
                isSelected={tripData.budget === option.id}
                onSelect={handleSelect}
              />
            ))}
          </View>
          <BudgetManualRange
            minVnd={tripData.budgetMinVnd}
            maxVnd={tripData.budgetMaxVnd}
            onCommit={handleManualCommit}
            disabled={
              tripData.budget != null && tripData.budget !== BUDGET_CUSTOM_ID
            }
          />
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        <Button title="Xác nhận" onPress={handleConfirm} variant="full" />
      </View>
    </SafeAreaView>
  );
}
