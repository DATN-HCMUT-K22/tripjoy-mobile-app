import { Stack } from "expo-router";

export default function CreateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add-location" />
      <Stack.Screen name="adjust-itinerary" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="edit-itinerary" />
      <Stack.Screen name="manual" />
      <Stack.Screen name="select-group" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="time" />
    </Stack>
  );
}
