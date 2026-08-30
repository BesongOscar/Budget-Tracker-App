import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Severity = "warning" | "danger";

interface Props {
  severity: Severity;
  icon: string;
  title: string;
  description: string;
  amount?: string;
}

const SEVERITY_CONFIG = {
  warning: {
    bg: "#FFF7E6",
    border: "#FFD591",
    iconColor: "#FF9500",
    textColor: "#8A5A00",
  },
  danger: {
    bg: "#FFF2F0",
    border: "#FFD6CC",
    iconColor: "#FF3B30",
    textColor: "#A80000",
  },
};

export default function AlertCard({
  severity,
  icon,
  title,
  description,
  amount,
}: Props) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <View style={styles.header}>
        <Ionicons name={icon as any} size={18} color={config.iconColor} />
        <Text style={[styles.title, { color: config.textColor }]}>{title}</Text>
      </View>
      <Text style={[styles.description, { color: config.textColor }]}>
        {description}
      </Text>
      {amount && (
        <Text style={[styles.amount, { color: config.textColor }]}>
          {amount}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  amount: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
});
