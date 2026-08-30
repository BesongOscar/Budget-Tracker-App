import { View, Text, StyleSheet } from "react-native";
import { formatCurrency } from "@/src/utils/formatCurrency";
import { formatTransactionDate } from "@/src/utils/formatDate";

interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  type: string;
  category?: {
    icon: string;
    name: string;
  };
}

export default function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (transactions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <View style={styles.card}>
        {transactions.map((tx, idx) => {
          const isIncome = tx.type === "INCOME";
          return (
            <View
              key={tx.id}
              style={[
                styles.row,
                idx < transactions.length - 1 && styles.rowBorder,
              ]}
            >
              <View style={styles.iconCircle}>
                <Text style={styles.icon}>{tx.category?.icon ?? "📦"}</Text>
              </View>
              <View style={styles.details}>
                <Text style={styles.name} numberOfLines={1}>
                  {tx.description ?? tx.category?.name ?? "Transaction"}
                </Text>
                <Text style={styles.date}>
                  {formatTransactionDate(tx.date)}
                </Text>
              </View>
              <Text
                style={[
                  styles.amount,
                  { color: isIncome ? "#34C759" : "#FF3B30" },
                ]}
              >
                {isIncome ? "+" : "-"}
                {formatCurrency(tx.amount)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 18 },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  date: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: "600",
  },
});
