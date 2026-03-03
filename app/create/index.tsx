import { BudgetItem } from "@/components/trip/BudgetItem";
import { LocationItem } from "@/components/trip/LocationItem";
import { SectionHeader } from "@/components/trip/SectionHeader";
import { SimpleCalendar } from "@/components/trip/SimpleCalendar";
import { Button } from "@/components/ui/Button";
import { VietnamFlag } from "@/components/ui/VietnamFlag";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { budgetOptions } from "@/data/budgetOptions";
import { mockLocations } from "@/data/mockLocations";
import { tripTypeOptions } from "@/data/tripTypeOptions";
import { Location } from "@/types/trip";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateTripScreen() {
  const router = useRouter();
  const {
    tripData,
    setDepartureLocation,
    setDestinationLocation,
    setDateRange,
    setBudget,
    setTripTypes,
    setStartDate: setContextStartDate,
    setEndDate: setContextEndDate,
    resetTripData,
  } = useTripSetup();
  const [locations] = useState(mockLocations);
  const [departureLocation, setDepartureLocationState] =
    useState<Location | null>(tripData.departureLocation || null);
  const [destinationLocation, setDestinationLocationState] =
    useState<Location | null>(
      tripData.destinationLocation || tripData.location || null
    );
  const [departureSearchText, setDepartureSearchText] = useState("");
  const [destinationSearchText, setDestinationSearchText] = useState("");
  const [isDepartureExpanded, setIsDepartureExpanded] = useState(true);
  const [isDestinationExpanded, setIsDestinationExpanded] = useState(true);
  const [isTimeExpanded, setIsTimeExpanded] = useState(true);
  const [isBudgetExpanded, setIsBudgetExpanded] = useState(true);
  const [isTypeExpanded, setIsTypeExpanded] = useState(true);
  const [selectedTripTypes, setSelectedTripTypes] = useState<string[]>(
    tripData.tripTypes || []
  );
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>(
    tripData.budget || ""
  );
  const [startDate, setStartDate] = useState<string | null>(tripData.startDate);
  const [endDate, setEndDate] = useState<string | null>(tripData.endDate);
  const scrollViewRef = useRef<ScrollView>(null);

  const hasAllCriteria =
    !!departureLocation &&
    !!destinationLocation &&
    selectedTripTypes.length > 0 &&
    !!selectedBudgetId &&
    !!startDate &&
    !!endDate;

  // Reset data when user enters screen (fresh start)
  useFocusEffect(
    useCallback(() => {
      // Reset when screen gains focus (user enters)
      resetTripData();
    }, [resetTripData])
  );

  const handleDepartureLocationSelect = (location: Location) => {
    setDepartureLocationState(location);
    setDepartureLocation(location);
    // Không đụng vào state isSelected chung, để mỗi input dùng selected riêng
  };

  const handleDestinationLocationSelect = (location: Location) => {
    setDestinationLocationState(location);
    setDestinationLocation(location);
    // Không đụng vào state isSelected chung, để mỗi input dùng selected riêng
  };

  const toggleTripType = (type: string) => {
    const newTypes = selectedTripTypes.includes(type)
      ? selectedTripTypes.filter((t) => t !== type)
      : [...selectedTripTypes, type];
    setSelectedTripTypes(newTypes);
    setTripTypes(newTypes);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDateRangeSelect = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setContextStartDate(start);
    setContextEndDate(end);
    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);
    const dateRange = `Từ ${formattedStart} - ${formattedEnd}`;
    setDateRange(dateRange);
  };

  const handleBudgetSelect = (id: string) => {
    setSelectedBudgetId(id);
    setBudget(id);
  };

  const handleComplete = () => {
    // Save all data to context before navigating
    if (departureLocation) {
      setDepartureLocation(departureLocation);
    }
    if (destinationLocation) {
      setDestinationLocation(destinationLocation);
    }
    if (selectedTripTypes.length > 0) {
      setTripTypes(selectedTripTypes);
    }
    if (selectedBudgetId) {
      setBudget(selectedBudgetId);
    }
    // Ensure date range is saved
    if (startDate && endDate) {
      setContextStartDate(startDate);
      setContextEndDate(endDate);
      const formattedStart = formatDate(startDate);
      const formattedEnd = formatDate(endDate);
      const dateRange = `Từ ${formattedStart} - ${formattedEnd}`;
      setDateRange(dateRange);
    }
    // Navigate to summary
    router.push("/create/summary");
  };

  const selectedBudgetOption = budgetOptions.find(
    (opt) => opt.id === selectedBudgetId
  );

  const handleTypeToggle = () => {
    setIsTypeExpanded((prev) => {
      const willExpand = !prev;
      if (willExpand) {
        // Khi mở dropdown Loại hình thì auto scroll xuống phần cuối
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
      return willExpand;
    });
  };

  // Filter locations for departure
  const filteredDepartureLocations = useMemo(() => {
    if (!departureSearchText.trim()) return locations;
    const searchLower = departureSearchText.toLowerCase();
    return locations.filter(
      (loc) =>
        (loc.name?.toLowerCase() || "").includes(searchLower) ||
        (loc.subtitle?.toLowerCase() || "").includes(searchLower) ||
        (loc.specialty?.toLowerCase() || "").includes(searchLower)
    );
  }, [locations, departureSearchText]);

  // Filter locations for destination
  const filteredDestinationLocations = useMemo(() => {
    if (!destinationSearchText.trim()) return locations;
    const searchLower = destinationSearchText.toLowerCase();
    return locations.filter(
      (loc) =>
        (loc.name?.toLowerCase() || "").includes(searchLower) ||
        (loc.subtitle?.toLowerCase() || "").includes(searchLower) ||
        (loc.specialty?.toLowerCase() || "").includes(searchLower)
    );
  }, [locations, destinationSearchText]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Page Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => {
            resetTripData();
            router.back();
          }}
          className="absolute left-4 z-10"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black flex-1 text-center">
          Thiết lập chuyến đi
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Departure Location Section (Điểm đi) */}
          <View className="px-4 py-5">
            {/* Header with Search Input on same line */}
            <View className="flex-row items-center gap-3">
              <Ionicons name="location-outline" size={20} color="#000" />
              <Text className="text-base font-bold text-black">Điểm đi</Text>
              <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Ionicons name="search-outline" size={20} color="#666" />
                <TextInput
                  className="flex-1 ml-2 text-base text-gray-800"
                  placeholder="Tìm địa điểm..."
                  placeholderTextColor="#999"
                  value={departureSearchText}
                  onChangeText={setDepartureSearchText}
                  onSubmitEditing={() => {
                    setIsDepartureExpanded(true);
                  }}
                  returnKeyType="search"
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsDepartureExpanded(!isDepartureExpanded)}
              >
                <Ionicons
                  name={
                    isDepartureExpanded
                      ? "chevron-down-outline"
                      : "chevron-forward-outline"
                  }
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Selected Location - When collapsed */}
            {!isDepartureExpanded && departureLocation && (
              <View className="mt-2">
                <LocationItem
                  location={{
                    ...departureLocation,
                    isSelected: true,
                  }}
                  onSelect={() => setIsDepartureExpanded(true)}
                  showFlag={true}
                />
              </View>
            )}

            {/* Results - When expanded */}
            {isDepartureExpanded && (
              <>
                <View className="flex-row items-center justify-between mt-2 mb-3">
                  <Text className="text-sm text-gray-600">
                    <Text className="font-bold">
                      {filteredDepartureLocations.length}
                    </Text>{" "}
                    Kết quả
                  </Text>
                  <VietnamFlag size={20} />
                </View>

                {filteredDepartureLocations.map((location) => (
                  <LocationItem
                    key={location.id}
                    location={{
                      ...location,
                      isSelected: departureLocation?.id === location.id,
                    }}
                    onSelect={(loc) => {
                      handleDepartureLocationSelect(loc);
                    }}
                    showFlag={false}
                  />
                ))}
              </>
            )}
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 w-full" />

          {/* Destination Location Section (Điểm đến) */}
          <View className="px-4 py-5">
            {/* Header with Search Input on same line */}
            <View className="flex-row items-center gap-3">
              <Ionicons name="location-outline" size={20} color="#000" />
              <Text className="text-base font-bold text-black">Điểm đến</Text>
              <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Ionicons name="search-outline" size={20} color="#666" />
                <TextInput
                  className="flex-1 ml-2 text-base text-gray-800"
                  placeholder="Tìm địa điểm..."
                  placeholderTextColor="#999"
                  value={destinationSearchText}
                  onChangeText={setDestinationSearchText}
                  onSubmitEditing={() => {
                    setIsDestinationExpanded(true);
                  }}
                  returnKeyType="search"
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsDestinationExpanded(!isDestinationExpanded)}
              >
                <Ionicons
                  name={
                    isDestinationExpanded
                      ? "chevron-down-outline"
                      : "chevron-forward-outline"
                  }
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Selected Location - When collapsed */}
            {!isDestinationExpanded && destinationLocation && (
              <View className="mt-2">
                <LocationItem
                  location={{
                    ...destinationLocation,
                    isSelected: true,
                  }}
                  onSelect={() => setIsDestinationExpanded(true)}
                  showFlag={true}
                />
              </View>
            )}

            {/* Results - When expanded */}
            {isDestinationExpanded && (
              <>
                <View className="flex-row items-center justify-between mt-2 mb-3">
                  <Text className="text-sm text-gray-600">
                    <Text className="font-bold">
                      {filteredDestinationLocations.length}
                    </Text>{" "}
                    Kết quả
                  </Text>
                  <VietnamFlag size={20} />
                </View>

                {filteredDestinationLocations.map((location) => (
                  <LocationItem
                    key={location.id}
                    location={{
                      ...location,
                      isSelected: destinationLocation?.id === location.id,
                    }}
                    onSelect={(loc) => {
                      handleDestinationLocationSelect(loc);
                    }}
                    showFlag={false}
                  />
                ))}
              </>
            )}
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 w-full" />

          {/* Time Section */}
          <View className="px-4 py-5">
            <SectionHeader
              icon="calendar-outline"
              title="Thời gian"
              onToggle={() => setIsTimeExpanded(!isTimeExpanded)}
              isExpanded={isTimeExpanded}
            />

            {/* Selected Date Range - When collapsed */}
            {!isTimeExpanded && tripData.dateRange && (
              <View className="mt-2">
                <Text className="text-base text-gray-800">
                  {tripData.dateRange}
                </Text>
              </View>
            )}

            {/* Calendar - When expanded */}
            {isTimeExpanded && (
              <View className="mt-2">
                <SimpleCalendar
                  onDateRangeSelect={handleDateRangeSelect}
                  initialStartDate={startDate}
                  initialEndDate={endDate}
                />
                {startDate && endDate && (
                  <View className="mt-2 p-3 bg-primary rounded-full self-center">
                    <Text className="text-white text-sm font-medium">
                      {formatDate(startDate)} - {formatDate(endDate)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 w-full" />

          {/* Budget Section */}
          <View className="px-4 py-5">
            <SectionHeader
              icon="cash-outline"
              title="Kinh phí"
              onToggle={() => setIsBudgetExpanded(!isBudgetExpanded)}
              isExpanded={isBudgetExpanded}
            />

            {/* Selected Budget - When collapsed */}
            {!isBudgetExpanded && selectedBudgetOption && (
              <View className="mt-2">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-base text-gray-800">
                    {selectedBudgetOption.title}
                  </Text>
                  <Ionicons
                    name={selectedBudgetOption.icon}
                    size={20}
                    color={selectedBudgetOption.iconColor}
                  />
                </View>
                <Text className="text-sm text-gray-600">
                  {selectedBudgetOption.priceRange}
                </Text>
              </View>
            )}

            {/* Budget Options - When expanded */}
            {isBudgetExpanded && (
              <View className="mt-4">
                {budgetOptions.map((option) => (
                  <BudgetItem
                    key={option.id}
                    id={option.id}
                    title={option.title}
                    subtitle={option.subtitle}
                    priceRange={option.priceRange}
                    icon={option.icon}
                    iconColor={option.iconColor}
                    isSelected={selectedBudgetId === option.id}
                    onSelect={(id) => {
                      handleBudgetSelect(id);
                    }}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 w-full" />

          {/* Trip Type Section */}
          <View className="px-4 py-5">
            <SectionHeader
              icon="location-outline"
              title="Loại hình"
              onToggle={handleTypeToggle}
              isExpanded={isTypeExpanded}
            />

            {!isTypeExpanded && selectedTripTypes.length > 0 && (
              <View className="flex-row flex-wrap gap-3 mt-2">
                {selectedTripTypes.map((typeId) => {
                  const option = tripTypeOptions.find(
                    (opt) => opt.id === typeId
                  );
                  if (!option) return null;
                  return (
                    <View
                      key={typeId}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: "#D1FAE5",
                        borderWidth: 1,
                        borderColor: "#34B27D",
                      }}
                    >
                      <Text className="text-sm font-medium text-primary">
                        {option.icon} {option.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {isTypeExpanded && (
              <View className="flex-row flex-wrap gap-3 mt-2">
                {tripTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => toggleTripType(option.id)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: selectedTripTypes.includes(option.id)
                        ? "#D1FAE5"
                        : "transparent",
                      borderWidth: 1,
                      borderColor: selectedTripTypes.includes(option.id)
                        ? "#34B27D"
                        : "#E5E7EB",
                    }}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedTripTypes.includes(option.id)
                          ? "text-primary"
                          : "text-gray-600"
                      }`}
                    >
                      {option.icon} {option.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        {!hasAllCriteria && (
          <Text className="text-sm text-gray-600 mb-2 text-center">
            Bạn cần chọn đầy đủ các tiêu chí trước khi hoàn tất thiết lập.
          </Text>
        )}
        <Button
          title="Hoàn tất thiết lập"
          onPress={handleComplete}
          variant="full"
          disabled={!hasAllCriteria}
        />
      </View>
    </SafeAreaView>
  );
}
