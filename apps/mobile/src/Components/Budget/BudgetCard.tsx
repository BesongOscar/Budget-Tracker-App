import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { formatCurrency } from "@/src/utils/formatCurrency";
import type { Budget } from "@/src/types/budget";

export default function BudgetCard({
  budget,
  onPress,
}: {
  budget: Budget;
  onPress: () => void;
}) {
  const allocated = Number(budget.allocatedAmount);
  const spent = Number(budget.spentAmount);
  const over = spent > allocated;
  const pct =
    allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.left}>
          {/* Icon Circle */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: (budget.category?.color || "#8E8E93") + "20" },
            ]}
          >
            <Text style={styles.icon}>{budget.category?.icon || "📦"}</Text>
          </View>
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.subRowOne}>
            {/* Budget Category Name */}
            <Text style={styles.name} numberOfLines={1}>
              {budget.category?.name}
            </Text>
            {/* Budget Amount */}
            <Text style={styles.amounts}>
              <Text
                style={[styles.spent, { color: over ? "#FF3B30" : "#000" }]}
              >
                {formatCurrency(spent)}
              </Text>
              {" / "}
              <Text style={styles.allocated}>{formatCurrency(allocated)}</Text>
            </Text>
          </View>

          <View style={styles.subRowTwo}>
            {/* Progress Tracker */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: over ? "#FF3B30" : "#007AFF",
                  },
                ]}
              />
            </View>
            {/* Budget Percentage */}
            <Text style={[styles.pct, { color: over ? "#FF3B30" : "#8E8E93" }]}>
              {pct}%
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 15,
  },
  left: {
    alignItems: "center",
    gap: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 18 },
  rightColumn: {
    flex: 1,
    flexDirection: "column",
  },
  subRowOne: {
    flexDirection: "row",
    paddingBottom: 5,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    flex: 1,
  },
  amounts: {
    fontSize: 14,
    color: "#000",
  },
  subRowTwo: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "space-between",
    alignItems: "center",
  },
  pct: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressTrack: {
    width: "85%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E5EA",
    overflow: "hidden",
  },
  progressFill: { height: 4, borderRadius: 2 },
  spent: { fontWeight: "700" },
  allocated: { color: "#8E8E93", fontWeight: "400" },
});
