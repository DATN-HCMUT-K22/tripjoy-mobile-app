import { AppDialogModal } from "@/components/common/AppDialogModal";
import {
  useCreateLocationSuggestion,
  useDeleteLocationSuggestion,
  useLocationSuggestions,
} from "@/hooks/useLocationSuggestions";
import { fetchLocationsList } from "@/services/locations";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ExistingLocation = {
  id: string;
  name: string;
  address?: string;
};

interface Props {
  groupId: string;
  currentUserId?: string;
  currentUserRole?: "LEADER" | "CO_LEADER" | "MEMBER";
}

const buildLocationPreview = (lat?: number, lng?: number) => {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return buildStaticMapImageUrl(
    [{ latitude: lat, longitude: lng }],
    { width: 240, height: 160, zoom: 13 }
  );
};

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
  const [availableLocations, setAvailableLocations] = useState<ExistingLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: suggestions = [], isLoading } = useLocationSuggestions(groupId);
  const createMutation = useCreateLocationSuggestion(groupId);
  const deleteMutation = useDeleteLocationSuggestion(groupId);

  const canModerate = currentUserRole === "LEADER" || currentUserRole === "CO_LEADER";

  const selectedLocation = useMemo(
    () => availableLocations.find((item) => item.id === selectedLocationId) || null,
    [availableLocations, selectedLocationId]
  );

  const loadLocations = async () => {
    try {
      setIsLoadingLocations(true);
      const raw = await fetchLocationsList();
      const mapped = raw.map((item) => ({
        id: item.id,
        name: item.name,
        address:
          item.place_formatted || item.full_address || item.address || undefined,
      }));
      setAvailableLocations(mapped);
    } catch {
      showErrorToast("Lỗi", "Không thể tải danh sách địa điểm có sẵn.");
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const resetForm = () => {
    setNotes("");
    setSelectedLocationId(null);
  };

  const handleSubmit = async () => {
    const trimmedNotes = notes.trim();
    if (trimmedNotes.length > 1000) {
      showErrorToast("Ghi chú quá dài", "Ghi chú tối đa 1000 ký tự.");
      return;
    }

    if (!selectedLocationId) {
      showErrorToast("Thiếu thông tin", "Vui lòng chọn một địa điểm có sẵn.");
      return;
    }

    const payload = {
      location_id: selectedLocationId,
      notes: trimmedNotes || undefined,
    };

    try {
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
          "Module chưa sẵn sàng",
          "Backend chưa mở endpoint location-suggestions cho nhóm này. Vui lòng kiểm tra lại BE route/permission."
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
            onPress={async () => {
              const next = !showAddForm;
              setShowAddForm(next);
              if (next && availableLocations.length === 0) {
                await loadLocations();
              }
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
                Chọn địa điểm từ danh sách hệ thống (API yêu cầu{" "}
                <Text style={{ fontWeight: "700" }}>location_id</Text>).
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
                    {availableLocations
                      .filter((item) =>
                        item.name.toLowerCase().includes(locationQuery.trim().toLowerCase())
                      )
                      .map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => setSelectedLocationId(item.id)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: "#F3F4F6",
                            backgroundColor:
                              selectedLocationId === item.id ? "#EDE9FE" : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: selectedLocationId === item.id ? "700" : "500",
                              color: "#111827",
                              maxWidth: "100%",
                            }}
                            numberOfLines={2}
                          >
                            {item.name}
                          </Text>
                          {!!item.address && (
                            <Text
                              style={{ color: "#6B7280", fontSize: 12, marginTop: 2, maxWidth: "100%" }}
                              numberOfLines={2}
                            >
                              {item.address}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
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
                const previewUri = buildLocationPreview(location?.lat, location?.lng);
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
                        {previewUri ? (
                          <Image
                            source={{ uri: previewUri }}
                            style={{
                              width: "100%",
                              height: 110,
                              borderRadius: 10,
                              backgroundColor: "#E5E7EB",
                              marginBottom: 8,
                            }}
                            contentFit="cover"
                          />
                        ) : null}
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
