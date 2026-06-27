import { Stack } from "expo-router";
import { StyleSheet } from "react-native";

/**
 * Route group wrapper for the mock Study Jam stack.
 */
export default function StudyJamLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="host" />
      <Stack.Screen name="find" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAF7" },
});
