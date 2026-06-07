import { useQuery } from "@tanstack/react-query";
import { hotelsService } from "@/services/hotels";

import type { HotelSearchResult } from "@/services/hotels";

/**
 * Fetch hotels automatically on component mount
 * Uses default query "man" if no query provided
 */
export function useSearchHotels(searchQuery?: string) {
  const query = searchQuery?.trim() ? searchQuery.trim() : "man";
  return useQuery<HotelSearchResult[], Error>({
    queryKey: ["hotels", "search", query],
    queryFn: () => hotelsService.searchDestination(query),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
}
