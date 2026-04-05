import {
  BUDGET_CUSTOM_ID,
  BUDGET_MANUAL_MAX_PER_PERSON_VND,
} from "@/data/budgetOptions";
import { Location } from "@/types/trip";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface TripSetupData {
  location: Location | null; // Điểm đến (giữ để tương thích)
  departureLocation: Location | null; // Điểm đi
  destinationLocation: Location | null; // Điểm đến
  dateRange: string | null;
  budget: string | null;
  /** Khi budget === custom: khoảng VNĐ/người */
  budgetMinVnd: number | null;
  budgetMaxVnd: number | null;
  tripTypes: string[];
  /** Số người tham gia (gửi people_quantity khi tạo itinerary) */
  peopleQuantity: number;
  startDate: string | null;
  endDate: string | null;
}

interface TripSetupContextType {
  tripData: TripSetupData;
  setLocation: (location: Location | null) => void; // Giữ để tương thích
  setDepartureLocation: (location: Location | null) => void;
  setDestinationLocation: (location: Location | null) => void;
  setDateRange: (range: string | null) => void;
  setBudget: (budget: string | null) => void;
  setCustomBudgetRange: (
    minVnd: number | null,
    maxVnd: number | null
  ) => void;
  setTripTypes: (types: string[]) => void;
  setPeopleQuantity: (n: number) => void;
  adjustPeopleQuantity: (delta: number) => void;
  setStartDate: (date: string | null) => void;
  setEndDate: (date: string | null) => void;
  resetTripData: () => void;
}

const TripSetupContext = createContext<TripSetupContextType | undefined>(
  undefined
);

export const TripSetupProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tripData, setTripData] = useState<TripSetupData>({
    location: null,
    departureLocation: null,
    destinationLocation: null,
    dateRange: null,
    budget: null,
    budgetMinVnd: null,
    budgetMaxVnd: null,
    tripTypes: [],
    peopleQuantity: 2,
    startDate: null,
    endDate: null,
  });

  const setLocation = (location: Location | null) => {
    setTripData((prev) => ({
      ...prev,
      location,
      destinationLocation: location,
    }));
  };

  const setDepartureLocation = (location: Location | null) => {
    setTripData((prev) => ({ ...prev, departureLocation: location }));
  };

  const setDestinationLocation = (location: Location | null) => {
    setTripData((prev) => ({
      ...prev,
      destinationLocation: location,
      location,
    }));
  };

  const setDateRange = (range: string | null) => {
    setTripData((prev) => ({ ...prev, dateRange: range }));
  };

  const setBudget = (budget: string | null) => {
    setTripData((prev) => ({
      ...prev,
      budget,
      ...(budget !== BUDGET_CUSTOM_ID
        ? { budgetMinVnd: null, budgetMaxVnd: null }
        : {}),
    }));
  };

  const setCustomBudgetRange = (
    minVnd: number | null,
    maxVnd: number | null
  ) => {
    setTripData((prev) => {
      const valid =
        minVnd != null &&
        maxVnd != null &&
        minVnd >= 0 &&
        maxVnd > minVnd &&
        maxVnd <= BUDGET_MANUAL_MAX_PER_PERSON_VND;

      if (valid) {
        return {
          ...prev,
          budget: BUDGET_CUSTOM_ID,
          budgetMinVnd: minVnd,
          budgetMaxVnd: maxVnd,
        };
      }
      if (prev.budget === BUDGET_CUSTOM_ID) {
        return {
          ...prev,
          budget: null,
          budgetMinVnd: null,
          budgetMaxVnd: null,
        };
      }
      return {
        ...prev,
        budgetMinVnd: null,
        budgetMaxVnd: null,
      };
    });
  };

  const setTripTypes = (types: string[]) => {
    setTripData((prev) => ({ ...prev, tripTypes: types }));
  };

  const setPeopleQuantity = (n: number) => {
    const safe = Math.min(50, Math.max(1, Math.round(n)));
    setTripData((prev) => ({ ...prev, peopleQuantity: safe }));
  };

  const adjustPeopleQuantity = (delta: number) => {
    setTripData((prev) => {
      const next = Math.min(
        50,
        Math.max(1, Math.round(prev.peopleQuantity + delta))
      );
      return { ...prev, peopleQuantity: next };
    });
  };

  const setStartDate = (date: string | null) => {
    setTripData((prev) => ({ ...prev, startDate: date }));
  };

  const setEndDate = (date: string | null) => {
    setTripData((prev) => ({ ...prev, endDate: date }));
  };

  const resetTripData = () => {
    setTripData({
      location: null,
      departureLocation: null,
      destinationLocation: null,
      dateRange: null,
      budget: null,
      budgetMinVnd: null,
      budgetMaxVnd: null,
      tripTypes: [],
      peopleQuantity: 2,
      startDate: null,
      endDate: null,
    });
  };

  return (
    <TripSetupContext.Provider
      value={{
        tripData,
        setLocation,
        setDepartureLocation,
        setDestinationLocation,
        setDateRange,
        setBudget,
        setCustomBudgetRange,
        setTripTypes,
        setPeopleQuantity,
        adjustPeopleQuantity,
        setStartDate,
        setEndDate,
        resetTripData,
      }}
    >
      {children}
    </TripSetupContext.Provider>
  );
};

export const useTripSetup = () => {
  const context = useContext(TripSetupContext);
  if (!context) {
    throw new Error("useTripSetup must be used within TripSetupProvider");
  }
  return context;
};
