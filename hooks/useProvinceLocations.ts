import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { fetchAdministrativeProvincesVN } from "@/services/locations";
import { mapLocationDtoToTripLocation } from "@/utils/mapLocationDtoToTrip";
import type { Location } from "@/types/trip";
import { useQuery } from "@tanstack/react-query";

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

/**
 * Danh sách tỉnh/thành VN (Tier 1) từ GET /locations/administrative.
 * Cache HTTP 24h + AsyncStorage (trong service) — không gọi API khi EXPO_PUBLIC_MOCK_DATA.
 */
export function useProvinceLocations() {
  return useQuery({
    queryKey: ["locations", "administrative", "PROVINCE", "VN"],
    queryFn: async (): Promise<Location[]> => {
      const list = await fetchAdministrativeProvincesVN();
      return list.map(mapLocationDtoToTripLocation);
    },
    enabled: !EXPO_PUBLIC_MOCK_DATA,
    staleTime: TWENTY_FOUR_H_MS,
    gcTime: TWENTY_FOUR_H_MS * 2,
  });
}
