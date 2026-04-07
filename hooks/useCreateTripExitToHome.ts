import { useItinerary } from "@/contexts/ItineraryContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { InteractionManager } from "react-native";

export function useCreateTripExitToHome() {
  const router = useRouter();
  const { resetTripData } = useTripSetup();
  const { resetItinerary } = useItinerary();
  const navigatingRef = useRef(false);

  const exitToHome = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;

    // Group route `(tabs)` không nằm trong URL thực tế, nên điều hướng về Home bằng "/".
    router.push("/");

    InteractionManager.runAfterInteractions(() => {
      resetItinerary();
      resetTripData();
      navigatingRef.current = false;
    });
  }, [resetItinerary, resetTripData, router]);

  return { exitToHome };
}
