import { AppDialogModal } from "@/components/common/AppDialogModal";
import { SharedHeader } from "@/components/common/SharedHeader";
import { DraggableApiItineraryItemCard } from "@/components/itinerary/DraggableApiItineraryItemCard";
import ItineraryRouteMap, { type ItineraryMapLocation } from "@/components/itinerary/ItineraryRouteMap";
import { PermissionModal } from "@/components/itinerary/PermissionModal";
import { StatusBadge } from "@/components/itinerary/StatusBadge";
import { TripItemCard } from "@/components/itinerary/TripItemCard";
import { LocationImage } from "@/components/location/LocationImage";
import TimePickerModal from "@/components/TimePickerModal";
import { useGroup } from "@/hooks/useGroups";
import {
  useAiModifyItinerary,
  useAiSuggestLocation,
  useDeleteTripItem,
  useFavoriteItineraries,
  useFavoriteItinerary,
  useItineraryDetail,
  useItineraryTripItems,
  useUnfavoriteItinerary,
  useUpdateItinerary,
  useUpdateItineraryStatus,
  useUpdateTripItem,
} from "@/hooks/useItineraries";
import { useUpdateTripItemStatus } from "@/hooks/useTripItemStatus";
import {
  ITINERARY_STATUS,
  type TripItemResponse,
  type TripItemStatus,
} from "@/services/itineraries";
import { useAppSelector } from "@/store/hooks";
import { startGeofencing, stopGeofencing } from "@/tasks/geofencingTask";
import { checkinQueue } from "@/utils/checkinQueue";
import { parseItineraryDateToDayOnly, tripPickerDateToItineraryDateTime } from "@/utils/itineraryDates";
import { getLocationImageUrl, getLocationImageUrlAsync } from "@/utils/locationImages";
import { requestNotificationPermissions, setupNotificationHandlers } from "@/utils/notifications";
import { showSuccessToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Image } from "expo-image";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

function formatHeaderDate(iso?: string): string {
  if (!iso?.trim()) return "";
  const raw = iso.split("T")[0];
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDayChipLabel(dayKey: string): string {
  if (dayKey === "_nodate") return "Chưa rõ ngày";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return dayKey;
  const d = new Date(`${dayKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dayKey;
  return d.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

const AI_TIPS = [
  "Đang phân tích sở thích của bạn...",
  "Tìm kiếm các địa điểm lân cận phù hợp...",
  "AI đang tối ưu hóa lộ trình di chuyển...",
  "Sắp hoàn tất các lựa chọn tốt nhất cho bạn...",
];

function AiLoadingView({ message }: { message: string }) {
  const [tipIndex, setTipIndex] = React.useState(0);
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const id = setInterval(() => setTipIndex(i => (i + 1) % AI_TIPS.length), 3000);

    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    return () => {
      clearInterval(id);
      spinValue.stopAnimation();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <View className="relative h-24 w-24 items-center justify-center">
        <View className="absolute h-full w-full rounded-full border-4 border-emerald-100 opacity-20" />
        <Animated.View
          style={{ transform: [{ rotate: spin }] }}
          className="absolute h-full w-full rounded-full border-t-4 border-primary"
        />
        <Ionicons name="sparkles" size={40} color="#2BB673" />
      </View>
      <Text className="mt-8 text-center text-lg font-bold text-gray-900">{message}</Text>
      <Text className="mt-2 text-center text-sm text-gray-500 italic">"{AI_TIPS[tipIndex]}"</Text>

      <View className="mt-10 flex-row gap-2">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            style={{ opacity: 0.3 + (i === tipIndex % 4 ? 0.7 : 0) }}
          />
        ))}
      </View>
    </View>
  );
}

function getKeywordFallbackImage(note?: string): string {
  const n = (note || "").toLowerCase();
  if (n.includes("ăn") || n.includes("food") || n.includes("nhà hàng"))
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600";
  if (n.includes("khách sạn") || n.includes("hotel") || n.includes("nghỉ"))
    return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600";
  if (n.includes("bay") || n.includes("flight") || n.includes("sân bay"))
    return "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?w=600";
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600";
}

function placeIdFromTripItem(row: TripItemResponse): string | undefined {
  const loc = row.location;
  return loc?.provider_id || (row as any).place_id || (row as any).location_id || row.id;
}

function formatItemDateTime(dayKey: string, time: string): string {
  const datePart = (dayKey || "").trim().slice(0, 10);
  const timePart = (time || "").trim();
  // Ensure time is HH:mm:00
  const finalTime = timePart.length === 5 ? `${timePart}:00` : timePart;
  return `${datePart}T${finalTime}`;
}

export default function ItineraryDetailScreen() {
  // const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: itineraryId, from, postOwnerId, hideExpense, autoOpenItemId } = useLocalSearchParams<{ id: string; from?: string; postOwnerId?: string; hideExpense?: string; autoOpenItemId?: string }>();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const [imageUrlCache, setImageUrlCache] = useState<Record<string, string>>({});

  // Setup Mode State
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [draftItemsByDay, setDraftItemsByDay] = useState<Record<string, TripItemResponse[]>>({});

  // Modals & Active Items
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<{ dayKey: string; item: TripItemResponse } | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ dayKey: string; id?: string; index?: number; name?: string } | null>(null);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [suggestionModalVisible, setSuggestionModalVisible] = useState(false);
  const [activeTripItem, setActiveTripItem] = useState<TripItemResponse | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<TripItemResponse[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedUnwantedIds, setSelectedUnwantedIds] = useState<string[]>([]);

  // Immediate Persistence Confirmations
  const [swapConfirmVisible, setSwapConfirmVisible] = useState(false);
  const [pendingSwap, setPendingSwap] = useState<{ dayKey: string; from: number; to: number } | null>(null);
  const [timeConfirmVisible, setTimeConfirmVisible] = useState(false);
  const [pendingTimeEdit, setPendingTimeEdit] = useState<{ dayKey: string; item: TripItemResponse; newStart: string; newDuration: number } | null>(null);
  const [applyConfirmVisible, setApplyConfirmVisible] = useState(false);

  // Phase 5: Geofencing state
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [geofencingEnabled, setGeofencingEnabled] = useState(false);

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErr,
    refetch: refetchDetail,
  } = useItineraryDetail(itineraryId, { enabled: !!itineraryId });

  const {
    data: tripItems = [],
    isLoading: itemsLoading,
    isError: itemsError,
    error: itemsErr,
    refetch: refetchItems,
  } = useItineraryTripItems(itineraryId, {
    enabled: !!itineraryId,
    itineraryStatus: detail?.status,
  });

  // Phase 2: Check-in status management
  const updateStatusMutation = useUpdateTripItemStatus();
  const updateTripItemMutation = useUpdateTripItem();
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Process offline queue on mount and network change
  useEffect(() => {
    const processOfflineQueue = async () => {
      const failed = await checkinQueue.processQueue(
        async (itineraryId, tripItemId, status, rating, review) => {
          await updateStatusMutation.mutateAsync({
            itineraryId,
            tripItemId,
            payload: { status, rating, review },
          });
        }
      );

      if (failed.length > 0) {
        console.log(`[CheckinSync] ${failed.length} check-ins still pending sync`);
      }
    };

    // Process on mount
    processOfflineQueue();

    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('[CheckinSync] Network restored, processing queue...');
        processOfflineQueue();
      }
    });

    return () => unsubscribe();
  }, []);

  // Phase 5: Show permission modal when status becomes IN_PROGRESS
  useEffect(() => {
    const initGeofencing = async () => {
      if (detail?.status === ITINERARY_STATUS.IN_PROGRESS && !geofencingEnabled && itineraryId) {
        const prompted = await AsyncStorage.getItem(`geofence_prompted_${itineraryId}`);
        if (prompted === 'true') {
          // If we already prompted, try to silently start if we have permissions
          const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
          if (fgStatus === 'granted') {
            const success = await startGeofencing(tripItems, itineraryId);
            if (success) setGeofencingEnabled(true);
          }
          return;
        }

        const timer = setTimeout(() => {
          setPermissionModalVisible(true);
        }, 500); // Small delay for smoother UX

        return () => clearTimeout(timer);
      }
    };
    initGeofencing();
  }, [detail?.status, geofencingEnabled, itineraryId, tripItems]);

  // Phase 5: Fallback foreground geofencing for Emulator testing (DEV only)
  // Google Play Services Geofencing is notoriously flaky on Android emulators.
  const notifiedLocations = useRef<Set<string>>(new Set());
  useEffect(() => {
    let locationSub: Location.LocationSubscription;

    const startDevTracker = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (__DEV__ && status === 'granted' && detail?.status === ITINERARY_STATUS.IN_PROGRESS) {
        const pendingItems = tripItems.filter(item => item.status === 'PENDING' || !item.status);
        if (pendingItems.length === 0) return;

        locationSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          async (location) => {
            const { latitude, longitude } = location.coords;
            for (const item of pendingItems) {
              const rawLat = item.location?.routable_lat ?? item.location?.lat ?? item.location?.latitude;
              const rawLng = item.location?.routable_lng ?? item.location?.lng ?? item.location?.longitude;
              const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : rawLat;
              const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : rawLng;

              if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                // Calculate distance in km
                const R = 6371;
                const dLat = (lat - latitude) * Math.PI / 180;
                const dLon = (lng - longitude) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                if (distance <= 1.0 && !notifiedLocations.current.has(item.id ?? "")) {
                  notifiedLocations.current.add(item.id ?? "");
                  const locationName = item.location?.name || `Địa điểm`;

                  const notificationContent: Notifications.NotificationContentInput = {
                    title: '📍 Bạn đã đến gần địa điểm!',
                    body: `(DEV) Bạn đang ở gần ${locationName}. Nhấn để check-in ngay!`,
                    data: {
                      type: 'geofence_enter',
                      tripItemId: item.id,
                      itineraryId: itineraryId,
                      locationName: locationName,
                      timestamp: new Date().toISOString(),
                    },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                  };

                  if (Platform.OS === 'android') {
                    (notificationContent as any).android = {
                      channelId: 'geofencing_high',
                      priority: Notifications.AndroidNotificationPriority.MAX,
                      sound: true,
                      vibrate: [0, 250, 250, 250],
                    };
                  }

                  await Notifications.scheduleNotificationAsync({
                    content: notificationContent,
                    trigger: null,
                  });
                }
              }
            }
          }
        );
      }
    };

    startDevTracker();
    return () => {
      if (locationSub) locationSub.remove();
    };
  }, [detail?.status, geofencingEnabled, tripItems]);

  // Phase 5: Stop geofencing when itinerary is completed
  useEffect(() => {
    if (detail?.status === ITINERARY_STATUS.COMPLETED && geofencingEnabled) {
      stopGeofencing();
      setGeofencingEnabled(false);
      console.log('[Geofencing] Stopped - itinerary completed');
    }
  }, [detail?.status, geofencingEnabled]);

  // Phase 5: Setup notification handlers
  useEffect(() => {
    const cleanup = setupNotificationHandlers((data) => {
      console.log('[Notification] Tapped:', data);
      if (data && data.type === 'geofence_enter' && data.tripItemId) {
        const targetItem = tripItems.find(item => item.id === data.tripItemId);
        if (targetItem) {
          router.push({
            pathname: "/itinerary/item-detail",
            params: {
              itemData: JSON.stringify(targetItem),
            },
          });
        }
      }
    });

    return cleanup;
  }, [tripItems]);

  // Phase 5: Auto-open trip item detail when navigated from geofence notification
  useEffect(() => {
    if (autoOpenItemId && tripItems.length > 0) {
      const targetItem = tripItems.find(item => item.id === autoOpenItemId);
      if (targetItem) {
        // Clear param to prevent infinite loops or reopening on back navigation
        router.setParams({ autoOpenItemId: undefined });
        
        router.push({
          pathname: "/itinerary/item-detail",
          params: {
            itemData: JSON.stringify(targetItem),
          },
        });
      }
    }
  }, [autoOpenItemId, tripItems]);

  // Phase 5: Handle accept permissions
  const handleAcceptPermissions = async () => {
    try {
      if (itineraryId) {
        await AsyncStorage.setItem(`geofence_prompted_${itineraryId}`, 'true');
      }
      // Step 1: Request notification permissions
      const notificationGranted = await requestNotificationPermissions();
      if (!notificationGranted) {
        Alert.alert(
          'Cần quyền thông báo',
          'Vui lòng cho phép thông báo trong cài đặt để nhận cảnh báo vị trí.',
          [{ text: 'OK' }]
        );
        setPermissionModalVisible(false);
        return;
      }

      // Step 2: Request foreground location permission
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Cần quyền vị trí',
          'Vui lòng cho phép truy cập vị trí trong cài đặt.',
          [{ text: 'OK' }]
        );
        setPermissionModalVisible(false);
        return;
      }

      // Step 3: Request background location permission
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        // Fallback: Still allow but warn user
        Alert.alert(
          'Quyền vị trí nền bị từ chối',
          'Thông báo chỉ hoạt động khi ứng dụng đang mở. Để nhận thông báo khi ứng dụng đóng, vui lòng bật "Luôn luôn" trong cài đặt vị trí.',
          [
            {
              text: 'Tiếp tục',
              onPress: async () => {
                // Start geofencing anyway (works in foreground)
                const success = await startGeofencing(tripItems, itineraryId);
                if (success) {
                  setGeofencingEnabled(true);
                  showSuccessToast('Đã bật thông báo vị trí', 'Chỉ hoạt động khi ứng dụng mở');
                }
                setPermissionModalVisible(false);
              },
            },
          ]
        );
        return;
      }

      // Step 4: Start geofencing
      const success = await startGeofencing(tripItems, itineraryId);
      if (success) {
        setGeofencingEnabled(true);
        showSuccessToast('Đã bật thông báo vị trí', 'Bạn sẽ nhận thông báo khi đến gần địa điểm');
      } else {
        Alert.alert(
          'Không thể bật thông báo',
          'Không có địa điểm nào được lên lịch cho hôm nay.',
          [{ text: 'OK' }]
        );
      }

      setPermissionModalVisible(false);
    } catch (error) {
      console.error('[Geofencing] Permission error:', error);
      Alert.alert(
        'Lỗi',
        'Không thể thiết lập thông báo vị trí. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
      setPermissionModalVisible(false);
    }
  };

  // Phase 5: Handle decline permissions
  const handleDeclinePermissions = async () => {
    if (itineraryId) {
      await AsyncStorage.setItem(`geofence_prompted_${itineraryId}`, 'true');
    }
    setPermissionModalVisible(false);
    showSuccessToast('Bạn vẫn có thể check-in thủ công', '');
  };

  // Handle check-in with offline support
  const handleCheckIn = async (tripItemId: string, status: TripItemStatus) => {
    setUpdatingItemId(tripItemId);

    try {
      await updateStatusMutation.mutateAsync({
        itineraryId,
        tripItemId,
        payload: { status },
      });
    } catch (error) {
      // Add to offline queue
      await checkinQueue.add({
        itineraryId,
        tripItemId,
        status,
      });

      showSuccessToast('Đã lưu offline', 'Sẽ đồng bộ khi có mạng');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Handle rating with offline support
  const handleRate = async (tripItemId: string, rating: number, review: string) => {
    setUpdatingItemId(tripItemId);

    try {
      const item = tripItems.find(t => t.id === tripItemId);
      if (!item) return;

      await updateTripItemMutation.mutateAsync({
        itineraryId,
        tripItemId,
        payload: {
          start_time: item.start_time || "",
          duration: item.duration,
          note: item.note,
          location_id: item.location_id || item.location?.id,
          place_id: (item as any).place_id || item.location?.provider_id,
          status: 'CHECKED_IN',
          rating,
          review,
        },
      });
    } catch (error) {
      // Add to offline queue with rating data
      await checkinQueue.add({
        itineraryId,
        tripItemId,
        status: 'CHECKED_IN',
        rating,
        review,
      });

      showSuccessToast('Đã lưu offline', 'Sẽ đồng bộ khi có mạng');
    } finally {
      setUpdatingItemId(null);
    }
  };

  useEffect(() => {
    if (tripItems.length === 0) return;
    const fetchImages = async () => {
      const itemsToResolve = tripItems.filter(item => {
        const itemId = item.id || item.location?.id || item.location_id || "";
        return !imageUrlCache[String(itemId)];
      });

      for (const row of itemsToResolve) {
        const itemId = row.id || row.location?.id || row.location_id || "";
        try {
          const url = await getLocationImageUrlAsync(row.location);
          if (url) {
            setImageUrlCache((prev) => ({ ...prev, [itemId]: url }));
          }
        } catch (err) {
          console.warn(`[IMAGE FETCH] Failed for item ${itemId}:`, err);
        }
      }
    };

    fetchImages();
  }, [tripItems]);


  const itemsByDay = useMemo(() => {
    const map: Record<string, TripItemResponse[]> = {};
    for (const row of tripItems) {
      const k = row.start_time ? parseItineraryDateToDayOnly(row.start_time) || "_nodate" : "_nodate";
      if (!map[k]) map[k] = [];
      map[k].push(row);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => {
        const ta = a.start_time ? Date.parse(a.start_time) : 0;
        const tb = b.start_time ? Date.parse(b.start_time) : 0;
        return ta - tb;
      });
    }
    return map;
  }, [tripItems]);

  const dayKeys = useMemo(() => {
    const keys = Object.keys(itemsByDay);
    keys.sort((a, b) => {
      if (a === "_nodate") return 1;
      if (b === "_nodate") return -1;
      return a.localeCompare(b);
    });
    return keys;
  }, [itemsByDay]);

  // Mutations
  const updateItineraryMutation = useUpdateItinerary();
  const deleteTripItemMutation = useDeleteTripItem();
  const aiSuggestMutation = useAiSuggestLocation();
  const aiModifyMutation = useAiModifyItinerary();
  const updateItineraryStatusMutation = useUpdateItineraryStatus();

  const handleUpdateStatus = async (newStatus: string) => {
    if (!itineraryId) return;
    try {
      await updateItineraryStatusMutation.mutateAsync({
        itineraryId,
        status: newStatus,
        groupId: detail?.group_id ?? ""
      });
      refetchDetail();
    } catch { }
  };

  const { data: favoriteList = [] } = useFavoriteItineraries(itineraryId);
  const favoriteMutation = useFavoriteItinerary();
  const unfavoriteMutation = useUnfavoriteItinerary();

  const isFavorited = useMemo(() => {
    return Array.isArray(favoriteList) && favoriteList.some((it) => it && it.id === itineraryId);
  }, [favoriteList, itineraryId]);

  const toggleFavorite = useCallback(() => {
    if (!itineraryId) return;
    if (isFavorited) {
      unfavoriteMutation.mutate(itineraryId);
    } else {
      favoriteMutation.mutate(itineraryId);
    }
  }, [itineraryId, isFavorited, unfavoriteMutation, favoriteMutation]);

  // Initialize draft items when entering setup mode
  useEffect(() => {
    if (isSetupMode) {
      setDraftItemsByDay(itemsByDay);
    }
  }, [isSetupMode, itemsByDay]);

  const getItemImageUrl = (row: TripItemResponse): string | undefined => {
    const itemId = row.id || row.location?.id || row.location_id || "";
    const cached = imageUrlCache[String(itemId)];
    if (cached) return cached;

    const locImg = getLocationImageUrl(row.location);
    if (locImg) return locImg;

    return getKeywordFallbackImage(row.note);
  };

  const moveItem = useCallback((dayKey: string, from: number, to: number) => {
    if (from === to) return;
    setPendingSwap({ dayKey, from, to });
    setSwapConfirmVisible(true);
  }, []);

  const confirmSwapItems = async () => {
    if (!pendingSwap || !itineraryId) return;
    const { dayKey, from, to } = pendingSwap;
    const rows = [...(itemsByDay[dayKey] || [])];
    const itemA = rows[from];
    const itemB = rows[to];
    const timeA = itemA.start_time;
    const timeB = itemB.start_time;

    try {
      const promises = [];
      if (itemA.id) {
        promises.push(updateTripItemMutation.mutateAsync({
          itineraryId, tripItemId: itemA.id, payload: { ...itemA, start_time: timeB }
        }));
      }
      if (itemB.id) {
        promises.push(updateTripItemMutation.mutateAsync({
          itineraryId, tripItemId: itemB.id, payload: { ...itemB, start_time: timeA }
        }));
      }
      await Promise.all(promises);
      refetchItems();
    } catch { } finally {
      setSwapConfirmVisible(false);
      setPendingSwap(null);
    }
  };

  const deleteItem = useCallback((dayKey: string, id?: string, fallbackIndex?: number, name?: string) => {
    setItemToDelete({ dayKey, id, index: fallbackIndex, name });
    setDeleteConfirmVisible(true);
  }, []);

  const confirmDeleteItem = async () => {
    if (!itemToDelete || !itineraryId) return;
    const { id } = itemToDelete;
    if (id) {
      try { await deleteTripItemMutation.mutateAsync({ itineraryId, tripItemId: id }); } catch { }
    }
    refetchItems();
    setDeleteConfirmVisible(false);
    setItemToDelete(null);
  };

  const openTimePicker = useCallback((dayKey: string, item: TripItemResponse) => {
    setEditingTimeSlot({ dayKey, item });
    setTimePickerVisible(true);
  }, []);

  const handleSaveTime = useCallback((timeRange: { start: string; end: string }, duration?: number) => {
    if (!editingTimeSlot) return;
    const { dayKey, item } = editingTimeSlot;
    setPendingTimeEdit({
      dayKey,
      item,
      newStart: formatItemDateTime(dayKey, timeRange.start),
      newDuration: duration ?? item.duration ?? 0
    });
    setTimePickerVisible(false);
    setTimeConfirmVisible(true);
  }, [editingTimeSlot]);

  const confirmTimeEdit = async () => {
    if (!pendingTimeEdit || !itineraryId) return;
    const { item, newStart, newDuration } = pendingTimeEdit;
    try {
      await updateTripItemMutation.mutateAsync({
        itineraryId,
        tripItemId: item.id || "",
        payload: {
          ...item,
          start_time: newStart,
          duration: newDuration
        }
      });
      refetchItems();
    } catch { } finally {
      setTimeConfirmVisible(false);
      setPendingTimeEdit(null);
      setEditingTimeSlot(null);
    }
  };

  const handleSaveSetup = async () => {
    if (!itineraryId || !detail) return;
    const allItems: TripItemResponse[] = [];
    dayKeys.forEach(dk => allItems.push(...(draftItemsByDay[dk] || [])));
    try {
      await updateItineraryMutation.mutateAsync({
        itineraryId,
        payload: {
          name: detail.title || "",
          start_date: tripPickerDateToItineraryDateTime(detail.start_date, "start"),
          end_date: tripPickerDateToItineraryDateTime(detail.end_date || detail.start_date, "end"),
          status: detail.status,
          trip_items: allItems.map(item => ({
            start_time: item.start_time || "",
            duration: item.duration,
            note: item.note,
            location_id: item.location_id || item.location?.id || undefined,
            place_id: (item as any).place_id || item.location?.provider_id || undefined,
          })),
        },
      });
      setIsSetupMode(false);
    } catch { }
  };

  const handleOpenAiSuggest = useCallback(async (item: TripItemResponse) => {
    const unwantedPlaceId = placeIdFromTripItem(item);

    if (!itineraryId || !unwantedPlaceId) {
      return;
    }

    setActiveTripItem(item);
    setAiSuggestions([]);
    setSuggestionModalVisible(true);
    try {
      const suggestions = await aiSuggestMutation.mutateAsync({
        itineraryId,
        unwantedPlaceId
      });
      setAiSuggestions(suggestions);
    } catch { }
  }, [itineraryId, aiSuggestMutation]);

  const handleSelectAiSuggestion = useCallback(async (suggestion: TripItemResponse) => {
    if (!itineraryId || !activeTripItem?.id) return;
    const placeId = suggestion.location?.provider_id || (suggestion as any).place_id;
    const locationId = suggestion.location?.id || suggestion.location_id;
    try {
      await updateTripItemMutation.mutateAsync({
        itineraryId,
        tripItemId: activeTripItem.id,
        payload: {
          start_time: activeTripItem.start_time || "",
          duration: suggestion.duration || activeTripItem.duration,
          note: suggestion.note || activeTripItem.note,
          location_id: locationId,
          place_id: placeId,
        },
      });
      setSuggestionModalVisible(false);
      setActiveTripItem(null);
      refetchItems();
    } catch { }
  }, [itineraryId, activeTripItem, updateTripItemMutation, refetchItems]);

  const normItineraryStatus = (s?: string) => (s || "").toUpperCase();
  const status = normItineraryStatus(detail?.status);

  const canEdit = status === ITINERARY_STATUS.DRAFT || status === ITINERARY_STATUS.FAILED;
  const canUseAi = status !== ITINERARY_STATUS.COMPLETED &&
    status !== ITINERARY_STATUS.GENERATING &&
    status !== ITINERARY_STATUS.PENDING;

  // Group checking for starting/completing the trip
  const isOwner = useMemo(() => {
    if (!detail?.created_by || !currentUserId) return false;
    return detail.created_by === currentUserId;
  }, [detail?.created_by, currentUserId]);
  const { data: group } = useGroup(detail?.group_id || undefined);
  const currentUserRole = group?.members?.find((m) => m.user?.id === currentUserId)?.role || "MEMBER";

  // A user can control the trip if they are the creator of a solo itinerary OR a leader/co-leader of a group itinerary
  const isGroupLeaderOrCoLeader = detail?.group_id ? (currentUserRole === "LEADER" || currentUserRole === "CO_LEADER") : false;
  // Creator (isOwner) also can control trip, even in group itineraries (in case role hasn't loaded yet)
  const canControlTrip = detail?.group_id ? (isGroupLeaderOrCoLeader || isOwner) : isOwner;

  const isItineraryMember = useMemo(() => {
    if (isOwner) return true;
    if (!detail?.group_id) return false;
    return !!group?.members?.some((m) => m.user?.id === currentUserId);
  }, [isOwner, detail?.group_id, group?.members, currentUserId]);

  const shouldShowExpenseButton = useMemo(() => {
    const isHidden = hideExpense === "true";
    if (isHidden && !isItineraryMember) {
      return false;
    }
    return true;
  }, [hideExpense, isItineraryMember]);

  // Rating editing permissions:
  // If viewed from a post, you can edit if you are the POST owner (regardless of itinerary ownership)
  // If viewed normally, you can edit if you are the ITINERARY owner
  const isPostOwner = postOwnerId ? currentUserId === postOwnerId : false;
  const canEditRating = from === 'post' ? isPostOwner : canControlTrip;

  console.log("\n--- [DEBUG ItineraryDetail] ---");
  console.log("itineraryId:", itineraryId);
  console.log("hideExpense param:", hideExpense);
  console.log("isOwner:", isOwner);
  console.log("detail.created_by:", detail?.created_by);
  console.log("currentUserId:", currentUserId);
  console.log("detail.group_id:", detail?.group_id);
  console.log("group?.members count:", group?.members?.length);
  console.log("isItineraryMember:", isItineraryMember);
  console.log("shouldShowExpenseButton:", shouldShowExpenseButton);
  console.log("--------------------------------\n");

  // Date comparisons for Start/Complete trip
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const startDate = detail?.start_date ? new Date(detail.start_date) : null;
  if (startDate && !isNaN(startDate.getTime())) startDate.setHours(0, 0, 0, 0);

  const endDate = detail?.end_date ? new Date(detail.end_date) : startDate;
  if (endDate && !isNaN(endDate.getTime())) endDate.setHours(0, 0, 0, 0);

  const isWithinTripRange = !!(startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && now >= startDate && now <= endDate);
  const isPastTripEnd = !!(endDate && !isNaN(endDate.getTime()) && now >= endDate);
  const isStrictlyPastTripEnd = !!(endDate && !isNaN(endDate.getTime()) && now > endDate);

  const showStartTrip = status === ITINERARY_STATUS.CONFIRMED && isWithinTripRange;
  const showCompleteTrip =
    status === ITINERARY_STATUS.IN_PROGRESS
      ? isPastTripEnd   // show on last day AND after (>= end date)
      : (status === ITINERARY_STATUS.CONFIRMED && isStrictlyPastTripEnd);

  const placesForAiModify = useMemo(() => {
    const map = new Map<string, any>();
    for (const row of tripItems) {
      const k = row.start_time ? parseItineraryDateToDayOnly(row.start_time) || "_nodate" : "_nodate";
      if (selectedDayKey && k !== selectedDayKey) continue;

      const pid = placeIdFromTripItem(row);
      if (!pid || map.has(pid)) continue;
      map.set(pid, {
        placeId: pid,
        label: row.location?.name || row.note || "Địa điểm",
        dayHint: row.start_time ? formatDayChipLabel(parseItineraryDateToDayOnly(row.start_time) || "") : undefined,
        imageUrl: getItemImageUrl(row),
      });
    }
    return Array.from(map.values());
  }, [tripItems, imageUrlCache, selectedDayKey]);

  const handleSubmitAiModify = async () => {
    if (!itineraryId || selectedUnwantedIds.length === 0) return;
    try {
      await aiModifyMutation.mutateAsync({
        itineraryId,
        payload: { unwantedPlaceIds: selectedUnwantedIds },
      });
      setAdjustModalVisible(false);
    } catch { }
  };

  const loading = !!itineraryId && (detailLoading || itemsLoading);
  const detailBlocking = !!itineraryId && detailError && !detail && !detailLoading;

  const title = detail?.title?.trim() || "Lịch trình";
  const hasDateRange = !!(detail?.start_date || detail?.end_date);
  const dateRangeLabel = hasDateRange
    ? `${formatHeaderDate(detail?.start_date)} – ${formatHeaderDate(
      detail?.end_date || detail?.start_date,
    )}`
    : "";
  const firstItemWithImage = useMemo(() => {
    return tripItems.find(item => {
      const img = getItemImageUrl(item);
      return img && !img.includes("unsplash") && !img.includes("keyword-fallback");
    });
  }, [tripItems, imageUrlCache]);

  if (!itineraryId) {
    return (
      <View style={styles.container}>
        <SharedHeader
          leftElement={
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#111827" />
            </TouchableOpacity>
          }
          centerElement={<Text style={styles.headerTitle}>Thông tin lịch trình</Text>}
          withMenuDrawer={false}
          showBorderBottom={false}
        />
        <View style={styles.centerContent}>
          <Text>Thiếu mã lịch trình.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SharedHeader
        leftElement={
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#111827" />
          </TouchableOpacity>
        }
        centerElement={<Text style={styles.headerTitle}>Thông tin lịch trình</Text>}
        withMenuDrawer={false}
        showBorderBottom={false}
      />

      {detailBlocking ? (
        <View style={styles.centerContent}>
          <Ionicons name="cloud-offline-outline" size={52} color="#9CA3AF" />
          <Text style={styles.errorTitle}>Không tải được lịch</Text>
          <Text style={styles.errorText}>
            {detailErr instanceof Error ? detailErr.message : "Hãy thử lại."}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void refetchDetail()}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading && !detail && tripItems.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2BB673" />
              <Text style={styles.loadingText}>Đang tải lịch trình…</Text>
            </View>
          ) : null}

          <View style={styles.coverCard}>
            {detail?.cover_image_url || detail?.thumbnail_url ? (
              <Image
                source={{ uri: detail.cover_image_url || detail.thumbnail_url || undefined }}
                style={styles.coverImage}
                contentFit="cover"
              />
            ) : (
              <LocationImage
                location={firstItemWithImage?.location}
                style={styles.coverImage}
                containerStyle={{ width: '100%', height: 200 }}
                placeholderIcon="image-outline"
              />
            )}

            <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButtonAbsolute}>
              <Ionicons
                name={isFavorited ? "heart" : "heart-outline"}
                size={22}
                color={isFavorited ? "#ef4444" : "#111827"}
              />
            </TouchableOpacity>

            <View style={styles.coverInfo}>
              <View style={styles.statusBadgeContainer}>
                <StatusBadge status={detail?.status} size="sm" />
              </View>
              <Text style={styles.itineraryTitle} numberOfLines={2}>
                {title}
              </Text>
              {dateRangeLabel ? (
                <Text style={styles.itineraryDates}>{dateRangeLabel}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.actionsContainer}>
            {/* Banner Apply Lịch trình (Chỉ hiện cho Leader/Co-leader và khi lịch trình đang ở bản nháp) */}
            {isGroupLeaderOrCoLeader && status === ITINERARY_STATUS.DRAFT && (
              <TouchableOpacity
                onPress={() => setApplyConfirmVisible(true)}
                style={styles.applyButton}
                activeOpacity={0.8}
              >
                <View style={styles.applyIconContainer}>
                  <Ionicons name="duplicate" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.applyButtonTitle}>Sử dụng lịch trình này</Text>
                  <Text style={styles.applyButtonDesc}>Áp dụng vào chuyến đi hiện tại của nhóm</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FBBF24" />
              </TouchableOpacity>
            )}

            {/* Hàng 1: Các nút công cụ phụ trợ */}
            <View style={styles.toolsRow}>
              {shouldShowExpenseButton && (
                <TouchableOpacity
                  onPress={() => router.push(`/itinerary/expenses?itineraryId=${itineraryId}`)}
                  style={[styles.actionButton, styles.expenseButton]}
                >
                  <Ionicons name="wallet-outline" size={20} color="#047857" />
                  <Text style={styles.expenseText} numberOfLines={1}>Chi phí</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => router.push(`/itinerary/notebook?id=${itineraryId}`)}
                style={[styles.actionButton, styles.notebookButton]}
              >
                <Ionicons name="book-outline" size={20} color="#7C3AED" />
                <Text style={styles.notebookText} numberOfLines={1}>Hướng dẫn</Text>
              </TouchableOpacity>

              {(isOwner || status === ITINERARY_STATUS.DRAFT) && canUseAi && (
                !isSetupMode ? (
                  <TouchableOpacity
                    onPress={() => setIsSetupMode(true)}
                    style={[styles.actionButton, styles.setupButton]}
                  >
                    <Ionicons name="settings-outline" size={20} color="#2563EB" />
                    <Text style={styles.setupText} numberOfLines={1}>Thiết lập</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleSaveSetup()}
                    style={[styles.actionButton, styles.saveButton]}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.saveText} numberOfLines={1}>Xong</Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* Hàng 2: Nút hành động chính (Bắt đầu / Kết thúc) */}
            {canControlTrip && (showStartTrip || showCompleteTrip) && (
              <View style={styles.primaryRow}>
                {showStartTrip && (
                  <TouchableOpacity
                    onPress={() => handleUpdateStatus(ITINERARY_STATUS.IN_PROGRESS)}
                    style={[styles.primaryButton, styles.startButton]}
                  >
                    <Ionicons name="play-outline" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Bắt đầu chuyến đi</Text>
                  </TouchableOpacity>
                )}

                {showCompleteTrip && (
                  <TouchableOpacity
                    onPress={() => handleUpdateStatus(ITINERARY_STATUS.COMPLETED)}
                    style={[styles.primaryButton, styles.completeButton]}
                  >
                    <Ionicons name="flag-outline" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Kết thúc chuyến đi</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.daysList}>
            {dayKeys.map((dayKey, dayIndex) => {
              const itemsForDay = itemsByDay[dayKey] || [];
              const dayLabel = formatDayChipLabel(dayKey);
              const mapPins: ItineraryMapLocation[] = itemsForDay
                .map((row) => {
                  const rawLat = row.location?.routable_lat ?? row.location?.lat;
                  const rawLng = row.location?.routable_lng ?? row.location?.lng;
                  const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : rawLat;
                  const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : rawLng;

                  if (typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng)) {
                    return {
                      id: row.id || `pin-${dayKey}-${row.location?.id}`,
                      latitude: lat,
                      longitude: lng,
                      title: row.location?.name || "Địa điểm",
                    };
                  }
                  return null;
                })
                .filter((p): p is ItineraryMapLocation => p !== null);

              return (
                <View key={dayKey} style={styles.daySection}>
                  <Text style={styles.dayHeader}>
                    {dayKey === "_nodate" ? "Chưa phân ngày" : `Ngày ${dayIndex + 1}: ${dayLabel}`}
                  </Text>

                  {mapPins.length > 0 && (
                    <View style={styles.mapContainer}>
                      <ItineraryRouteMap locations={mapPins} height={200} mode="DRIVING" />
                    </View>
                  )}

                  {itemsForDay.length > 0 ? (
                    (isSetupMode ? draftItemsByDay[dayKey] || [] : itemsForDay).map((row, idx) => (
                      isSetupMode ? (
                        <DraggableApiItineraryItemCard
                          key={row.id || `draft-${dayKey}-${idx}`}
                          row={row}
                          index={idx}
                          total={(draftItemsByDay[dayKey] || []).length}
                          canInteract={canEdit}
                          canUseAi={canUseAi}
                          onMove={(from, to) => moveItem(dayKey, from, to)}
                          onDelete={() => deleteItem(dayKey, row.id, idx, row.location?.name || row.note)}
                          onSuggest={() => handleOpenAiSuggest(row)}
                          onEdit={() => openTimePicker(dayKey, row)}
                        />
                      ) : (
                        <TripItemCard
                          key={row.id || idx}
                          item={row}
                          onPress={() => {
                            router.push({
                              pathname: "/itinerary/item-detail",
                              params: {
                                itemData: JSON.stringify(row),
                              },
                            });
                          }}
                          onCheckIn={canControlTrip && status === ITINERARY_STATUS.IN_PROGRESS ? handleCheckIn : undefined}
                          onRate={canEditRating ? handleRate : undefined}
                          isUpdating={updatingItemId === row.id}
                          showMenu={false}
                          showTimeline={status !== ITINERARY_STATUS.DRAFT && status !== "" && from !== 'post'}
                          isLast={idx === itemsForDay.length - 1}
                          isCompleted={status === ITINERARY_STATUS.COMPLETED}
                          hideStatusBadge={from === 'post'}
                        />
                      )
                    ))
                  ) : (
                    <View style={styles.emptyDay}>
                      <Text style={styles.emptyDayText}>Không có hoạt động nào.</Text>
                    </View>
                  )}

                  {isSetupMode && canUseAi && (
                    <View className="mx-4 mt-2 flex-row items-center justify-center gap-3">
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedDayKey(dayKey);
                          setAdjustModalVisible(true);
                        }}
                        className="flex-1 flex-row items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 py-3"
                      >
                        <Ionicons name="sparkles-outline" size={18} color="#059669" />
                        <Text className="ml-2 font-semibold text-emerald-800">Điều chỉnh AI</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <TimePickerModal
        visible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        onSave={handleSaveTime}
        initialStartTime={editingTimeSlot?.item.start_time ? new Date(editingTimeSlot.item.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : "08:00"}
        initialEndTime={(() => {
          if (!editingTimeSlot?.item.start_time) return "10:00";
          const start = new Date(editingTimeSlot.item.start_time);
          const dur = editingTimeSlot.item.duration || 60;
          const end = new Date(start.getTime() + dur * 60000);
          return end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        })()}
      />

      <AppDialogModal
        visible={deleteConfirmVisible}
        variant="warning"
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa "${itemToDelete?.name || "địa điểm này"}"?`}
        primaryLabel="Xóa"
        primaryDestructive
        onPrimaryPress={confirmDeleteItem}
        secondaryLabel="Hủy"
        onSecondaryPress={() => setDeleteConfirmVisible(false)}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      />

      <AppDialogModal
        visible={swapConfirmVisible}
        variant="info"
        title="Thay đổi thứ tự"
        message="Bạn có chắc chắn muốn hoán đổi vị trí và thời gian của hai địa điểm này?"
        primaryLabel="Hoán đổi"
        onPrimaryPress={confirmSwapItems}
        secondaryLabel="Hủy"
        onSecondaryPress={() => setSwapConfirmVisible(false)}
        onRequestClose={() => setSwapConfirmVisible(false)}
      />

      <AppDialogModal
        visible={timeConfirmVisible}
        variant="info"
        title="Cập nhật thời gian"
        message="Bạn có chắc chắn muốn cập nhật thời gian cho địa điểm này?"
        primaryLabel="Cập nhật"
        onPrimaryPress={confirmTimeEdit}
        secondaryLabel="Hủy"
        onSecondaryPress={() => setTimeConfirmVisible(false)}
        onRequestClose={() => setTimeConfirmVisible(false)}
      />

      <AppDialogModal
        visible={applyConfirmVisible}
        variant="info"
        title="Xác nhận áp dụng"
        message="Bạn có chắc chắn muốn chốt lịch trình này cho chuyến đi của nhóm?"
        primaryLabel="Áp dụng"
        onPrimaryPress={() => {
          handleUpdateStatus(ITINERARY_STATUS.CONFIRMED);
          setApplyConfirmVisible(false);
        }}
        secondaryLabel="Hủy"
        onSecondaryPress={() => setApplyConfirmVisible(false)}
        onRequestClose={() => setApplyConfirmVisible(false)}
      />

      {/* AI Suggestion Modal */}
      <Modal visible={suggestionModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center border-b border-gray-200 px-4 py-4">
            <TouchableOpacity onPress={() => setSuggestionModalVisible(false)}>
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-lg font-bold">Gợi ý địa điểm</Text>
            <View className="w-6" />
          </View>
          <ScrollView className="p-4">
            {aiSuggestMutation.isPending ? <AiLoadingView message="Đang tìm địa điểm thay thế..." /> :
              aiSuggestions.length === 0 ? (
                <View className="py-20 items-center justify-center">
                  <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                  <Text className="mt-4 text-gray-500">Không tìm thấy địa điểm nào phù hợp.</Text>
                </View>
              ) : (
                aiSuggestions.map((s, i) => (
                  <TouchableOpacity key={i} className="mb-3 flex-row items-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm" onPress={() => handleSelectAiSuggestion(s)}>
                    <LocationImage location={s.location} style={{ width: 64, height: 64 }} containerStyle={{ borderRadius: 12 }} />
                    <View className="ml-4 flex-1">
                      <Text className="text-base font-bold text-gray-900">{s.location?.name || "Địa điểm mới"}</Text>
                      <Text className="text-xs text-gray-500" numberOfLines={1}>{s.location?.full_address || s.location?.place_formatted || "Gợi ý từ AI"}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                ))
              )
            }
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* AI Modify Modal */}
      <Modal visible={adjustModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center border-b border-gray-200 px-4 py-4">
            <TouchableOpacity onPress={() => setAdjustModalVisible(false)}>
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-lg font-bold">Điều chỉnh AI</Text>
            <View className="w-6" />
          </View>
          <ScrollView className="px-4 pt-4">
            {aiModifyMutation.isPending ? (
              <AiLoadingView message="AI đang điều chỉnh lịch trình..." />
            ) : (
              <>
                <Text className="mb-4 text-sm text-gray-600">Chọn các địa điểm bạn muốn AI gợi ý thay thế:</Text>
                {placesForAiModify.map((p) => (
                  <TouchableOpacity
                    key={p.placeId}
                    className={`mb-2 flex-row items-center rounded-xl border p-3 ${selectedUnwantedIds.includes(p.placeId) ? "border-primary bg-emerald-50" : "border-gray-200 bg-white"}`}
                    onPress={() => setSelectedUnwantedIds(prev => prev.includes(p.placeId) ? prev.filter(x => x !== p.placeId) : [...prev, p.placeId])}
                  >
                    <Ionicons name={selectedUnwantedIds.includes(p.placeId) ? "checkbox" : "square-outline"} size={24} color={selectedUnwantedIds.includes(p.placeId) ? "#2BB673" : "#9CA3AF"} />
                    {p.imageUrl && (
                      <Image
                        source={{ uri: p.imageUrl }}
                        style={{ width: 48, height: 48, borderRadius: 8, marginLeft: 12 }}
                        contentFit="cover"
                      />
                    )}
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold" numberOfLines={1}>{p.label}</Text>
                      {p.dayHint && <Text className="text-xs text-gray-500">{p.dayHint}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
          <View className="border-t border-gray-200 p-4">
            <TouchableOpacity
              className={`rounded-full py-3.5 ${selectedUnwantedIds.length === 0 || aiModifyMutation.isPending ? "bg-gray-300" : "bg-primary"}`}
              onPress={handleSubmitAiModify}
              disabled={selectedUnwantedIds.length === 0 || aiModifyMutation.isPending}
            >
              {aiModifyMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-center font-bold text-white">Xác nhận thay thế ({selectedUnwantedIds.length})</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Phase 5: Permission Modal for Geofencing */}
      <PermissionModal
        visible={permissionModalVisible}
        onAccept={handleAcceptPermissions}
        onDecline={handleDeclinePermissions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerAction: {
    padding: 8,
    marginRight: 4,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: "#2BB673",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  coverCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  favoriteButtonAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  coverImage: {
    width: "100%",
    height: 240,
  },
  placeholderImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  coverInfo: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  itineraryTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  itineraryDates: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  actionsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  toolsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  primaryRow: {
    marginTop: 4,
  },
  primaryButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  expenseButton: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  expenseText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
  },
  notebookButton: {
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  notebookText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5B21B6",
  },
  setupText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E40AF",
  },
  setupButton: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  saveButton: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
  },
  saveText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  daysList: {
    marginTop: 24,
    paddingHorizontal: 0,
  },
  daySection: {
    marginBottom: 32,
  },
  dayHeader: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyDay: {
    padding: 24,
    alignItems: "center",
  },
  emptyDayText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  statusBadgeContainer: {
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#2BB673",
    borderColor: "#059669",
  },
  completeButton: {
    backgroundColor: "#6366F1",
    borderColor: "#4F46E5",
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  applyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  applyButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  applyButtonDesc: {
    fontSize: 13,
    color: "#B45309",
  },
});
