import { View, Text, StyleSheet } from "react-native";
import CTAbutton from "@/src/Components/CTAbutton";

export default function EndOfPeriodPrompt({
  onCopy,
  isCopying,
}: {
  onCopy: () => void;
  isCopying?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Start planning this month</Text>
      <Text style={styles.message}>
        Copy last month's budgets or set new ones for this period.
      </Text>
      <CTAbutton
        title="Copy last month's budgets"
        onPress={onCopy}
        backgroundcolor="#007AFF"
        textColor="#FFFFFF"
        marginVertical={8}
        disabled={isCopying}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  title: { fontSize: 16, fontWeight: "600", color: "#000" },
  message: { fontSize: 13, color: "#8E8E93", marginTop: 4 },
});
