import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { GRADES } from "../../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import { useProfile } from "../../store/profile";

export default function GradeScreen() {
  const { name, grade, setGrade } = useProfile();

  const handleSelect = (g: string) => {
    setGrade(g);
    router.navigate("/(onboarding)/subjects");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={18} color={Colors.mutedText} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Animated.View
          entering={FadeInDown.springify()}
          style={{ marginBottom: Spacing.lg }}
        >
          <Text style={styles.emoji}>🎒</Text>
          <Text style={styles.heading}>Hi {name}!</Text>
          <Text style={[styles.heading, { color: Colors.primary }]}>
            What grade are you?
          </Text>
        </Animated.View>

        <FlatList
          data={[...GRADES]}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const active = grade === item;
            return (
              <Animated.View
                entering={FadeInDown.delay(index * 30).springify()}
                style={styles.itemWrap}
              >
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.item,
                    active && styles.itemActive,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <Text
                    style={[styles.itemText, active && styles.itemTextActive]}
                  >
                    {item}
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
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.lg,
  },
  backText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.mutedText,
  },
  emoji: { fontSize: 40, marginBottom: Spacing.xs },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.forest,
    lineHeight: 36,
  },
  list: { paddingBottom: Spacing.lg },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  itemWrap: { flex: 1 },
  item: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: "center",
  },
  itemActive: {
    borderColor: Colors.primary,
    backgroundColor: "#E5F5EE",
  },
  itemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  itemText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.forest,
  },
  itemTextActive: {
    color: Colors.primary,
  },
});
