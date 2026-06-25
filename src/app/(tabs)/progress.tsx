import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, FontSize, Spacing } from "../../constants/theme";

export default function ProgressScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>📈</Text>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.sub}>Charts and streaks coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.sm },
  emoji: { fontSize: 48 },
  title: { fontSize: FontSize.xl, fontWeight: "900", color: Colors.forest },
  sub: { fontSize: FontSize.sm, color: Colors.mutedText, fontWeight: "600" },
});
