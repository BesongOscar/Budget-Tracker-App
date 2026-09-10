import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { dashboardApi } from "@/src/api/dashboard.api";
import { getPeriodMonth } from "@/src/utils/month";
import BalanceCard from "@/src/Components/Dashboard/BalanceCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PeriodSummaryCards from "@/src/Components/Dashboard/PeriodSummaryCards";
import BudgetProgressBars from "@/src/Components/Dashboard/BudgetProgressBars";
import RecentTransactions from "@/src/Components/Dashboard/RecentTransactions";
import { useAuthStore } from "@/src/store/authStore";
import LoadingSkeleton from "@/src/Components/LoadingSkeleton";
import ErrorState from "@/src/Components/ErrorState";
import { useNetwork } from "@/src/hooks/useNetwork";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isOffline } = useNetwork();
  const month = getPeriodMonth();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } =
    useQuery({
      queryKey: ["dashboard", month],
      queryFn: () => dashboardApi.getDashboard(month),
    });

  const dashboard = data?.data?.data;

  let lastUpdated: string | null = null;
  if (dataUpdatedAt) {
    lastUpdated = new Date(dataUpdatedAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isLoading && !dashboard ? (
        <LoadingSkeleton rows={5} />
      ) : (isError && !dashboard) ? (
        <ErrorState
          message="Couldn't load your dashboard."
          onRetry={() => refetch()}
          onViewCache={() => refetch()}
          hasCache={!!dashboard}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor="#007AFF" />
          }
        >
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              {greeting}, {firstName} 👋
            </Text>
            <Text style={styles.greetingSub}>
              Here's your financial overview
            </Text>
            {isOffline && lastUpdated && (
              <Text style={styles.offlineStamp}>
                Updated {lastUpdated} (offline)
              </Text>
            )}
          </View>
          <BalanceCard balance={dashboard.balance} />

          <PeriodSummaryCards
            income={dashboard.income}
            allocated={dashboard.allocated}
            spent={dashboard.spent}
          />

          <TouchableOpacity
            style={styles.link}
            onPress={() => router.push("/(protected)/(home)/analytics")}
          >
            <Ionicons name="bar-chart-outline" size={24} color="#007AFF" />
            <Text style={styles.linkText}>View Analytics</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          {/* <RemainingIndicator
            remainingToAllocate={dashboard.remainingToAllocate}
            isOverAllocated={dashboard.isOverAllocated}
          /> */}

          <BudgetProgressBars items={dashboard.budgetProgress} />

          <RecentTransactions transactions={dashboard.recentTransactions} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  content: {
    paddingBottom: 20,
  },
  greeting: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#000",
  },
  greetingSub: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
  },
  offlineStamp: {
    fontSize: 12,
    color: "#FF9500",
    marginTop: 6,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 4,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
  },
});
