import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { SUBJECTS } from "../../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import { useProfile } from "../../store/profile";

export default function SubjectsScreen() {
  const { subjects, toggleSubject } = useProfile();
  const [allSelected, setAllSelected] = useState(false);

  const handleToggle = (id: string) => {
    Haptics.selectionAsync();
    toggleSubject(id);
  };
  const handleSelectAll = () => {
    Haptics.selectionAsync();

    if (allSelected) {
      // Unselect all — call toggleSubject for each currently selected subject
      SUBJECTS.forEach((subject) => {
        // Only toggle if it's currently selected (to avoid double-toggling)
        if (subjects.includes(subject.id)) {
          toggleSubject(subject.id);
        }
      });
      setAllSelected(false);
    } else {
      // Select all — call toggleSubject for each unselected subject
      SUBJECTS.forEach((subject) => {
        if (!subjects.includes(subject.id)) {
          toggleSubject(subject.id);
        }
      });
      setAllSelected(true);
    }
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
          style={{ marginBottom: Spacing.md }}
        >
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.heading}>Select your</Text>
          <Text style={[styles.heading, { color: Colors.primary }]}>
            subjects!
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={styles.sub}>Pick as many as you like!</Text>
            <TouchableOpacity onPress={handleSelectAll}>
              {!allSelected ? (
                <MaterialCommunityIcons
                  name="select-all"
                  size={30}
                  color="gray"
                />
              ) : (
                <MaterialIcons name="deselect" size={30} color="gray" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        <FlatList
          data={[...SUBJECTS]}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const active = subjects.includes(item.id);
            return (
              <Animated.View
                entering={FadeInDown.delay(index * 60).springify()}
                style={styles.cardWrap}
              >
                <Pressable
                  onPress={() => handleToggle(item.id)}
                  style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: active ? item.bg : "#F2F5EE" },
                    active && styles.cardActive,
                    pressed && styles.cardPressed,
                  ]}
                >
                  {active && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={11} color="#fff" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: active ? item.color : "#DDECD4" },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={active ? "#fff" : "#7AAB72"}
                    />
                  </View>
                  <Text style={styles.label}>{item.label}</Text>
                </Pressable>
              </Animated.View>
            );
          }}
        />

        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Pressable
            onPress={() => subjects.length > 0 && router.replace("/assessment")}
            disabled={subjects.length === 0}
            style={({ pressed }) => [
              styles.btn,
              subjects.length === 0 && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.btnText}>Start Assessment</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
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
  sub: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.mutedText,
    marginTop: 6,
  },
  list: { paddingVertical: Spacing.md },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  cardWrap: { flex: 1 },
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: "transparent",
    gap: Spacing.sm,
    position: "relative",
  },
  cardActive: { borderColor: Colors.primary },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
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
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: FontSize.sm, fontWeight: "800", color: Colors.forest },
  btn: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.4 },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  btnText: { color: "#fff", fontSize: FontSize.lg, fontWeight: "800" },
});
