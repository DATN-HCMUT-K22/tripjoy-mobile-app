import { AppDialogModal } from "@/components/common/AppDialogModal";
import {
  useCreateLocationSuggestion,
  useDeleteLocationSuggestion,
  useLocationSuggestions,
} from "@/hooks/useLocationSuggestions";
import { fetchLocationsList } from "@/services/locations";
import {
  mapboxFeatureToLocationData,
  searchMapboxPlaces,
  type MapboxGeocodeFeature,
} from "@/services/mapboxGeocoding";
import { SuggestLocationRequest } from "@/types/locationSuggestion";
import { buildMapboxStaticMapUrl } from "@/utils/mapbox";
import { getMapboxAccessToken } from "@/utils/mapbox";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  return buildMapboxStaticMapUrl(
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
  const [expanded, setExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [mode, setMode] = useState<"existing" | "mapbox">("existing");
  const [notes, setNotes] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [availableLocations, setAvailableLocations] = useState<ExistingLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [mapboxSearchText, setMapboxSearchText] = useState("");
  const [mapboxResults, setMapboxResults] = useState<MapboxGeocodeFeature[]>([]);
  const [mapboxSearching, setMapboxSearching] = useState(false);
  const [selectedMapboxFeature, setSelectedMapboxFeature] =
    useState<MapboxGeocodeFeature | null>(null);
  const mapboxAbortRef = useRef<AbortController | null>(null);

  type DialogConfig = {
    title: string;
    message: string;
    variant: "error" | "info" | "warning";
    primaryLabel?: string;
    onPrimary?: () => void | Promise<void>;
    secondaryLabel?: string;
    onSecondary?: () => void;
    primaryDestructive?: boolean;
  };
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const closeDialog = () => setDialog(null);

  const { data: suggestions = [], isLoading } = useLocationSuggestions(groupId);
  const createMutation = useCreateLocationSuggestion(groupId);
  const deleteMutation = useDeleteLocationSuggestion(groupId);

  const canModerate = currentUserRole === "LEADER" || currentUserRole === "CO_LEADER";

  const selectedLocation = useMemo(
    () => availableLocations.find((item) => item.id === selectedLocationId) || null,
    [availableLocations, selectedLocationId]
  );

  const hasMapboxToken = useMemo(() => !!getMapboxAccessToken().trim(), []);

  useEffect(() => {
    if (mode !== "mapbox") return;
    const q = mapboxSearchText.trim();
    if (q.length < 2) {
      setMapboxResults([]);
      setMapboxSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      mapboxAbortRef.current?.abort();
      const ctrl = new AbortController();
      mapboxAbortRef.current = ctrl;
      setMapboxSearching(true);
      searchMapboxPlaces(q, ctrl.signal)
        .then((feats) => {
          if (!ctrl.signal.aborted) setMapboxResults(feats);
        })
        .catch((e: unknown) => {
          if ((e as Error)?.name === "AbortError") return;
          setMapboxResults([]);
          const msg = e instanceof Error ? e.message : "Không tìm được địa điểm";
          setDialog({ title: "Mapbox", message: msg, variant: "error" });
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setMapboxSearching(false);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [mapboxSearchText, mode]);

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
      setDialog({
        title: "Lỗi",
        message: "Không thể tải danh sách địa điểm có sẵn.",
        variant: "error",
      });
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const resetForm = () => {
    setNotes("");
    setSelectedLocationId(null);
    setMapboxSearchText("");
    setMapboxResults([]);
    setSelectedMapboxFeature(null);
  };

  const handleSubmit = async () => {
    const trimmedNotes = notes.trim();
    if (trimmedNotes.length > 1000) {
      setDialog({
        title: "Lỗi",
        message: "Ghi chú tối đa 1000 ký tự.",
        variant: "warning",
      });
      return;
    }

    let payload: SuggestLocationRequest | null = null;

    if (mode === "existing") {
      if (!selectedLocationId) {
        setDialog({
          title: "Thiếu thông tin",
          message: "Vui lòng chọn một địa điểm có sẵn.",
          variant: "info",
        });
        return;
      }
      payload = {
        location_id: selectedLocationId,
        notes: trimmedNotes || undefined,
      };
    } else {
      if (!selectedMapboxFeature) {
        setDialog({
          title: "Thiếu thông tin",
          message:
            "Hãy tìm và chọn một địa điểm từ Mapbox (có sẵn kinh độ / vĩ độ).",
          variant: "info",
        });
        return;
      }
      let location_data: NonNullable<SuggestLocationRequest["location_data"]>;
      try {
        location_data = mapboxFeatureToLocationData(selectedMapboxFeature);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Không map được dữ liệu Mapbox";
        setDialog({ title: "Lỗi", message: msg, variant: "error" });
        return;
      }
      payload = {
        location_data,
        notes: trimmedNotes || undefined,
      };
    }

    try {
      await createMutation.mutateAsync(payload);
      resetForm();
      setShowAddForm(false);
    } catch (error: any) {
      const rawMessage = error?.message || "Không thể tạo gợi ý địa điểm";
      if (
        rawMessage?.includes("Resource not found") ||
        error?.response?.data?.code === 1003
      ) {
        setDialog({
          title: "Module chưa sẵn sàng",
          message:
            "Backend chưa mở endpoint location-suggestions cho nhóm này. Vui lòng kiểm tra lại BE route/permission.",
          variant: "warning",
        });
        return;
      }
      setDialog({ title: "Lỗi", message: rawMessage, variant: "error" });
    }
  };

  const handleDelete = (suggestionId: string) => {
    setDialog({
      title: "Xóa gợi ý",
      message: "Bạn có chắc muốn xóa gợi ý này?",
      variant: "warning",
      secondaryLabel: "Hủy",
      onSecondary: () => setDialog(null),
      primaryLabel: "Xóa",
      primaryDestructive: true,
      onPrimary: async () => {
        setDialog(null);
        try {
          await deleteMutation.mutateAsync(suggestionId);
        } catch (error: any) {
          setDialog({
            title: "Lỗi",
            message: error?.message || "Không thể xóa gợi ý",
            variant: "error",
          });
        }
      },
    });
  };

  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 14 }}>
      <AppDialogModal
        visible={!!dialog}
        onRequestClose={closeDialog}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        variant={dialog?.variant ?? "info"}
        primaryLabel={dialog?.primaryLabel}
        onPrimaryPress={dialog?.onPrimary}
        secondaryLabel={dialog?.secondaryLabel}
        onSecondaryPress={dialog?.onSecondary}
        primaryDestructive={dialog?.primaryDestructive}
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
              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                {(["existing", "mapbox"] as const).map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setMode(item)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      marginRight: 8,
                      backgroundColor: mode === item ? "#111827" : "#E5E7EB",
                    }}
                  >
                    <Text style={{ color: mode === item ? "#fff" : "#374151", fontWeight: "600" }}>
                      {item === "existing" ? "Địa điểm có sẵn" : "Tìm Mapbox"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {mode === "existing" ? (
                <>
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
                  <View style={{ marginTop: 8, maxHeight: 160 }}>
                    {isLoadingLocations ? (
                      <ActivityIndicator color="#7C3AED" />
                    ) : (
                      availableLocations
                        .filter((item) =>
                          item.name.toLowerCase().includes(locationQuery.trim().toLowerCase())
                        )
                        .slice(0, 12)
                        .map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => setSelectedLocationId(item.id)}
                            style={{
                              paddingVertical: 9,
                              borderBottomWidth: 1,
                              borderBottomColor: "#F3F4F6",
                            }}
                          >
                            <Text style={{ fontWeight: selectedLocationId === item.id ? "700" : "500" }}>
                              {item.name}
                            </Text>
                            {!!item.address && (
                              <Text style={{ color: "#6B7280", fontSize: 12 }}>{item.address}</Text>
                            )}
                          </TouchableOpacity>
                        ))
                    )}
                  </View>
                  {selectedLocation && (
                    <Text style={{ marginTop: 8, color: "#2563EB", fontSize: 12 }}>
                      Đã chọn: {selectedLocation.name}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  {!hasMapboxToken ? (
                    <Text style={{ color: "#B45309", fontSize: 13, marginBottom: 8 }}>
                      Chưa có Mapbox token. Thêm EXPO_PUBLIC_MAPBOX_TOKEN (hoặc EXPO_PUBLIC_MAP_API_KEY)
                      vào .env rồi build lại app.
                    </Text>
                  ) : null}
                  <TextInput
                    placeholder="Tìm địa điểm (Mapbox)..."
                    value={mapboxSearchText}
                    onChangeText={(t) => {
                      setMapboxSearchText(t);
                      setSelectedMapboxFeature(null);
                    }}
                    style={{
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: "#fff",
                      marginBottom: 8,
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                    Gõ ít nhất 2 ký tự. Chọn một dòng để lấy tọa độ chính xác.
                  </Text>
                  <View style={{ maxHeight: 200, marginBottom: 8 }}>
                    {mapboxSearching ? (
                      <ActivityIndicator color="#7C3AED" style={{ marginVertical: 12 }} />
                    ) : (
                      <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                        {mapboxResults.map((feat) => {
                          const isSel = selectedMapboxFeature?.id === feat.id;
                          const [lng, lat] = feat.center ?? feat.geometry?.coordinates ?? [
                            NaN,
                            NaN,
                          ];
                          const coordLabel =
                            typeof lat === "number" &&
                            typeof lng === "number" &&
                            !Number.isNaN(lat) &&
                            !Number.isNaN(lng)
                              ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                              : "—";
                          return (
                            <TouchableOpacity
                              key={feat.id}
                              onPress={() => setSelectedMapboxFeature(feat)}
                              style={{
                                paddingVertical: 10,
                                paddingHorizontal: 8,
                                borderBottomWidth: 1,
                                borderBottomColor: "#F3F4F6",
                                backgroundColor: isSel ? "#EDE9FE" : "transparent",
                                borderRadius: 8,
                              }}
                            >
                              {buildLocationPreview(
                                Number.isNaN(lat) ? undefined : lat,
                                Number.isNaN(lng) ? undefined : lng
                              ) ? (
                                <Image
                                  source={{
                                    uri: buildLocationPreview(
                                      Number.isNaN(lat) ? undefined : lat,
                                      Number.isNaN(lng) ? undefined : lng
                                    )!,
                                  }}
                                  style={{
                                    width: "100%",
                                    height: 92,
                                    borderRadius: 8,
                                    marginBottom: 8,
                                    backgroundColor: "#E5E7EB",
                                  }}
                                  contentFit="cover"
                                />
                              ) : null}
                              <Text style={{ fontWeight: isSel ? "700" : "500", color: "#111827" }}>
                                {feat.text || feat.place_name?.split(",")[0] || "Địa điểm"}
                              </Text>
                              {!!feat.place_name && (
                                <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                                  {feat.place_name}
                                </Text>
                              )}
                              <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                                {coordLabel}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                  {selectedMapboxFeature && (
                    <View
                      style={{
                        padding: 10,
                        backgroundColor: "#ECFDF5",
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "#A7F3D0",
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#065F46" }}>
                        Đã chọn để gửi đề xuất
                      </Text>
                      <Text style={{ fontSize: 13, color: "#064E3B", marginTop: 4 }}>
                        {selectedMapboxFeature.place_name ||
                          selectedMapboxFeature.text ||
                          "—"}
                      </Text>
                    </View>
                  )}
                </>
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
              {suggestions.map((item) => {
                const canDelete = canModerate || item.suggested_by?.id === currentUserId;
                const location = item.location;
                const previewUri = buildLocationPreview(location?.lat, location?.lng);
                return (
                  <View
                    key={item.id}
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
                        <Text style={{ fontWeight: "700", color: "#111827" }}>{location?.name}</Text>
                        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                          {location?.place_formatted || location?.full_address || "Không có địa chỉ"}
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
                      {canDelete && (
                        <TouchableOpacity
                          onPress={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      )}
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
