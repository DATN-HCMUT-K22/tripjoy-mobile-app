import { AppDialogModal } from "@/components/common/AppDialogModal";
import {
  useCreateLocationSuggestion,
  useDeleteLocationSuggestion,
  useLocationSuggestions,
} from "@/hooks/useLocationSuggestions";
import { autocompleteLocations, normalizeAutocompletePayload, LocationAutocompleteSuggestionDto, resolveLocation, ResolveLocationProvider } from "@/services/locations";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LocationImage } from "@/components/location/LocationImage";
import React, { useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


interface Props {
  groupId: string;
  currentUserId?: string;
  currentUserRole?: "LEADER" | "CO_LEADER" | "MEMBER";
}

// Removed buildLocationPreview in favor of LocationImage component

const formatDateTime = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export function LocationSuggestionsSection({
  groupId,
  currentUserId,
  currentUserRole,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [availableLocations, setAvailableLocations] = useState<LocationAutocompleteSuggestionDto[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationAutocompleteSuggestionDto | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: suggestions = [], isLoading } = useLocationSuggestions(groupId);
  const createMutation = useCreateLocationSuggestion(groupId);
  const deleteMutation = useDeleteLocationSuggestion(groupId);

  const canModerate = currentUserRole === "LEADER" || currentUserRole === "CO_LEADER";

  useEffect(() => {
    if (!showAddForm || !locationQuery.trim()) {
      setAvailableLocations([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingLocations(true);
      try {
        const res = await autocompleteLocations({ q: locationQuery.trim() });
        setAvailableLocations(normalizeAutocompletePayload(res.data));
      } catch (e) {
        console.warn("Autocomplete error", e);
      } finally {
        setIsLoadingLocations(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationQuery, showAddForm]);

  const resetForm = () => {
    setNotes("");
    setSelectedLocation(null);
    setLocationQuery("");
  };

  const handleSubmit = async () => {
    const trimmedNotes = notes.trim();
    if (trimmedNotes.length > 1000) {
      showErrorToast("Ghi chú quá dài", "Ghi chú tối đa 1000 ký tự.");
      return;
    }

    if (!selectedLocation) {
      showErrorToast("Thiếu thông tin", "Vui lòng chọn một địa điểm từ danh sách gợi ý.");
      return;
    }

    let payload: any = { notes: trimmedNotes || undefined };

    try {
      if (selectedLocation.location_id) {
        // Option 1: DB location
        payload.location_id = selectedLocation.location_id;
      } else {
        // Option 2: Resolve first (để lấy ID chuẩn nếu được)
        try {
          const resolveRes = await resolveLocation({
            name: selectedLocation.name,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            full_address: selectedLocation.full_address || selectedLocation.secondary_text,
            provider: (selectedLocation.source as ResolveLocationProvider) || "MAPBOX",
            provider_id: selectedLocation.provider_id,
          });

          if (resolveRes.data?.id) {
            payload.location_id = resolveRes.data.id;
          } else {
            payload.location_data = {
              provider: (selectedLocation.source as ResolveLocationProvider) || "MAPBOX",
              provider_id: selectedLocation.provider_id,
              name: selectedLocation.name,
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              full_address: selectedLocation.full_address || selectedLocation.secondary_text,
              location_type: "POI",
            };
          }
        } catch (e) {
          payload.location_data = {
            provider: (selectedLocation.source as ResolveLocationProvider) || "MAPBOX",
            provider_id: selectedLocation.provider_id,
            name: selectedLocation.name,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            full_address: selectedLocation.full_address || selectedLocation.secondary_text,
            location_type: "POI",
          };
        }
      }

      await createMutation.mutateAsync(payload);
      resetForm();
      setShowAddForm(false);
      showSuccessToast("Đã gửi gợi ý địa điểm");
    } catch (error: any) {
      const rawMessage = error?.message || "Không thể tạo gợi ý địa điểm";
      if (
        rawMessage?.includes("Resource not found") ||
        error?.response?.data?.code === 1003
      ) {
        showErrorToast(
          "Không tìm thấy nhóm",
          "Không tìm thấy thông tin nhóm hoặc bạn không có quyền thực hiện hành động này (404/1003)."
        );
        return;
      }
      showErrorToast("Không tạo được gợi ý", rawMessage);
    }
  };

  const handleDelete = (suggestionId: string) => {
    setConfirmDeleteId(suggestionId);
  };

  const executeDeleteSuggestion = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      showSuccessToast("Đã xóa gợi ý");
    } catch (error: any) {
      showErrorToast("Không xóa được", error?.message || "Không thể xóa gợi ý");
    }
  };

  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 14 }}>
      <AppDialogModal
        visible={!!confirmDeleteId}
        onRequestClose={() => setConfirmDeleteId(null)}
        title="Xóa gợi ý"
        message="Bạn có chắc muốn xóa gợi ý này?"
        variant="warning"
        secondaryLabel="Hủy"
        onSecondaryPress={() => setConfirmDeleteId(null)}
        primaryLabel="Xóa"
        primaryDestructive
        onPrimaryPress={() => {
          void executeDeleteSuggestion();
        }}
      />
      <TouchableOpacity
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: "#EDE9FE",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Ionicons name="bulb" size={22} color="#7C3AED" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>Địa điểm gợi ý</Text>
          <Text style={{ fontSize: 13, color: "#6B7280" }}>{suggestions.length} gợi ý từ thành viên</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {expanded && (
        <View style={{ marginTop: 14 }}>
          <TouchableOpacity
            onPress={() => {
              const next = !showAddForm;
              setShowAddForm(next);
            }}
            activeOpacity={0.8}
            style={{
              backgroundColor: "#7C3AED",
              borderRadius: 12,
              paddingVertical: 10,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {showAddForm ? "Đóng form đề xuất" : "Đề xuất địa điểm mới"}
            </Text>
          </TouchableOpacity>

          {showAddForm && (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
                backgroundColor: "#FAFAFA",
              }}
            >
              <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>
                Tìm kiếm địa điểm (nhà hàng, khách sạn, điểm tham quan...).
              </Text>
              <TextInput
                placeholder="Tìm địa điểm..."
                value={locationQuery}
                onChangeText={setLocationQuery}
                style={{
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: "#fff",
                }}
              />
              <View
                style={{
                  marginTop: 8,
                  maxHeight: 200,
                  width: "100%",
                  alignSelf: "stretch",
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 10,
                  backgroundColor: "#fff",
                  overflow: "hidden",
                }}
              >
                {isLoadingLocations ? (
                  <ActivityIndicator color="#7C3AED" style={{ marginVertical: 12 }} />
                ) : (
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {availableLocations.map((item, idx) => {
                      const key = item.location_id || item.provider_id || `loc-${idx}`;
                      const isSelected = selectedLocation?.provider_id === item.provider_id;
                      return (
                        <TouchableOpacity
                          key={key}
                          onPress={() => setSelectedLocation(item)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: "#F3F4F6",
                            backgroundColor: isSelected ? "#EDE9FE" : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: isSelected ? "700" : "500",
                              color: "#111827",
                              maxWidth: "100%",
                            }}
                            numberOfLines={2}
                          >
                            {item.name}
                          </Text>
                          {(item.full_address || item.secondary_text) && (
                            <Text
                              style={{ color: "#6B7280", fontSize: 12, marginTop: 2, maxWidth: "100%" }}
                              numberOfLines={2}
                            >
                              {item.full_address || item.secondary_text}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
              {selectedLocation && (
                <Text style={{ marginTop: 8, color: "#2563EB", fontSize: 12 }}>
                  Đã chọn: {selectedLocation.name}
                </Text>
              )}

              <TextInput
                placeholder="Ghi chú cho địa điểm..."
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={1000}
                style={{
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 10,
                  minHeight: 84,
                  textAlignVertical: "top",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: "#fff",
                }}
              />
              <Text style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
                {notes.length}/1000 ký tự
              </Text>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={createMutation.isPending}
                style={{
                  marginTop: 10,
                  backgroundColor: createMutation.isPending ? "#A78BFA" : "#7C3AED",
                  borderRadius: 10,
                  alignItems: "center",
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {createMutation.isPending ? "Đang gửi..." : "Gửi đề xuất"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading ? (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator color="#7C3AED" />
            </View>
          ) : suggestions.length === 0 ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                padding: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#6B7280" }}>Chưa có gợi ý địa điểm nào</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {suggestions.map((item, index) => {
                const canDelete = canModerate || item.suggested_by?.id === currentUserId;
                const location = item.location;
                const addressLine =
                  location?.place_formatted ||
                  location?.full_address ||
                  location?.content ||
                  (location?.category ? `Loại: ${location.category}` : "") ||
                  "Không có địa chỉ";
                return (
                  <View
                    key={item.id ?? `location-suggestion-${index}`}
                    style={{
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 12,
                      padding: 12,
                      backgroundColor: "#fff",
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <LocationImage
                          location={location}
                          style={{
                            width: "100%",
                            height: 140,
                            borderRadius: 10,
                          }}
                          containerStyle={{
                            marginBottom: 8,
                          }}
                        />
                        <Text style={{ fontWeight: "700", color: "#111827" }}>
                          {location?.name ?? "Địa điểm"}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                          {addressLine}
                        </Text>
                        {(typeof location?.lat === "number" && typeof location?.lng === "number") ? (
                          <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>
                            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                          </Text>
                        ) : null}
                        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                          Gợi ý bởi {item.suggested_by?.fullName || item.suggested_by?.username || "Thành viên"}
                        </Text>
                        {!!item.notes && (
                          <Text style={{ marginTop: 6, color: "#374151" }}>{item.notes}</Text>
                        )}
                        <Text style={{ marginTop: 6, fontSize: 11, color: "#9CA3AF" }}>
                          {formatDateTime(item.created_at)}
                        </Text>
                      </View>
                      {canDelete && item.id ? (
                        <TouchableOpacity
                          onPress={() => handleDelete(item.id!)}
                          disabled={deleteMutation.isPending}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
