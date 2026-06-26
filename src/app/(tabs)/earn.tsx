import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  FlatList,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BLEAdvertiser from "react-native-ble-advertiser";
import { BleManager, Device } from "react-native-ble-plx";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import { useProfile } from "../../store/profile";

const bleManager = new BleManager();

// A completely unique 128-bit UUID for Kahayag Duels
const DUEL_SERVICE_UUID = "4a616861-7961-6744-7565-6c73526f6f6d";

type DuelMode = "idle" | "hosting" | "scanning" | "connected";

export default function EarnScreen() {
  const { name } = useProfile();
  const [mode, setMode] = useState<DuelMode>("idle");
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if (Platform.Version >= 31) {
        // 1. Check if they are already manually granted first
        const hasScan = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        );
        const hasConnect = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        );
        const hasAdvertise = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        );
        const hasLocation = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (hasScan && hasConnect && hasAdvertise && hasLocation) {
          return true;
        }

        // 2. Request any that are missing
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        // Accept either explicitly GRANTED right now, OR already manually authorized in App Info
        const allGranted =
          (result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
            PermissionsAndroid.RESULTS.GRANTED ||
            hasScan) &&
          (result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
            PermissionsAndroid.RESULTS.GRANTED ||
            hasConnect) &&
          (result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE] ===
            PermissionsAndroid.RESULTS.GRANTED ||
            hasAdvertise) &&
          (result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED ||
            hasLocation);

        if (!allGranted) {
          console.warn("🚨 Permission denied details:", result);
        }
        return allGranted;
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  };

  // --- HOSTING (BROADCASTING) ---
  const startHosting = async () => {
    const granted = await requestPermissions();
    if (!granted) return console.warn("Permissions denied");

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMode("hosting");

    try {
      // Set the company ID (0x00E0 is Google, or use 0xFFFF for development/testing)
      BLEAdvertiser.setCompanyId(0xffff);

      // Start broadcasting the unique Service UUID
      console.log("📡 Starting BLE Advertisement...");
      await BLEAdvertiser.broadcast(DUEL_SERVICE_UUID, [1, 2, 3, 4], {});
      console.log(`✅ Now broadcasting duel lobby room over BLE!`);
    } catch (error) {
      console.error("Failed to start broadcasting:", error);
      setMode("idle");
    }
  };

  const stopHosting = async () => {
    try {
      await BLEAdvertiser.stopBroadcast();
      setMode("idle");
      console.log("⏹️ Stopped broadcasting");
    } catch (error) {
      console.error("Failed to stop broadcasting:", error);
    }
  };

  // --- SCANNING (JOINING) ---
  const startScan = async () => {
    const granted = await requestPermissions();
    if (!granted) return console.warn("Permissions denied");

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMode("scanning");
    setDevices([]);

    console.log("🔍 Scanning for nearby duel rooms...");

    // We target the exact Service UUID being advertised by the host
    bleManager.startDeviceScan([DUEL_SERVICE_UUID], null, (error, device) => {
      if (error) {
        console.error("BLE Scan Error:", error);
        return;
      }
      if (device) {
        setDevices((prev) => {
          if (!prev.find((d) => d.id === device.id)) return [...prev, device];
          return prev;
        });
      }
    });

    setTimeout(() => {
      if (mode === "scanning") {
        bleManager.stopDeviceScan();
        setMode("idle");
        console.log("⏹️ Stopped scanning");
      }
    }, 15000);
  };

  const connectToDevice = async (device: Device) => {
    try {
      Haptics.selectionAsync();
      bleManager.stopDeviceScan();

      console.log(`🔗 Initiating handshake with game host...`);
      const connected = await bleManager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();

      setConnectedDevice(connected);
      setMode("connected");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log("⚔️ Connection stable. Ready to Duel!");
    } catch (error) {
      console.error("Handshake connection failed:", error);
      setMode("idle");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const disconnect = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
    }
    setMode("idle");
  };

  useEffect(() => {
    return () => {
      bleManager.stopDeviceScan();
      BLEAdvertiser.stopBroadcast().catch(() => {});
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <Text style={styles.emoji}>⚔️</Text>
          <Text style={styles.title}>Head-to-Head Duel</Text>
          <Text style={styles.sub}>
            Host a room or find a nearby classmate over Bluetooth to start a
            match!
          </Text>
        </Animated.View>

        {mode === "connected" && connectedDevice ? (
          <Animated.View entering={FadeIn} style={styles.stateCard}>
            <Ionicons name="flash" size={64} color={Colors.yellow} />
            <Text style={styles.stateTitle}>Duel Active!</Text>
            <Text style={styles.stateSub}>
              Connected to peer challenger via secure BLE channel
            </Text>
            <Pressable style={styles.dangerBtn} onPress={disconnect}>
              <Text style={styles.dangerBtnText}>End Duel</Text>
            </Pressable>
          </Animated.View>
        ) : mode === "hosting" ? (
          <Animated.View entering={FadeIn} style={styles.stateCard}>
            <Ionicons name="radio-outline" size={64} color={Colors.primary} />
            <Text style={styles.stateTitle}>Broadcasting Lobby</Text>
            <Text style={styles.stateSub}>
              Your phone is acting as a BLE transmitter. Tell your opponent to
              click "Find a Challenger".
            </Text>
            <Pressable style={styles.dangerBtn} onPress={stopHosting}>
              <Text style={styles.dangerBtnText}>Close Lobby</Text>
            </Pressable>
          </Animated.View>
        ) : mode === "scanning" ? (
          <Animated.View entering={FadeIn} style={{ flex: 1 }}>
            <View style={styles.scanningHeader}>
              <Text style={styles.scanningText}>
                Listening for nearby duel streams...
              </Text>
              <Pressable
                onPress={() => {
                  bleManager.stopDeviceScan();
                  setMode("idle");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
            <FlatList
              data={devices}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.deviceCard}
                  onPress={() => connectToDevice(item)}
                >
                  <View style={styles.deviceInfo}>
                    <View style={styles.avatarBox}>
                      <Ionicons
                        name="flash-outline"
                        size={24}
                        color={Colors.teal}
                      />
                    </View>
                    <View>
                      <Text style={styles.deviceName}>Kahayag Duel Room</Text>
                      <Text style={styles.deviceId}>
                        ID: {item.id.slice(0, 8).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={Colors.primary}
                  />
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Scanning for active BLE beacons...
                </Text>
              }
            />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.idleButtons}
          >
            <Pressable
              style={({ pressed }) => [
                styles.mainBtn,
                pressed && { opacity: 0.8 },
              ]}
              onPress={startHosting}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.btnText}>Host a Duel</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.altBtn,
                pressed && { opacity: 0.8 },
              ]}
              onPress={startScan}
            >
              <Ionicons name="search" size={24} color={Colors.primary} />
              <Text style={styles.altBtnText}>Find a Challenger</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  header: { marginBottom: Spacing.xl },
  emoji: { fontSize: 48, marginBottom: Spacing.sm },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.forest,
    marginBottom: 8,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.mutedText,
    fontWeight: "600",
    lineHeight: 20,
  },

  idleButtons: { gap: Spacing.md },
  mainBtn: { borderRadius: Radius.lg, overflow: "hidden" },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  btnText: { color: "#fff", fontSize: FontSize.lg, fontWeight: "800" },

  altBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: "#E5F5EE",
  },
  altBtnText: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: "800",
  },

  stateCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  stateTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.forest,
  },
  stateSub: {
    fontSize: FontSize.md,
    color: Colors.mutedText,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  dangerBtn: {
    marginTop: Spacing.lg,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  dangerBtnText: { color: "#EF4444", fontWeight: "800", fontSize: FontSize.md },

  scanningHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  scanningText: { color: Colors.primary, fontWeight: "700" },
  cancelText: { color: Colors.mutedText, fontWeight: "700" },

  list: { paddingBottom: Spacing.xxl },
  deviceCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceInfo: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(74,167,124,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.forest,
  },
  deviceId: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: Colors.mutedText,
    marginTop: Spacing.xl,
  },
});
