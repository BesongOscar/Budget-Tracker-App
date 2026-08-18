import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function OverAllocationBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="warning" size={18} color="#FF9500" />
      <Text style={styles.text}>
        Your allocated amount exceeds your income for this period.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF7E6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD591",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
  text: { flex: 1, fontSize: 13, color: "#8A5A00" },
});
