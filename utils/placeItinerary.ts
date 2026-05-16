import { mockAttractions } from "@/data/mockAttractions";
import type { GooglePlaceListItem } from "@/services/googlePlaces";
import type { ItineraryItem } from "@/types/itinerary";
import type { ExternalPlaceSnapshot } from "@/types/places";

export function placeListItemToSnapshot(
  row: GooglePlaceListItem
): ExternalPlaceSnapshot {
  return {
    providerId: row.id,
    name: row.name,
    subtitle: row.subtitle,
    imageUrl: row.id ? "" : row.imageUrl,
    latitude: row.latitude,
    longitude: row.longitude,
    types: row.types,
  };
}

export function googleTypesToItineraryCategory(
  types: string[] | undefined
): ItineraryItem["category"] {
  const t = new Set((types || []).map((x) => x.toLowerCase()));
  if (
    t.has("restaurant") ||
    t.has("cafe") ||
    t.has("food") ||
    t.has("meal_takeaway") ||
    t.has("bakery")
  ) {
    return "restaurant";
  }
  if (
    t.has("lodging") ||
    t.has("hotel") ||
    t.has("resort_hotel") ||
    t.has("motel")
  ) {
    return "hotel";
  }
  if (
    t.has("amusement_park") ||
    t.has("spa") ||
    t.has("gym") ||
    t.has("night_club") ||
    t.has("bowling_alley")
  ) {
    return "activity";
  }
  return "attraction";
}

/** Ưu tiên mockAttractions, sau đó snapshot Google Places, cuối cùng placeholder. */
export function buildItineraryItemForLocationId(
  dayKey: string,
  locationId: string,
  index: number,
  externalPlacesById: Record<string, ExternalPlaceSnapshot>
): ItineraryItem {
  const attraction = mockAttractions.find((attr) => attr.id === locationId);
  if (attraction) {
    let category: ItineraryItem["category"] = "attraction";
    if (attraction.category === "restaurant") category = "restaurant";
    else if (attraction.category === "hotel") category = "hotel";
    else if (attraction.category === "activity") category = "activity";
    const baseTime = 8 + index * 2;
    const uniqueId = `it-${dayKey}-${locationId}`;
    return {
      id: uniqueId,
      locationId,
      providerId: attraction.providerId,
      name: attraction.name,
      image: attraction.image,
      timeRange: {
        start: `${baseTime.toString().padStart(2, "0")}:00`,
        end: `${(baseTime + 2).toString().padStart(2, "0")}:00`,
      },
      price: attraction.priceRange
        ? attraction.priceRange.min === attraction.priceRange.max
          ? `${(attraction.priceRange.min / 1000).toFixed(0)}.000 VND`
          : `${(attraction.priceRange.min / 1000).toFixed(0)}.000 - ${(
              attraction.priceRange.max / 1000
            ).toFixed(0)}.000 VND`
        : "0 VND",
      category,
      googleMapsUrl:
        attraction.latitude != null && attraction.longitude != null
          ? `https://www.google.com/maps?q=${attraction.latitude},${attraction.longitude}`
          : undefined,
      transportation: {
        car: "15 phút",
        motorcycle: "12 phút",
        bus: "25 phút",
        walking: "40 phút",
        bicycle: "30 phút",
      },
      timelineIcon:
        category === "restaurant"
          ? "restaurant"
          : category === "activity"
            ? "telescope"
            : "location",
    };
  }

  const ext = externalPlacesById[locationId];
  if (ext) {
    return buildItineraryItemFromExternalSnapshot(
      dayKey,
      locationId,
      index,
      ext
    );
  }

  const baseTime = 8 + index * 2;
  const uniqueId = `it-${dayKey}-${locationId}`;
  return {
    id: uniqueId,
    locationId,
    providerId: undefined,
    name: "Địa điểm",
    image: "",
    timeRange: {
      start: `${baseTime.toString().padStart(2, "0")}:00`,
      end: `${(baseTime + 2).toString().padStart(2, "0")}:00`,
    },
    price: "0 VND",
    category: "attraction",
    transportation: {
      car: "15 phút",
      motorcycle: "12 phút",
      bus: "25 phút",
      walking: "40 phút",
      bicycle: "30 phút",
    },
    timelineIcon: "location",
  };
}

export function buildItineraryItemFromExternalSnapshot(
  dayKey: string,
  locationId: string,
  index: number,
  snap: ExternalPlaceSnapshot
): ItineraryItem {
  const category = googleTypesToItineraryCategory(snap.types);
  const baseTime = 8 + index * 2;
  const uniqueId = `it-${dayKey}-${locationId}`;

  return {
    id: uniqueId,
    locationId,
    providerId: snap.providerId,
    name: snap.name,
    image: snap.imageUrl || "",
    timeRange: {
      start: `${baseTime.toString().padStart(2, "0")}:00`,
      end: `${(baseTime + 2).toString().padStart(2, "0")}:00`,
    },
    price: "0 VND",
    category,
    googleMapsUrl:
      snap.latitude != null && snap.longitude != null
        ? `https://www.google.com/maps?q=${snap.latitude},${snap.longitude}`
        : undefined,
    transportation: {
      car: "15 phút",
      motorcycle: "12 phút",
      bus: "25 phút",
      walking: "40 phút",
      bicycle: "30 phút",
    },
    timelineIcon:
      category === "restaurant"
        ? "restaurant"
        : category === "activity"
          ? "telescope"
          : "location",
  };
}
