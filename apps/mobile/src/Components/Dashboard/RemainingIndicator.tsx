import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "@/src/utils/formatCurrency";

interface Props {
  remainingToAllocate: number;
  isOverAllocated: boolean;
}

export default function RemainingIndicator({
  remainingToAllocate,
  isOverAllocated,
}: Props) {
  const displayAmount = isOverAllocated
    ? formatCurrency(-remainingToAllocate)
    : formatCurrency(remainingToAllocate);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isOverAllocated ? "#FFF2F0" : "#F0FFF4",
          borderColor: isOverAllocated ? "#FFD6CC" : "#C6F6D5",
        },
      ]}
    >
      <Ionicons
        name={isOverAllocated ? "warning" : "checkmark-circle"}
        size={20}
        color={isOverAllocated ? "#FF3B30" : "#34C759"}
      />
      <View style={styles.textContainer}>
        <Text style={styles.label}>
          {isOverAllocated ? "Over-Allocated By" : "Remaining to Allocate"}
        </Text>
        <Text
          style={[
            styles.amount,
            { color: isOverAllocated ? "#FF3B30" : "#34C759" },
          ]}
        >
          {displayAmount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: "#8E8E93",
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
});
