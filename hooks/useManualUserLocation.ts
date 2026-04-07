import * as Location from "expo-location";
import { useCallback, useState } from "react";

export function useManualUserLocation() {
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestAndFetch = useCallback(async () => {
    setLoading(true);
    try {
      setServiceUnavailable(false);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        setServiceUnavailable(false);
        setCoords(null);
        return;
      }
      setPermissionDenied(false);
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setServiceUnavailable(true);
        setCoords(null);
        return;
      }
      let pos: Location.LocationObject | null = null;
      try {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch {
        // Dịch vụ định vị có thể đang tắt dù đã cấp quyền.
        pos = await Location.getLastKnownPositionAsync();
      }

      if (!pos) {
        setServiceUnavailable(true);
        setCoords(null);
        return;
      }

      setServiceUnavailable(false);
      setCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch {
      setServiceUnavailable(true);
      setCoords(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    coords,
    permissionDenied,
    serviceUnavailable,
    loading,
    requestAndFetch,
  };
}
