/**
 * ItineraryRouteMap
 *
 * Hiển thị Google Map với nhiều marker từ danh sách địa điểm và vẽ tuyến đường
 * (directions) giữa các điểm bằng react-native-maps-directions.
 *
 * Requires:
 *   - react-native-maps        ✅ installed
 *   - react-native-maps-directions  ✅ installed
 */

import { getGoogleMapsApiKey, shouldUseNativeGoogleMapView } from "@/config/env";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ItineraryMapLocation = {
  /** Unique id for the marker key */
  id: string;
  latitude: number;
  longitude: number;
  /** Label shown in the callout when the marker is tapped */
  title: string;
};

type Props = {
  locations: ItineraryMapLocation[];
  /** Height of the map container (default 260) */
  height?: number;
  /** Travel mode for the Directions API (default "DRIVING") */
  mode?: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MARKER_FIRST = "#2BB673"; // green  – departure
const MARKER_LAST  = "#EF4444"; // red    – final destination
const MARKER_MID   = "#F59E0B"; // amber  – stopover
const ROUTE_COLOR  = "#2BB673";

const EDGE_PADDING = { top: 60, right: 60, bottom: 60, left: 60 };

/** Default region: Hồ Chí Minh City */
const HCM_REGION = {
  latitude: 10.7769,
  longitude: 106.7009,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ItineraryRouteMap: React.FC<Props> = ({
  locations,
  height = 260,
  mode = "DRIVING",
}) => {
  const mapRef = useRef<MapView>(null);
  const apiKey = getGoogleMapsApiKey();

  /**
   * Only render the native MapView when:
   *  - An API key is configured
   *  - Not running on web
   *  - EXPO_PUBLIC_USE_NATIVE_MAPVIEW is not "false"
   */
  const useNative =
    apiKey.length > 0 &&
    Platform.OS !== "web" &&
    shouldUseNativeGoogleMapView(Platform.OS);

  // tracksViewChanges controls whether React Native re-renders the marker
  // bitmap whenever the component re-renders.
  //
  // React Native Maps trên Android có bug khi dùng custom View cho Marker:
  // Nếu set tracksViewChanges={false} quá sớm (khi view chưa kịp layout xong), markers sẽ vô hình.
  // Giải pháp an toàn nhất là giữ tracksViewChanges={true} luôn bật,
  // do số lượng marker (điểm đến trong ngày) thường ít (< 10), impact performance không đáng kể.
  const tracksViewChanges = true;

  // Compute the initial region from the centre of all locations.
  const initialRegion = useMemo(() => {
    if (!locations.length) return HCM_REGION;
    const avgLat = locations.reduce((s, l) => s + l.latitude, 0) / locations.length;
    const avgLng = locations.reduce((s, l) => s + l.longitude, 0) / locations.length;
    return {
      latitude: avgLat,
      longitude: avgLng,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }, [locations]);

  // fitToCoordinates once after the map has rendered.
  useEffect(() => {
    if (!useNative || locations.length < 2 || !mapRef.current) return;
    const coords = locations.map((l) => ({
      latitude: l.latitude,
      longitude: l.longitude,
    }));
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: EDGE_PADDING,
        animated: true,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [locations, useNative]);

  // Directions route: first → (optional waypoints) → last
  const origin      = locations[0];
  const destination = locations[locations.length - 1];
  const waypoints   = locations.slice(1, -1).map((l) => ({
    latitude: l.latitude,
    longitude: l.longitude,
  }));
  const canDrawRoute = useNative && locations.length >= 2 && apiKey.length > 0;

  // -------------------------------------------------------------------------
  // Fallback when native map is unavailable
  // -------------------------------------------------------------------------
  if (!useNative) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Ionicons name="map-outline" size={40} color="#9CA3AF" />
        <Text style={styles.fallbackText}>
          {apiKey.length === 0
            ? "Chưa cấu hình Google Maps API Key"
            : "Bản đồ chỉ khả dụng trên iOS/Android"}
        </Text>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Native Google Map
  //
  // IMPORTANT — overflow:"hidden" with borderRadius on the OUTER View breaks
  // Google Maps tile loading on Android (white/blank tiles).
  // Use a clipping wrapper instead so the MapView itself remains full-size.
  // -------------------------------------------------------------------------
  return (
    // Outer clip: handles border-radius + shadow without overflowing map tiles.
    <View style={[styles.clipOuter, { height }]}>
      {/* Inner container fills the clip region completely */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          mapType="standard"
          initialRegion={initialRegion}
          rotateEnabled={false}
          pitchEnabled={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          moveOnMarkerPress={false}
        >
          {/* ---- Markers ---- */}
          {locations.map((loc, idx) => {
            const isFirst = idx === 0;
            const isLast  = idx === locations.length - 1;
            const color   = isFirst ? MARKER_FIRST : isLast ? MARKER_LAST : MARKER_MID;

            return (
              <Marker
                key={`pin-${loc.id}`}
                identifier={`pin-${loc.id}`}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                title={loc.title}
                anchor={{ x: 0.5, y: 1 }}
                /**
                 * tracksViewChanges must be `true` while the custom view
                 * hasn't been drawn yet, then `false` for performance.
                 */
                tracksViewChanges={tracksViewChanges}
              >
                {/* Custom marker view */}
                <View style={styles.markerOuter}>
                  <Ionicons name="location-sharp" size={36} color={color} />
                  {/* Sequential number badge */}
                  <View style={[styles.badge, { backgroundColor: color }]}>
                    <Text style={styles.badgeText}>{idx + 1}</Text>
                  </View>
                </View>
              </Marker>
            );
          })}

          {/* ---- Route polyline via Directions API ---- */}
          {canDrawRoute && origin && destination && (
            <MapViewDirections
              origin={{ latitude: origin.latitude, longitude: origin.longitude }}
              destination={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              waypoints={waypoints}
              apikey={apiKey}
              mode={mode}
              precision="high"
              strokeWidth={5}
              strokeColor={ROUTE_COLOR}
              lineCap="round"
              lineJoin="round"
              optimizeWaypoints={false}
              resetOnChange={false}
              onReady={(result) => {
                // After route is ready, re-fit to include the full polyline.
                mapRef.current?.fitToCoordinates(result.coordinates, {
                  edgePadding: EDGE_PADDING,
                  animated: true,
                });
              }}
              onError={(err) => {
                console.warn("[ItineraryRouteMap] Directions error:", err);
              }}
            />
          )}
        </MapView>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  /** Clips children to borderRadius. Do NOT set overflow:"hidden" on the
   *  MapView container on Android — it causes blank tiles. */
  clipOuter: {
    width: "100%",
    borderRadius: 16,
    // overflow:hidden is intentional here on the OUTER clip only.
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  /** Fills the clip region. Matches height via flex. */
  mapContainer: {
    flex: 1,
  },
  /** Shown when native map is unavailable. */
  fallback: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  /** Wrapper for the custom pin icon + badge. */
  markerOuter: {
    alignItems: "center",
    justifyContent: "center",
    // Explicit size prevents the native bridge from collapsing the view to 0.
    width: 42,
    height: 44,
  },
  badge: {
    position: "absolute",
    top: 2,
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 11,
  },
});

export default ItineraryRouteMap;
