import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="language" />
      <Stack.Screen name="name" />
      <Stack.Screen name="grade" />
      <Stack.Screen name="subjects" />
    </Stack>
  );
}
