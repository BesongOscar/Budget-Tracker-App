import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetwork } from "@/src/hooks/useNetwork";
import { Ionicons } from "@expo/vector-icons";

export default function OfflineBanner() {
  const { isOffline } = useNetwork();
  const insets = useSafeAreaInsets();
  if (!isOffline) return null;
  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]}>
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={styles.text}>
        You&apos;re offline — showing saved data. Changes are saved and will
        sync when you&apos;re back online.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  text: { color: "#fff", fontWeight: "600", fontSize: 12, flex: 1 },
});
