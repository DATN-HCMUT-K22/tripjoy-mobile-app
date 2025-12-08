import { Location } from "@/types/trip";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface TripSetupData {
  location: Location | null;
  dateRange: string | null;
  budget: string | null;
  tripTypes: string[];
  startDate: string | null;
  endDate: string | null;
}

interface TripSetupContextType {
  tripData: TripSetupData;
  setLocation: (location: Location | null) => void;
  setDateRange: (range: string | null) => void;
  setBudget: (budget: string | null) => void;
  setTripTypes: (types: string[]) => void;
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
    dateRange: null,
    budget: null,
    tripTypes: [],
    startDate: null,
    endDate: null,
  });

  const setLocation = (location: Location | null) => {
    setTripData((prev) => ({ ...prev, location }));
  };

  const setDateRange = (range: string | null) => {
    setTripData((prev) => ({ ...prev, dateRange: range }));
  };

  const setBudget = (budget: string | null) => {
    setTripData((prev) => ({ ...prev, budget }));
  };

  const setTripTypes = (types: string[]) => {
    setTripData((prev) => ({ ...prev, tripTypes: types }));
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
      dateRange: null,
      budget: null,
      tripTypes: [],
      startDate: null,
      endDate: null,
    });
  };

  return (
    <TripSetupContext.Provider
      value={{
        tripData,
        setLocation,
        setDateRange,
        setBudget,
        setTripTypes,
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
