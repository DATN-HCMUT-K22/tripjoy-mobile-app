import { useQuery } from "@tanstack/react-query";
import { hotelsService } from "@/services/hotels";

import type { HotelSearchResult } from "@/services/hotels";

/**
 * Fetch hotels automatically on component mount
 * Uses default query "man" - can be customized in the future
 */
export function useSearchHotels() {
  return useQuery<HotelSearchResult[], Error>({
    queryKey: ["hotels", "search", "default"],
    queryFn: () => hotelsService.searchDestination("man"), // Default query
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
}
