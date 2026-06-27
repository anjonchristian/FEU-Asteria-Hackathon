import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, FontSize, Radius, Spacing } from "../../../constants/theme";
import { useMultiplayerStore } from "../../../services/studyJam/multiplayer";

export default function HostScreen() {
  const router = useRouter();
  const [name, setName] = useState("");

  const { hostRoom, hostIp, players, status, startGame, leaveRoom, error } =
    useMultiplayerStore();

  useEffect(() => {
    if (status === "playing") {
      router.push("/study-session");
    }
  }, [status, router]);

  const handleHost = async () => {
    if (name.trim()) {
      await hostRoom(name.trim());
    }
  };

  if (hostIp) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.screenTitle}>Your Study Jam Room</Text>

          <Text style={styles.description}>
            Players should connect to your Wi-Fi or hotspot, then enter this IP.
          </Text>

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>HOST IP ADDRESS</Text>

            <Text style={styles.code}>{hostIp}</Text>
          </View>

          <Text style={styles.sectionTitle}>Players ({players.length})</Text>

          <View style={styles.playerList}>
            {players.map((p) => (
              <View key={p.id} style={styles.playerItem}>
                <Ionicons
                  name={p.isHost ? "star" : "person-circle-outline"}
                  size={24}
                  color={p.isHost ? Colors.yellow : Colors.teal}
                />

                <Text style={styles.playerName}>
                  {p.name}
                  {p.isHost && " (Host)"}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Pressable
              style={[
                styles.primaryButton,
                players.length < 2 && styles.buttonDisabled,
              ]}
              disabled={players.length < 2}
              onPress={startGame}
            >
              <Text style={styles.primaryButtonText}>Start Jam</Text>

              <Ionicons name="play" size={20} color="#fff" />
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={leaveRoom}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Host Local Jam</Text>

        <View style={styles.heroBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="server-outline" size={32} color={Colors.primary} />
          </View>

          <Text style={styles.description}>
            Turn your phone into a local server. Other players connect through
            Wi-Fi or hotspot.
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#C94343" />

            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Your Name</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={Colors.mutedText}
          value={name}
          onChangeText={setName}
        />

        <Pressable
          style={[styles.primaryButton, !name.trim() && styles.buttonDisabled]}
          disabled={!name.trim()}
          onPress={handleHost}
        >
          <Text style={styles.primaryButtonText}>Start Local Server</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: "900",
    color: Colors.forest,
    marginBottom: Spacing.xl,
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
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: Colors.forest,
    flex: 1,
    textAlign: "center",
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
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  heroBox: {
    alignItems: "center",
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(40,148,127,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.mutedText,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    color: Colors.mutedText,
    marginBottom: Spacing.xs,
  },
  instructionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(40,148,127,0.08)",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  instructionText: {
    color: Colors.forest,
    fontSize: FontSize.xs + 1,
    marginBottom: 4,
    fontWeight: "700",
  },
  input: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    fontSize: FontSize.md,
    color: Colors.forest,
    fontWeight: "700",
  },
  codeCard: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  codeLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: FontSize.xs,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  code: {
    color: "#fff",
    fontSize: FontSize.xxxl,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 8,
  },
  playerList: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
    gap: Spacing.sm,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  playerName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.forest,
  },
  footer: {
    marginTop: "auto",
    gap: Spacing.sm,
    paddingTop: Spacing.xl,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.mutedText,
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: Radius.full,
    backgroundColor: "rgba(201,67,67,0.1)",
  },
  secondaryButtonText: {
    color: "#C94343",
    fontSize: FontSize.sm,
    fontWeight: "900",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorText: {
    color: "#C94343",
    fontWeight: "700",
    fontSize: FontSize.sm,
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
