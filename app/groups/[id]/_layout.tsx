import { Stack } from "expo-router";

export default function GroupDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="info" options={{ headerShown: false }} />
      <Stack.Screen name="members" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
      <Stack.Screen name="itineraries" options={{ headerShown: false }} />
      <Stack.Screen name="suggestions" options={{ headerShown: false }} />
    </Stack>
  );
}
