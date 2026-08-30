import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  shiftPeriodMonth,
  formatPeriodMonth,
  getPeriodMonth,
} from "@/src/utils/month";

export default function PeriodPicker({
  periodMonth,
  onChange,
}: {
  periodMonth: string;
  onChange: (month: string) => void;
}) {
  const currentMonth = getPeriodMonth();
  const isCurrentMonth = periodMonth === currentMonth;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onChange(shiftPeriodMonth(periodMonth, -1))}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={22} color="#007AFF" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onChange(currentMonth)}
        disabled={isCurrentMonth}
      >
        <Text style={[styles.label, isCurrentMonth && styles.labelCurrent]}>
          {isCurrentMonth ? "This Month" : formatPeriodMonth(periodMonth)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onChange(shiftPeriodMonth(periodMonth, 1))}
        disabled={isCurrentMonth}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="chevron-forward"
          size={22}
          color={isCurrentMonth ? "#C7C7CC" : "#007AFF"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#007AFF",
  },
  labelCurrent: {
    color: "#8E8E93",
  },
});
