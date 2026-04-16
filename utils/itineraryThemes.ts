import { tripTypeOptions } from "@/data/tripTypeOptions";

/** Theme gửi BE (tài liệu ví dụ: "Beach", "Food") — map từ id chip trên màn tạo chuyến. */
const TRIP_TYPE_ID_TO_THEME: Record<string, string> = {
  beach: "Beach",
  resort: "Resort",
  adventure: "Adventure",
  culture: "Culture",
  food: "Food",
  nature: "Nature",
  family: "Family",
  honeymoon: "Honeymoon",
  diving: "Diving",
  cruise: "Cruise",
  shopping: "Shopping",
  photography: "Photography",
  wellness: "Wellness",
  nightlife: "Nightlife",
  eco: "Ecotourism",
  trekking: "Trekking",
  business: "Business",
  solo: "Solo",
  spiritual: "Spiritual",
  sport: "Sport",
  festival: "Festival",
};

/**
 * Đổi `tripTypes` (id) → mảng theme cho `ItineraryRequest.themes`.
 */
export function tripTypeIdsToItineraryThemes(ids: string[]): string[] {
  return ids
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => TRIP_TYPE_ID_TO_THEME[id] ?? tripTypeOptions.find((o) => o.id === id)?.name ?? id);
}
