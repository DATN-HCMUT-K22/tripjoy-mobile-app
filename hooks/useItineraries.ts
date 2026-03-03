import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { mockItineraries } from "@/data/mockItineraries";
import { getItineraries } from "@/services/itineraries";
import type { Itinerary as DisplayItinerary } from "@/types/group";
import { useQuery } from "@tanstack/react-query";

/** Map itinerary từ API (chỉ id, name, startDate, endDate) sang dạng hiển thị đầy đủ */
function mapApiItineraryToDisplay(
  api: { id: string; name: string; startDate: string; endDate: string }
): DisplayItinerary {
  const start = new Date(api.startDate);
  const end = new Date(api.endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  return {
    id: api.id,
    groupId: "",
    name: api.name,
    image: "",
    startDate: api.startDate,
    endDate: api.endDate,
    duration: `${days} ngày`,
    memberCount: 0,
    budget: 0,
  };
}

/**
 * Hook lấy danh sách lịch trình (API getItineraries hoặc mock khi EXPO_PUBLIC_MOCK_DATA).
 */
export function useItineraries() {
  return useQuery({
    queryKey: ["itineraries"],
    queryFn: async (): Promise<DisplayItinerary[]> => {
      if (EXPO_PUBLIC_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 200));
        return mockItineraries;
      }
      const res = await getItineraries();
      const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
      return list.map(mapApiItineraryToDisplay);
    },
    staleTime: 60 * 1000,
  });
}
