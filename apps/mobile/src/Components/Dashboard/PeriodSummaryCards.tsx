import { View, Text, StyleSheet } from "react-native";
import { formatCurrency } from "@/src/utils/formatCurrency";

interface Props {
  income: number;
  allocated: number;
  spent: number;
}

export default function PeriodSummaryCards({
  income,
  allocated,
  spent,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.card, { backgroundColor: "#a0e3b1" }]}>
        <Text style={[styles.label, { color: "green" }]}>Income</Text>
        <Text style={styles.value}>{formatCurrency(income)}</Text>
      </View>
      {/* <View style={styles.card}>
        <Text style={styles.label}>Allocated</Text>
        <Text style={styles.value}>{formatCurrency(allocated)}</Text>
      </View> */}
      <View style={[styles.card, { backgroundColor: "#e4a9a6" }]}>
        <Text style={[styles.label, { color: "red" }]}>Expenses</Text>
        <Text style={styles.value}>{formatCurrency(spent)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginTop: 5,
  },
});
