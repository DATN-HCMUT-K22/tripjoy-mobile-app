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
    </Stack>
  );
}
