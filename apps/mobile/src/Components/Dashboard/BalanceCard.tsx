import { View, Text, StyleSheet } from "react-native";
import { formatCurrency } from "@/src/utils/formatCurrency";

export default function BalanceCard({ balance }: { balance: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Total Balance</Text>
      <Text
        style={[styles.amount, { color: balance >= 0 ? "#FFF" : "#FF3B30" }]}
      >
        {formatCurrency(balance)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#007AFF",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#FFF",
  },
  amount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
  },
});
