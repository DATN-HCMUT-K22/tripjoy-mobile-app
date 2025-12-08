import { ItineraryItem } from "@/types/itinerary";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface ItineraryContextType {
  // Lưu địa điểm đã chọn theo ngày: { dayKey: locationIds[] }
  selectedLocationsByDay: Record<string, string[]>;
  // Lưu itinerary items theo ngày: { dayKey: ItineraryItem[] }
  itineraryItemsByDay: Record<string, ItineraryItem[]>;
  // Thêm địa điểm cho một ngày
  addLocationsToDay: (dayKey: string, locationIds: string[]) => void;
  // Thêm itinerary items cho một ngày
  addItineraryItemsToDay: (dayKey: string, items: ItineraryItem[]) => void;
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

  const resetItinerary = () => {
    setSelectedLocationsByDay({});
    setItineraryItemsByDay({});
  };

  return (
    <ItineraryContext.Provider
      value={{
        selectedLocationsByDay,
        itineraryItemsByDay,
        addLocationsToDay,
        addItineraryItemsToDay,
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
