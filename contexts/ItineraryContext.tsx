import { ItineraryItem } from "@/types/itinerary";
import type { ExternalPlaceSnapshot } from "@/types/places";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface ItineraryContextType {
  // Lưu địa điểm đã chọn theo ngày: { dayKey: locationIds[] }
  selectedLocationsByDay: Record<string, string[]>;
  // Lưu itinerary items theo ngày: { dayKey: ItineraryItem[] }
  itineraryItemsByDay: Record<string, ItineraryItem[]>;
  /** Địa điểm POI (id = locationId TripJoy sau resolve / từ GET search), kèm snapshot hiển thị */
  externalPlacesById: Record<string, ExternalPlaceSnapshot>;
  upsertExternalPlaces: (snapshots: Record<string, ExternalPlaceSnapshot>) => void;
  // Thêm địa điểm cho một ngày
  addLocationsToDay: (dayKey: string, locationIds: string[]) => void;
  // Thêm itinerary items cho một ngày
  addItineraryItemsToDay: (dayKey: string, items: ItineraryItem[]) => void;
  // Hoán đổi hai item trong ngày và giữ nguyên timeRange tại vị trí
  swapItems: (dayKey: string, fromIndex: number, toIndex: number) => void;
  // Reset tất cả
  resetItinerary: () => void;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(
  undefined
);

export const ItineraryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedLocationsByDay, setSelectedLocationsByDay] = useState<
    Record<string, string[]>
  >({});
  const [itineraryItemsByDay, setItineraryItemsByDay] = useState<
    Record<string, ItineraryItem[]>
  >({});
  const [externalPlacesById, setExternalPlacesById] = useState<
    Record<string, ExternalPlaceSnapshot>
  >({});

  const upsertExternalPlaces = (
    snapshots: Record<string, ExternalPlaceSnapshot>
  ) => {
    setExternalPlacesById((prev) => ({ ...prev, ...snapshots }));
  };

  const addLocationsToDay = (dayKey: string, locationIds: string[]) => {
    setSelectedLocationsByDay((prev) => ({
      ...prev,
      [dayKey]: locationIds,
    }));
  };

  const addItineraryItemsToDay = (dayKey: string, items: ItineraryItem[]) => {
    setItineraryItemsByDay((prev) => ({
      ...prev,
      [dayKey]: items,
    }));
  };

  const swapItems = (dayKey: string, fromIndex: number, toIndex: number) => {
    setItineraryItemsByDay((prev) => {
      const items = prev[dayKey] || [];
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= items.length ||
        toIndex >= items.length
      ) {
        return prev;
      }

      const newItems = [...items];
      const itemFrom = { ...newItems[fromIndex] };
      const itemTo = { ...newItems[toIndex] };

      const timeRangeAtFromIndex = { ...newItems[fromIndex].timeRange };
      const timeRangeAtToIndex = { ...newItems[toIndex].timeRange };

      itemFrom.timeRange = timeRangeAtToIndex;
      itemTo.timeRange = timeRangeAtFromIndex;

      newItems[fromIndex] = itemTo;
      newItems[toIndex] = itemFrom;

      return {
        ...prev,
        [dayKey]: newItems,
      };
    });
  };

  const resetItinerary = () => {
    setSelectedLocationsByDay({});
    setItineraryItemsByDay({});
    setExternalPlacesById({});
  };

  return (
    <ItineraryContext.Provider
      value={{
        selectedLocationsByDay,
        itineraryItemsByDay,
        externalPlacesById,
        upsertExternalPlaces,
        addLocationsToDay,
        addItineraryItemsToDay,
        swapItems,
        resetItinerary,
      }}
    >
      {children}
    </ItineraryContext.Provider>
  );
};

export const useItinerary = () => {
  const context = useContext(ItineraryContext);
  if (!context) {
    throw new Error("useItinerary must be used within ItineraryProvider");
  }
  return context;
};
