import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { router, Tabs, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, FontSize, Radius } from "../../constants/theme";

// Custom tab bar with elevated OCR button in the center
function KahayagTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const tabs = [
    { name: "index", icon: "home-outline", activeIcon: "home", label: "Home" },
    {
      name: "progress",
      icon: "trending-up-outline",
      activeIcon: "trending-up",
      label: "Progress",
    },
    {
      name: "ocr",
      icon: "scan-outline",
      activeIcon: "scan",
      label: "Scan",
      isCenter: true,
    },
    {
      name: "studyJam",
      icon: "trophy",
      activeIcon: "trophy-outline",
      label: "Study Jam",
      href: "/study-jam",
    },
    {
      name: "profile",
      icon: "person-outline",
      activeIcon: "person",
      label: "Profile",
    },
  ];

  return (
    <View
      style={[
        styles.bar,
        {
          // Keep the tab bar above Android system navigation/home area.
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {tabs.map((tab, i) => {
        const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
        const isStudyJam = tab.name === "studyJam";
        const isFocused = isStudyJam
          ? pathname.startsWith("/study-jam")
          : state.index === routeIndex;

        const onPress = () => {
          if (isStudyJam) {
            router.push("/study-jam" as any);
            return;
          }

          const event = navigation.emit({
            type: "tabPress",
            target: state.routes[routeIndex]?.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };

        if (tab.isCenter) {
          return (
            <View key={tab.name} style={styles.centerWrap}>
              <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                  styles.centerBtn,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.teal]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.centerGradient}
                >
                  <Ionicons
                    name={
                      isFocused ? (tab.activeIcon as any) : (tab.icon as any)
                    }
                    size={28}
                    color="#fff"
                  />
                </LinearGradient>
              </Pressable>
              <Text
                style={[
                  styles.tabLabel,
                  isFocused && styles.tabLabelActive,
                  { marginTop: 6 },
                ]}
              >
                {tab.label}
              </Text>
            </View>
          );
        }

        return (
          <Pressable key={tab.name} onPress={onPress} style={styles.tabItem}>
            <Ionicons
              name={isFocused ? (tab.activeIcon as any) : (tab.icon as any)}
              size={22}
              color={isFocused ? Colors.primary : Colors.mutedText}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props: any) => <KahayagTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="ocr" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 3,
  },
  tabLabel: {
    fontSize: FontSize.xs - 1,
    fontWeight: "700",
    color: Colors.mutedText,
  },
  tabLabelActive: { color: Colors.primary },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  centerBtn: {
    marginTop: -36,
    borderRadius: Radius.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  centerGradient: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
