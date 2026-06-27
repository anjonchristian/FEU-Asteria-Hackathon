import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SUBJECTS } from "../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../constants/theme";
import { useVaultStore } from "../store/vault";

export default function StudyVaultScreen() {
  const { decks, deleteDeck } = useVaultStore();

  const getSubjectDetails = (subjectId: string) => {
    return SUBJECTS.find((s) => s.id === subjectId) || SUBJECTS[0];
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Study Vault</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Your Generated Decks</Text>
        <Text style={styles.pageSub}>
          Quizzes created from your scanned lessons.
        </Text>

        {decks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="albums-outline"
              size={48}
              color={Colors.mutedText}
            />
            <Text style={styles.emptyTitle}>The vault is empty</Text>
            <Text style={styles.emptySub}>
              Scan a textbook page and ask the AI to generate a quiz to see it
              here.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {decks.map((deck) => {
              const subject = getSubjectDetails(deck.subjectId);
              return (
                <Pressable
                  key={deck.id}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    // Navigate to the quiz player (to be built)
                    console.log("Play deck:", deck.id);
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[styles.iconBox, { backgroundColor: subject.bg }]}
                    >
                      <Ionicons
                        name={subject.icon as any}
                        size={18}
                        color={subject.color}
                      />
                    </View>
                    <Pressable
                      onPress={() => deleteDeck(deck.id)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#C94343"
                      />
                    </Pressable>
                  </View>

                  <Text style={styles.deckTitle} numberOfLines={2}>
                    {deck.title}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.cardMeta}>
                      {deck.cards.length} Cards
                    </Text>
                    {deck.lastScore !== undefined && (
                      <Text style={styles.scoreMeta}>
                        Score: {deck.lastScore}/{deck.cards.length}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
  },
  backBtnText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "700",
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.forest,
  },
  pageSub: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.mutedText,
    marginBottom: Spacing.lg,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.mutedText,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  card: {
    width: "48%",
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    justifyContent: "space-between",
    minHeight: 130,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    padding: 4,
  },
  deckTitle: {
    fontSize: FontSize.sm,
    fontWeight: "900",
    color: Colors.forest,
    lineHeight: 18,
    flex: 1,
  },
  cardFooter: {
    marginTop: Spacing.sm,
    gap: 2,
  },
  cardMeta: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.mutedText,
  },
  scoreMeta: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    color: Colors.primary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
