// src/app/study-jam/find.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Colors, FontSize, Radius, Spacing } from "../../../constants/theme";
import { useMultiplayerStore } from "../../../services/studyJam/multiplayer";
import { useProfile } from "../../../store/profile";

function PulseRing() {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseRing, animatedStyle]} />
      <View style={styles.pulseCore}>
        <Ionicons name="radio-outline" size={24} color="#fff" />
      </View>
    </View>
  );
}

export default function FindScreen() {
  const { name: profileName } = useProfile();
  const router = useRouter();
  const [name, setName] = useState(profileName || "");
  const [manualIp, setManualIp] = useState("");

  const {
    joinRoom,
    hostIp,
    players,
    status,
    error,
    leaveRoom,
    startDiscovery,
    stopDiscovery,
    discoveredHosts,
    me,
  } = useMultiplayerStore();

  useEffect(() => {
    startDiscovery();
    return () => {
      stopDiscovery();
    };
  }, []);

  useEffect(() => {
    if (status === "playing" || status === "generating") {
      router.push("/study-jam-battle");
    }
  }, [status, router]);

  const handleJoinDiscovered = (ip: string) => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter your name first");
      return;
    }
    joinRoom(ip, name.trim());
  };

  const handleManualJoin = () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter your name first");
      return;
    }
    if (manualIp.trim()) {
      joinRoom(manualIp.trim(), name.trim());
    }
  };

  if (status === "connecting") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.centerText}>Connecting to room...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hostIp) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Connected!</Text>
        </View>
        <View style={styles.container}>
          <View style={styles.waitingCard}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.waitingText}>Waiting for host to start...</Text>
          </View>

          <Text style={styles.sectionTitle}>Players ({players.length})</Text>
          <View style={styles.playerList}>
            {players.map((p) => (
              <View key={p.id} style={styles.playerItem}>
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color={Colors.teal}
                />
                <Text style={styles.playerName}>
                  {p.name}
                  {p.id === me?.id ? " (You)" : ""}
                  {p.isHost ? " (Host)" : ""}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
            onPress={leaveRoom}
          >
            <Text style={styles.secondaryButtonText}>Leave Room</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Find a Jam</Text>

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

        <Text style={styles.sectionTitle}>Nearby Jams</Text>
        {discoveredHosts.length === 0 ? (
          <View style={styles.scanningBox}>
            <PulseRing />
            <Text style={styles.scanningText}>
              Naghahanap ng malapit na Study Jam...
            </Text>
          </View>
        ) : (
          <FlatList
            data={discoveredHosts}
            keyExtractor={(item) => item.ip}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.hostCard,
                  pressed && styles.pressed,
                ]}
                onPress={() => handleJoinDiscovered(item.ip)}
              >
                <View style={styles.hostInfo}>
                  <Text style={styles.hostName}>{item.name}'s Jam</Text>
                  {item.settings ? (
                    <Text style={styles.hostIp}>
                      {item.settings.questionsCount} questions
                    </Text>
                  ) : (
                    <Text style={styles.hostIp}>{item.ip}</Text>
                  )}
                </View>
                <View style={styles.joinBadge}>
                  <Text style={styles.joinText}>Join</Text>
                </View>
              </Pressable>
            )}
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Text style={styles.sectionTitle}>Manual IP Connection</Text>
        <View style={styles.manualJoinRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="192.168.1.5"
            placeholderTextColor={Colors.mutedText}
            value={manualIp}
            onChangeText={setManualIp}
            keyboardType="numbers-and-punctuation"
          />
          <Pressable
            style={({ pressed }) => [
              styles.joinButton,
              pressed && styles.pressed,
            ]}
            onPress={handleManualJoin}
          >
            <Text style={styles.joinButtonText}>Join</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.forest,
    marginBottom: Spacing.lg,
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  centerText: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.mutedText,
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
  input: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.forest,
    fontWeight: "700",
  },
  scanningBox: {
    padding: Spacing.lg,
    alignItems: "center",
    backgroundColor: "rgba(40,148,127,0.08)",
    borderRadius: Radius.xl,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  scanningText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  hostCard: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  hostInfo: { flex: 1 },
  hostName: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
  },
  hostIp: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.mutedText,
    marginTop: 2,
  },
  joinBadge: {
    backgroundColor: "rgba(40,148,127,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  joinText: {
    color: Colors.primary,
    fontWeight: "900",
    fontSize: FontSize.sm,
  },
  manualJoinRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  joinButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: FontSize.md,
  },
  waitingCard: {
    backgroundColor: "rgba(40,148,127,0.1)",
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  waitingText: {
    color: Colors.primary,
    fontWeight: "800",
    fontSize: FontSize.sm,
  },
  playerList: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
  secondaryButton: {
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.lg,
    borderRadius: Radius.full,
    backgroundColor: "rgba(201,67,67,0.1)",
  },
  secondaryButtonText: {
    color: "#C94343",
    fontWeight: "900",
    fontSize: FontSize.sm,
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
  pulseContainer: {
    position: "relative",
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
  },
  pulseCore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
