import React, { createContext, ReactNode, useContext, useState } from "react";

interface TempLocationContextType {
  pendingLocationIds: Record<string, string[]> | null;
  setPendingLocationIds: (dayKey: string, locationIds: string[]) => void;
  clearPendingLocationIds: () => void;
}

const TempLocationContext = createContext<TempLocationContextType | undefined>(
  undefined
);

export const TempLocationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [pendingLocationIds, setPendingLocationIdsState] = useState<Record<
    string,
    string[]
  > | null>(null);

  const setPendingLocationIds = (dayKey: string, locationIds: string[]) => {
    setPendingLocationIdsState({ [dayKey]: locationIds });
  };

  const clearPendingLocationIds = () => {
    setPendingLocationIdsState(null);
  };

  return (
    <TempLocationContext.Provider
      value={{
        pendingLocationIds,
        setPendingLocationIds,
        clearPendingLocationIds,
      }}
    >
      {children}
    </TempLocationContext.Provider>
  );
};

export const useTempLocation = () => {
  const context = useContext(TempLocationContext);
  if (!context) {
    throw new Error("useTempLocation must be used within TempLocationProvider");
  }
  return context;
};
