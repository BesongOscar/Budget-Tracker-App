import { View, Text, StyleSheet } from "react-native";
import { formatCurrency } from "@/src/utils/formatCurrency";
import type { BudgetSummary } from "@/src/types/budget";

export default function AllocationSummaryCard({
  summary,
}: {
  summary: BudgetSummary;
}) {
  const { income, allocated, remainingToAllocate, isOverAllocated } = summary;
  const usedPct = income > 0 ? Math.min(100, (allocated / income) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>Income</Text>
        <Text style={styles.value}>{formatCurrency(income)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Allocated</Text>
        <Text style={styles.value}>{formatCurrency(allocated)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Remaining to allocate</Text>
        <Text
          style={[
            styles.value,
            { color: isOverAllocated ? "#FF3B30" : "#34C759" },
          ]}
        >
          {isOverAllocated
            ? formatCurrency(-remainingToAllocate)
            : formatCurrency(remainingToAllocate)}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${usedPct}%`,
              backgroundColor: isOverAllocated ? "#FF3B30" : "#007AFF",
            },
          ]}
        />
      </View>
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
    marginTop: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  label: { fontSize: 14, color: "#8E8E93" },
  value: { fontSize: 15, fontWeight: "600", color: "#000" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E5EA",
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: { height: 8, borderRadius: 4 },
});
