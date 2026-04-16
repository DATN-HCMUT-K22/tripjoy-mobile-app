import type { TripSetupData } from "@/contexts/TripSetupContext";
import { BUDGET_CUSTOM_ID } from "@/data/budgetOptions";
import type { GenerateItineraryRequest } from "@/services/itineraries";
import { tripPickerDateToItineraryDateTime } from "@/utils/itineraryDates";
import { tripTypeIdsToItineraryThemes } from "@/utils/itineraryThemes";

/** Mốc trung tâm Việt Nam khi điểm đến chưa có tọa độ (gợi ý AI theo vùng). */
const DEFAULT_LAT = 16.0544;
const DEFAULT_LNG = 108.2022;

/**
 * Ước tính tổng ngân sách (VNĐ) gửi AI — từ mức gợi ý hoặc khoảng tùy chỉnh / người.
 */
function estimateBudgetTotalVnd(tripData: TripSetupData): number {
  const pq = Math.max(1, tripData.peopleQuantity);
  const b = tripData.budget;
  if (
    b === BUDGET_CUSTOM_ID &&
    tripData.budgetMinVnd != null &&
    tripData.budgetMaxVnd != null
  ) {
    const mid = (tripData.budgetMinVnd + tripData.budgetMaxVnd) / 2;
    return Math.round(mid * pq);
  }
  const tierMidPerPerson: Record<string, number> = {
    budget: 7_500_000,
    mid: 15_000_000,
    flexible: 40_000_000,
    luxury: 100_000_000,
  };
  const perPerson = tierMidPerPerson[b ?? "mid"] ?? 15_000_000;
  return Math.round(perPerson * pq);
}

/**
 * Gộp dữ liệu màn thiết lập chuyến → body `POST /itineraries/ai-generate`.
 */
export function tripSetupToAiGenerateRequest(
  tripData: TripSetupData
): GenerateItineraryRequest {
  const dest =
    tripData.destinationLocation?.name?.trim() ||
    tripData.location?.name?.trim() ||
    "";
  const destination =
    dest.length > 0 ? `${dest}, Việt Nam` : "Việt Nam";

  const loc = tripData.destinationLocation ?? tripData.location;
  const latitude =
    typeof loc?.latitude === "number" && !Number.isNaN(loc.latitude)
      ? loc.latitude
      : DEFAULT_LAT;
  const longitude =
    typeof loc?.longitude === "number" && !Number.isNaN(loc.longitude)
      ? loc.longitude
      : DEFAULT_LNG;

  const startDate = tripPickerDateToItineraryDateTime(
    tripData.startDate,
    "start"
  );
  const endDate = tripPickerDateToItineraryDateTime(tripData.endDate, "end");

  const themes = tripTypeIdsToItineraryThemes(tripData.tripTypes);
  const themesOut = themes.length > 0 ? themes : ["Culture", "Food"];

  return {
    destination,
    latitude,
    longitude,
    startDate,
    endDate,
    peopleQuantity: Math.max(1, Math.min(50, tripData.peopleQuantity)),
    budgetEstimate: Math.max(0, estimateBudgetTotalVnd(tripData)),
    themes: themesOut,
  };
}
