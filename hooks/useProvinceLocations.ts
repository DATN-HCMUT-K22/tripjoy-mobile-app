import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { getLocations, normalizeLocationsPayload } from "@/services/locations";
import { mapLocationDtoToTripLocation } from "@/utils/mapLocationDtoToTrip";
import type { Location } from "@/types/trip";
import { useQuery } from "@tanstack/react-query";

/**
 * Danh sách địa điểm (tỉnh/thành) từ GET /locations.
 * Khi EXPO_PUBLIC_MOCK_DATA: không gọi API (màn hình dùng mock riêng).
 */
export function useProvinceLocations() {
  return useQuery({
    queryKey: ["locations", "provinces"],
    queryFn: async (): Promise<Location[]> => {
      const response = await getLocations();
      if (response.code !== 1000 && response.code !== 0) {
        throw new Error(
          response.message || "Không tải được danh sách tỉnh thành"
        );
      }
      const list = normalizeLocationsPayload(response.data);
      return list.map(mapLocationDtoToTripLocation);
    },
    enabled: !EXPO_PUBLIC_MOCK_DATA,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
