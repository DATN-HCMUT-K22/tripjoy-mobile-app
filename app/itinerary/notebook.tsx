import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SharedHeader } from "@/components/common/SharedHeader";
import { TravelNotebookScreen } from "@/components/notebook/TravelNotebookScreen";
import { useItineraryDetail } from "@/hooks/useItineraries";

/**
 * Travel Notebook route for an itinerary
 * Route: /itinerary/notebook?id={itineraryId}
 */
export default function ItineraryNotebookRoute() {
  const router = useRouter();
  const { id: itineraryId } = useLocalSearchParams<{ id: string }>();

  // Fetch itinerary details for name
  const { data: detail } = useItineraryDetail(itineraryId);

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <SharedHeader
        leftElement={
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={28} color="#111827" />
          </TouchableOpacity>
        }
        centerElement={null}
        rightElement={null}
        withMenuDrawer={false}
        showBorderBottom={false}
      />

      {/* Main content */}
      <TravelNotebookScreen
        itineraryId={itineraryId || ""}
        itineraryName={detail?.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
