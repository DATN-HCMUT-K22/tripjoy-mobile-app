import { BudgetItem } from "@/components/trip/BudgetItem";
import { BudgetManualRange } from "@/components/trip/BudgetManualRange";
import { LocationItem } from "@/components/trip/LocationItem";
import { SectionHeader } from "@/components/trip/SectionHeader";
import { SimpleCalendar } from "@/components/trip/SimpleCalendar";
import { Button } from "@/components/ui/Button";
import { VietnamFlag } from "@/components/ui/VietnamFlag";
import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { useItinerary } from "@/contexts/ItineraryContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { BUDGET_CUSTOM_ID, budgetOptions } from "@/data/budgetOptions";
import { sampleProvinceLocations } from "@/data/sampleProvinceLocations";
import { tripTypeOptions } from "@/data/tripTypeOptions";
import { useProvinceLocations } from "@/hooks/useProvinceLocations";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import { Location } from "@/types/trip";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatCurrencyVND } from "@/utils/format";
import { showErrorToast } from "@/utils/toast";

/** Chiều cao tối đa vùng danh sách điểm đi / điểm đến (scroll nội bộ). */
const LOCATION_LIST_MAX_HEIGHT_CAP = 320;
const LOCATION_LIST_MAX_HEIGHT_RATIO = 0.36;

/** Thẻ loại hình (màn thiết lập): gọn + 2 hàng trong một ScrollView ngang. */
const TRIP_TYPE_CARD_WIDTH = 86;
const TRIP_TYPE_CARD_MIN_HEIGHT = 82;
const TRIP_TYPE_CARD_GAP = 8;

export default function CreateTripScreen() {
  const router = useRouter();
  const { exitToHome } = useCreateTripExitToHome();
  const { resetItinerary } = useItinerary();
  const { height: windowHeight } = useWindowDimensions();
  const locationListMaxHeight = useMemo(
    () =>
      Math.min(
        LOCATION_LIST_MAX_HEIGHT_CAP,
        Math.round(windowHeight * LOCATION_LIST_MAX_HEIGHT_RATIO)
      ),
    [windowHeight]
  );

  const {
    tripData,
    setDepartureLocation,
    setDestinationLocation,
    setDateRange,
    setBudget,
    setCustomBudgetRange,
    setTripTypes,
    adjustPeopleQuantity,
    setStartDate: setContextStartDate,
    setEndDate: setContextEndDate,
    resetTripData,
  } = useTripSetup();

  const {
    data: apiLocations,
    isLoading: isLoadingProvinces,
    isError: isProvincesError,
    error: provincesError,
    refetch: refetchProvinces,
  } = useProvinceLocations();

  /**
   * Có API: chỉ danh sách BE (63 tỉnh/thành).
   * Đang tải lần đầu: [] — không flash 5 tỉnh mẫu (trước đây api rỗng → nhầm hiển thị mẫu).
   * Tải xong mà rỗng/lỗi: fallback 5 tỉnh mẫu.
   */
  const locations: Location[] = useMemo(() => {
    const samples = sampleProvinceLocations;
    if (EXPO_PUBLIC_MOCK_DATA) return samples;

    const apiList = apiLocations ?? [];
    if (apiList.length > 0) return apiList;
    if (isLoadingProvinces) return [];
    return samples;
  }, [apiLocations, isLoadingProvinces]);

  const useCompactLocationRow = !EXPO_PUBLIC_MOCK_DATA;

  /** Hai hàng loại hình: mỗi hàng cuộn ngang độc lập. */
  const tripTypeRows = useMemo(() => {
    const mid = Math.ceil(tripTypeOptions.length / 2);
    return [tripTypeOptions.slice(0, mid), tripTypeOptions.slice(mid)];
  }, []);

  const [departureLocation, setDepartureLocationState] =
    useState<Location | null>(null);
  const [destinationLocation, setDestinationLocationState] =
    useState<Location | null>(null);
  const [departureSearchText, setDepartureSearchText] = useState("");
  const [destinationSearchText, setDestinationSearchText] = useState("");
  const [debouncedDepartureSearchText, setDebouncedDepartureSearchText] = useState("");
  const [debouncedDestinationSearchText, setDebouncedDestinationSearchText] = useState("");
  const [isDepartureExpanded, setIsDepartureExpanded] = useState(true);
  const [isDestinationExpanded, setIsDestinationExpanded] = useState(true);
  const [isPeopleExpanded, setIsPeopleExpanded] = useState(true);
  const [isTimeExpanded, setIsTimeExpanded] = useState(true);
  const [isBudgetExpanded, setIsBudgetExpanded] = useState(true);
  const [isTypeExpanded, setIsTypeExpanded] = useState(true);
  const [selectedTripTypes, setSelectedTripTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const provincesErrorToastShownRef = useRef(false);

  const budgetOk = useMemo(() => {
    const b = tripData.budget;
    if (!b) return false;
    if (b === BUDGET_CUSTOM_ID) {
      return (
        tripData.budgetMinVnd != null &&
        tripData.budgetMaxVnd != null &&
        tripData.budgetMaxVnd > tripData.budgetMinVnd
      );
    }
    return true;
  }, [tripData.budget, tripData.budgetMinVnd, tripData.budgetMaxVnd]);

  const hasAllCriteria =
    !!departureLocation &&
    !!destinationLocation &&
    selectedTripTypes.length > 0 &&
    budgetOk &&
    !!startDate &&
    !!endDate &&
    tripData.peopleQuantity >= 1;

  // Reset khi vào màn — đồng bộ context + state local
  useFocusEffect(
    useCallback(() => {
      resetTripData();
      setDepartureLocationState(null);
      setDestinationLocationState(null);
      setDepartureSearchText("");
      setDestinationSearchText("");
      setSelectedTripTypes([]);
      setStartDate(null);
      setEndDate(null);
      setIsDepartureExpanded(true);
      setIsDestinationExpanded(true);
      setIsPeopleExpanded(true);
      setIsTimeExpanded(true);
      setIsBudgetExpanded(true);
      setIsTypeExpanded(true);
    }, [resetTripData])
  );

  useEffect(() => {
    if (isProvincesError && !provincesErrorToastShownRef.current) {
      provincesErrorToastShownRef.current = true;
      showErrorToast(
        "Không tải được danh sách địa điểm",
        provincesError instanceof Error
          ? provincesError.message
          : "Hãy kiểm tra kết nối và thử lại."
      );
    }
    if (!isProvincesError) provincesErrorToastShownRef.current = false;
  }, [isProvincesError, provincesError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDepartureSearchText(departureSearchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [departureSearchText]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDestinationSearchText(destinationSearchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [destinationSearchText]);

  const handleDepartureLocationSelect = (location: Location) => {
    setDepartureLocationState(location);
    setDepartureLocation(location);
  };

  const handleDestinationLocationSelect = (location: Location) => {
    setDestinationLocationState(location);
    setDestinationLocation(location);
  };

  const toggleTripType = (type: string) => {
    const newTypes = selectedTripTypes.includes(type)
      ? selectedTripTypes.filter((t) => t !== type)
      : [...selectedTripTypes, type];
    setSelectedTripTypes(newTypes);
    setTripTypes(newTypes);
  };

  const bumpPeople = (delta: number) => {
    adjustPeopleQuantity(delta);
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
    if (tripData.budget === id) {
      setBudget(null);
    } else {
      setBudget(id);
    }
  };

  const handleManualBudgetCommit = useCallback(
    (minVnd: number | null, maxVnd: number | null) => {
      setCustomBudgetRange(minVnd, maxVnd);
    },
    [setCustomBudgetRange]
  );

  const handleComplete = () => {
    if (departureLocation) setDepartureLocation(departureLocation);
    if (destinationLocation) setDestinationLocation(destinationLocation);
    if (selectedTripTypes.length > 0) setTripTypes(selectedTripTypes);
    if (startDate && endDate) {
      setContextStartDate(startDate);
      setContextEndDate(endDate);
      const formattedStart = formatDate(startDate);
      const formattedEnd = formatDate(endDate);
      setDateRange(`Từ ${formattedStart} - ${formattedEnd}`);
    }
    router.push("/create/summary");
  };

  const selectedBudgetOption = budgetOptions.find(
    (opt) => opt.id === tripData.budget
  );

  const handleTypeToggle = () => {
    setIsTypeExpanded((prev) => {
      const willExpand = !prev;
      if (willExpand) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
      return willExpand;
    });
  };

  const filteredDepartureLocations = useMemo(() => {
    if (!debouncedDepartureSearchText.trim()) return locations;
    const searchLower = debouncedDepartureSearchText.toLowerCase();
    return locations.filter(
      (loc) =>
        (loc.name?.toLowerCase() || "").includes(searchLower) ||
        (loc.subtitle?.toLowerCase() || "").includes(searchLower) ||
        (loc.specialty?.toLowerCase() || "").includes(searchLower)
    );
  }, [locations, debouncedDepartureSearchText]);

  const filteredDestinationLocations = useMemo(() => {
    if (!debouncedDestinationSearchText.trim()) return locations;
    const searchLower = debouncedDestinationSearchText.toLowerCase();
    return locations.filter(
      (loc) =>
        (loc.name?.toLowerCase() || "").includes(searchLower) ||
        (loc.subtitle?.toLowerCase() || "").includes(searchLower) ||
        (loc.specialty?.toLowerCase() || "").includes(searchLower)
    );
  }, [locations, debouncedDestinationSearchText]);

  const renderLocationList = (
    filtered: Location[],
    selected: Location | null,
    onSelect: (loc: Location) => void
  ) => {
    return (
      <>
        {!EXPO_PUBLIC_MOCK_DATA && isLoadingProvinces && filtered.length === 0 && (
          <View className="flex-row items-center gap-2 py-2 mb-2 px-1">
            <ActivityIndicator size="small" color="#34B27D" />
            <Text className="text-xs text-gray-500 flex-1">
              Đang tải danh sách tỉnh/thành từ máy chủ…
            </Text>
          </View>
        )}
        <ScrollView
          style={{ maxHeight: locationListMaxHeight }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          {filtered.map((location) => (
            <LocationItem
              key={location.id}
              location={{
                ...location,
                isSelected: selected?.id === location.id,
              }}
              onSelect={onSelect}
              showFlag={false}
              compact={useCompactLocationRow}
            />
          ))}
        </ScrollView>
      </>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-row items-center border-b border-gray-100 px-2 py-3">
        <TouchableOpacity
          onPress={() => {
            resetItinerary();
            resetTripData();
            router.back();
          }}
          className="h-10 w-12 items-center justify-center"
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <View className="min-w-0 flex-1 items-center justify-center px-1">
          <Text className="text-center text-xl font-bold text-black" numberOfLines={1}>
            Thiết lập chuyến đi
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

      {isProvincesError && (
        <View className="px-4 py-2 bg-red-50 border-b border-red-100 flex-row items-center justify-between">
          <Text className="text-sm text-red-800 flex-1 pr-2">
            Không tải được tỉnh/thành từ máy chủ.
          </Text>
          <TouchableOpacity onPress={() => refetchProvinces()} activeOpacity={0.7}>
            <Text className="text-sm font-semibold text-red-700">Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          {/* Điểm đi */}
          <View className="px-4 py-5">
            <View className="flex-row items-center gap-3">
              <Ionicons name="navigate-outline" size={20} color="#059669" />
              <Text className="text-base font-bold text-black">Điểm đi</Text>
              <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5">
                <Ionicons name="search-outline" size={20} color="#666" />
                <TextInput
                  className="flex-1 ml-2 text-base text-gray-800"
                  placeholder="Tìm tỉnh, thành phố..."
                  placeholderTextColor="#999"
                  value={departureSearchText}
                  onChangeText={setDepartureSearchText}
                  onSubmitEditing={() => setIsDepartureExpanded(true)}
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

            {!isDepartureExpanded && departureLocation && (
              <View className="mt-2">
                <LocationItem
                  location={{ ...departureLocation, isSelected: true }}
                  onSelect={() => setIsDepartureExpanded(true)}
                  showFlag
                  compact={useCompactLocationRow}
                />
              </View>
            )}

            {isDepartureExpanded && (
              <>
                <View className="flex-row items-center justify-between mt-2 mb-3">
                  <Text className="text-sm text-gray-600">
                    <Text className="font-bold">
                      {filteredDepartureLocations.length}
                    </Text>{" "}
                    địa điểm
                  </Text>
                  <VietnamFlag size={20} />
                </View>
                {renderLocationList(
                  filteredDepartureLocations,
                  departureLocation,
                  handleDepartureLocationSelect
                )}
              </>
            )}
          </View>

          <View className="h-px bg-gray-200 w-full" />

          {/* Điểm đến */}
          <View className="px-4 py-5">
            <View className="flex-row items-center gap-3">
              <Ionicons name="location-outline" size={20} color="#DC2626" />
              <Text className="text-base font-bold text-black">Điểm đến</Text>
              <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5">
                <Ionicons name="search-outline" size={20} color="#666" />
                <TextInput
                  className="flex-1 ml-2 text-base text-gray-800"
                  placeholder="Tìm tỉnh, thành phố..."
                  placeholderTextColor="#999"
                  value={destinationSearchText}
                  onChangeText={setDestinationSearchText}
                  onSubmitEditing={() => setIsDestinationExpanded(true)}
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

            {!isDestinationExpanded && destinationLocation && (
              <View className="mt-2">
                <LocationItem
                  location={{ ...destinationLocation, isSelected: true }}
                  onSelect={() => setIsDestinationExpanded(true)}
                  showFlag
                  compact={useCompactLocationRow}
                />
              </View>
            )}

            {isDestinationExpanded && (
              <>
                <View className="flex-row items-center justify-between mt-2 mb-3">
                  <Text className="text-sm text-gray-600">
                    <Text className="font-bold">
                      {filteredDestinationLocations.length}
                    </Text>{" "}
                    địa điểm
                  </Text>
                  <VietnamFlag size={20} />
                </View>
                {renderLocationList(
                  filteredDestinationLocations,
                  destinationLocation,
                  handleDestinationLocationSelect
                )}
              </>
            )}
          </View>

          <View className="h-px bg-gray-200 w-full" />

          {/* Số người */}
          <View className="px-4 py-5">
            <SectionHeader
              icon="people-outline"
              title="Số người tham gia"
              onToggle={() => setIsPeopleExpanded(!isPeopleExpanded)}
              isExpanded={isPeopleExpanded}
            />
            {!isPeopleExpanded && (
              <Text className="text-base text-gray-800 mt-2">
                {tripData.peopleQuantity} người
              </Text>
            )}
            {isPeopleExpanded && (
              <View className="mt-4 items-center">
                <Text className="text-sm text-gray-500 mb-2 text-center px-2">
                  Ước lượng số thành viên trong chuyến (tối đa 50)
                </Text>
                <View className="flex-row items-center justify-center gap-6">
                  <TouchableOpacity
                    className="w-14 h-14 rounded-2xl bg-gray-100 items-center justify-center border border-gray-200"
                    onPress={() => bumpPeople(-1)}
                    disabled={tripData.peopleQuantity <= 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="remove"
                      size={28}
                      color={
                        tripData.peopleQuantity <= 1 ? "#D1D5DB" : "#111827"
                      }
                    />
                  </TouchableOpacity>
                  <LinearGradient
                    colors={["#D1FAE5", "#A7F3D0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 36,
                      paddingVertical: 20,
                      borderRadius: 20,
                      minWidth: 120,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 36,
                        fontWeight: "800",
                        color: "#047857",
                      }}
                    >
                      {tripData.peopleQuantity}
                    </Text>
                    <Text className="text-xs font-semibold text-emerald-800 mt-1">
                      người
                    </Text>
                  </LinearGradient>
                  <TouchableOpacity
                    className="w-14 h-14 rounded-2xl bg-gray-100 items-center justify-center border border-gray-200"
                    onPress={() => bumpPeople(1)}
                    disabled={tripData.peopleQuantity >= 50}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="add"
                      size={28}
                      color={
                        tripData.peopleQuantity >= 50 ? "#D1D5DB" : "#111827"
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View className="h-px bg-gray-200 w-full" />

          <View className="px-4 py-5">
            <SectionHeader
              icon="calendar-outline"
              title="Thời gian"
              onToggle={() => setIsTimeExpanded(!isTimeExpanded)}
              isExpanded={isTimeExpanded}
            />
            {!isTimeExpanded && tripData.dateRange && (
              <View className="mt-2">
                <Text className="text-base text-gray-800">
                  {tripData.dateRange}
                </Text>
              </View>
            )}
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

          <View className="h-px bg-gray-200 w-full" />

          <View className="px-4 py-5">
            <SectionHeader
              icon="cash-outline"
              title="Kinh phí"
              onToggle={() => setIsBudgetExpanded(!isBudgetExpanded)}
              isExpanded={isBudgetExpanded}
            />
            {!isBudgetExpanded &&
              tripData.budget === BUDGET_CUSTOM_ID &&
              tripData.budgetMinVnd != null &&
              tripData.budgetMaxVnd != null && (
                <LinearGradient
                  colors={["#F0FDFA", "#CCFBF1"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    marginTop: 10,
                    borderRadius: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderWidth: 2,
                    borderColor: "#0D9488",
                  }}
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          backgroundColor: "rgba(255,255,255,0.95)",
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          borderColor: "rgba(0,0,0,0.06)",
                        }}
                      >
                        <Ionicons
                          name="options-outline"
                          size={24}
                          color="#0D9488"
                        />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text
                          className="text-base font-bold"
                          style={{ color: "#0F766E" }}
                          numberOfLines={1}
                        >
                          Khoảng tùy chỉnh
                        </Text>
                        <Text
                          className="text-xs text-gray-700 mt-0.5"
                          numberOfLines={2}
                        >
                          {formatCurrencyVND(tripData.budgetMinVnd)} —{" "}
                          {formatCurrencyVND(tripData.budgetMaxVnd)} / người
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="checkmark-circle"
                      size={26}
                      color="#0D9488"
                    />
                  </View>
                </LinearGradient>
              )}
            {!isBudgetExpanded && selectedBudgetOption && (
              <LinearGradient
                colors={selectedBudgetOption.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  marginTop: 10,
                  borderRadius: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderWidth: 2,
                  borderColor: selectedBudgetOption.iconColor,
                }}
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: "rgba(255,255,255,0.95)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "rgba(0,0,0,0.06)",
                      }}
                    >
                      <Ionicons
                        name={selectedBudgetOption.icon}
                        size={24}
                        color={selectedBudgetOption.iconColor}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-base font-bold"
                        style={{ color: selectedBudgetOption.iconColor }}
                        numberOfLines={1}
                      >
                        {selectedBudgetOption.title}
                      </Text>
                      <Text
                        className="text-xs text-gray-700 mt-0.5"
                        numberOfLines={2}
                      >
                        {selectedBudgetOption.priceRange}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="checkmark-circle"
                    size={26}
                    color={selectedBudgetOption.iconColor}
                  />
                </View>
              </LinearGradient>
            )}
            {isBudgetExpanded && (
              <View>
                <Text className="text-xs text-gray-500 mt-1 mb-3">
                  Chọn mức gợi ý hoặc nhập khoảng chi phí (VNĐ / người)
                </Text>
                <View
                  className="flex-row flex-wrap"
                  style={{ gap: 10, marginTop: 2 }}
                >
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
                      onSelect={(id) => handleBudgetSelect(id)}
                    />
                  ))}
                </View>
                <BudgetManualRange
                  minVnd={tripData.budgetMinVnd}
                  maxVnd={tripData.budgetMaxVnd}
                  onCommit={handleManualBudgetCommit}
                  disabled={
                    tripData.budget != null &&
                    tripData.budget !== BUDGET_CUSTOM_ID
                  }
                />
              </View>
            )}
          </View>

          <View className="h-px bg-gray-200 w-full" />

          <View className="px-4 py-5 pb-8">
            <SectionHeader
              icon="color-palette-outline"
              title="Loại hình du lịch"
              onToggle={handleTypeToggle}
              isExpanded={isTypeExpanded}
            />
            <Text className="text-xs text-gray-500 mt-1 mb-2">
              Chọn một hoặc nhiều — càng đa dạng, gợi ý càng khớp sở thích
            </Text>

            {!isTypeExpanded && selectedTripTypes.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                className="mt-2"
                contentContainerStyle={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingRight: 4,
                  gap: 8,
                }}
              >
                {selectedTripTypes.map((typeId) => {
                  const option = tripTypeOptions.find((o) => o.id === typeId);
                  if (!option) return null;
                  return (
                    <LinearGradient
                      key={typeId}
                      colors={option.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1.5,
                        borderColor: option.accent,
                      }}
                    >
                      <View className="flex-row items-center gap-1">
                        <Ionicons
                          name={option.ionIcon}
                          size={16}
                          color={option.accent}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: option.accent,
                          }}
                        >
                          {option.icon} {option.name}
                        </Text>
                      </View>
                    </LinearGradient>
                  );
                })}
              </ScrollView>
            )}

            {isTypeExpanded && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                className="mt-3"
                contentContainerStyle={{
                  flexDirection: "column",
                  gap: TRIP_TYPE_CARD_GAP,
                  paddingRight: 8,
                  paddingVertical: 4,
                }}
              >
                {tripTypeRows.map((row, rowIndex) => (
                  <View
                    key={rowIndex}
                    style={{
                      flexDirection: "row",
                      alignItems: "stretch",
                      gap: TRIP_TYPE_CARD_GAP,
                    }}
                  >
                    {row.map((option) => {
                      const selected = selectedTripTypes.includes(option.id);
                      return (
                        <TouchableOpacity
                          key={option.id}
                          onPress={() => toggleTripType(option.id)}
                          activeOpacity={0.85}
                          style={{
                            width: TRIP_TYPE_CARD_WIDTH,
                            borderRadius: 12,
                            overflow: "hidden",
                          }}
                        >
                          <LinearGradient
                            colors={
                              selected
                                ? option.gradient
                                : (["#F9FAFB", "#F3F4F6"] as [string, string])
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              paddingVertical: 6,
                              paddingHorizontal: 6,
                              borderRadius: 12,
                              borderWidth: selected ? 1.5 : 1,
                              borderColor: selected ? option.accent : "#E5E7EB",
                              minHeight: TRIP_TYPE_CARD_MIN_HEIGHT,
                              justifyContent: "space-between",
                            }}
                          >
                            <View className="flex-row items-center gap-0.5">
                              <View
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 8,
                                  backgroundColor: selected
                                    ? "rgba(255,255,255,0.85)"
                                    : "#fff",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Ionicons
                                  name={option.ionIcon}
                                  size={15}
                                  color={option.accent}
                                />
                              </View>
                              <Text style={{ fontSize: 14 }}>{option.icon}</Text>
                            </View>
                            <Text
                              className="font-bold"
                              style={{
                                fontSize: 10,
                                lineHeight: 13,
                                color: selected ? option.accent : "#374151",
                              }}
                              numberOfLines={2}
                            >
                              {option.name}
                            </Text>
                            {selected ? (
                              <View className="flex-row items-center gap-0.5 mt-0.5">
                                <Ionicons
                                  name="checkmark-circle"
                                  size={11}
                                  color={option.accent}
                                />
                                <Text
                                  className="font-semibold"
                                  style={{
                                    fontSize: 9,
                                    color: option.accent,
                                  }}
                                  numberOfLines={1}
                                >
                                  Đã chọn
                                </Text>
                              </View>
                            ) : (
                              <View style={{ height: 14 }} />
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>

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
