import { View, Text, StyleSheet } from "react-native";
import { formatCurrency } from "@/src/utils/formatCurrency";

interface BudgetItem {
  categoryId: string;
  categoryName: string;
  icon: string;
  colorHex: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: string;
}

export default function BudgetProgressBars({ items }: { items: BudgetItem[] }) {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Budget Overview</Text>
      <View style={styles.card}>
        {items.map((item, idx) => {
          const over = item.spent > item.allocated;
          return (
            <View
              key={item.categoryId}
              style={[styles.row, idx < items.length - 1 && styles.rowBorder]}
            >
              <View style={styles.left}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: item.colorHex + "20" },
                  ]}
                >
                  <Text style={styles.icon}>{item.icon}</Text>
                </View>
                <View style={styles.textCol}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.categoryName}
                  </Text>
                  <Text style={styles.amounts}>
                    <Text
                      style={{
                        color: over ? "#FF3B30" : "#000",
                        fontWeight: "600",
                      }}
                    >
                      {formatCurrency(item.spent)}
                    </Text>
                    {" / "}
                    <Text style={styles.allocated}>
                      {formatCurrency(item.allocated)}
                    </Text>
                  </Text>
                </View>
              </View>

              <View style={styles.right}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${item.percentUsed}%`,
                        backgroundColor: over ? "#FF3B30" : "#007AFF",
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.pct, { color: over ? "#FF3B30" : "#8E8E93" }]}
                >
                  {item.percentUsed}%
                </Text>
              </View>
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
    marginBottom: 12,
    marginTop: 10,
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
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 16 },
  textCol: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  amounts: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  allocated: {
    color: "#8E8E93",
    fontWeight: "400",
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  progressTrack: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E5EA",
    overflow: "hidden",
  },
  progressFill: { height: 4, borderRadius: 2 },
  pct: {
    fontSize: 11,
    fontWeight: "500",
  },
});
