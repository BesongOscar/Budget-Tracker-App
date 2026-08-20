import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { budgetsApi } from "@/src/api/budgets.api";
import { getPeriodMonth } from "@/src/utils/month";
import AllocationSummaryCard from "@/src/Components/Budget/AllocationSummaryCard";
import OverAllocationBanner from "@/src/Components/Budget/OverAllocationBanner";

export default function DashboardScreen() {
  const router = useRouter();
  const month = getPeriodMonth();

  const { data, isLoading } = useQuery({
    queryKey: ["budgets", month],
    queryFn: () => budgetsApi.getPeriod({ month }),
  });
  const summary = data?.data?.data?.summary;
  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : summary ? (
        <ScrollView contentContainerStyle={styles.content}>
          <AllocationSummaryCard summary={summary} />
          {summary.isOverAllocated && <OverAllocationBanner />}
          <TouchableOpacity
            style={styles.link}
            onPress={() => router.push("/(protected)/(budgets)")}
          >
            <Ionicons name="wallet-outline" size={24} color="#007AFF" />
            <Text style={styles.linkText}>Manage Budgets</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingBottom: 20,
    paddingTop: 6,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
  },
});
