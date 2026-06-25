import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { LANGUAGES } from "../../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import { useProfile } from "../../store/profile";

export default function LanguageScreen() {
  const { language, setLanguage } = useProfile();

  const handleSelect = (code: string) => {
    setLanguage(code);
    router.replace("/(onboarding)/name");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={styles.emoji}>🌍</Text>
          <Text style={styles.heading}>Choose your</Text>
          <Text style={[styles.heading, { color: Colors.primary }]}>
            language
          </Text>
        </Animated.View>

        <FlatList
          data={LANGUAGES}
          keyExtractor={(item) => item.code}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const active = language === item.code;
            return (
              <Animated.View
                entering={FadeInDown.delay(index * 60).springify()}
                style={styles.cardWrap}
              >
                <Pressable
                  onPress={() => handleSelect(item.code)}
                  style={({ pressed }) => [
                    styles.card,
                    active && styles.cardActive,
                    pressed && styles.cardPressed,
                  ]}
                >
                  {active && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.langLabel,
                      active && { color: Colors.primary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  emoji: { fontSize: 40, marginBottom: Spacing.sm },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.forest,
    lineHeight: 36,
  },
  list: { paddingVertical: Spacing.lg },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  cardWrap: { flex: 1 },
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    gap: Spacing.xs,
    position: "relative",
  },
  cardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#E5F5EE",
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  flag: { fontSize: 32 },
  langLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.forest,
  },
});
