import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  message?: string;
  onRetry?: () => void;
  onViewCache?: () => void;
  hasCache?: boolean;
}

export default function ErrorState({
  message = "Something went wrong loading this data.",
  onRetry,
  onViewCache,
  hasCache,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={44} color="#C7C7CC" />
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity
            style={[styles.btn, styles.primary]}
            onPress={onRetry}
          >
            <Text style={styles.primaryText}>Retry</Text>
          </TouchableOpacity>
        )}
        {onViewCache && hasCache && (
          <TouchableOpacity
            style={[styles.btn, styles.secondary]}
            onPress={onViewCache}
          >
            <Text style={styles.secondaryText}>View cached data</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  message: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  primary: { backgroundColor: "#007AFF" },
  primaryText: { color: "#FFF", fontWeight: "600" },
  secondary: { backgroundColor: "#F2F2F7" },
  secondaryText: { color: "#007AFF", fontWeight: "600" },
});
