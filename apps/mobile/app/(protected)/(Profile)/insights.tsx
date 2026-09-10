import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { dashboardApi } from "@/src/api/dashboard.api";
import { getPeriodMonth } from "@/src/utils/month";
import { formatCurrency } from "@/src/utils/formatCurrency";
import { useCurrency } from "@/src/hooks/useCurrency";
import AlertCard from "@/src/Components/Insights/AlertCard";
import LoadingSkeleton from "@/src/Components/LoadingSkeleton";
import ErrorState from "@/src/Components/ErrorState";

interface Alert {
  id: string;
  severity: "warning" | "danger";
  icon: string;
  title: string;
  description: string;
  amount: string;
}

function deriveAlerts(dashboard: any, code: string): Alert[] {
  const alerts: Alert[] = [];

  // 1. Over-allocation alert
  if (dashboard.isOverAllocated) {
    const overAmount = dashboard.allocated - dashboard.income;
    alerts.push({
      id: "over-allocation",
      severity: "danger",
      icon: "warning",
      title: "Over-Allocation",
      description:
        "Your total allocated budgets exceed your income this period.",
      amount: formatCurrency(overAmount, code),
    });
  }

  // 2. Per-budget alerts
  for (const budget of dashboard.budgetProgress) {
    const spent = Number(budget.spent);
    const allocated = Number(budget.allocated);

    if (spent > allocated) {
      // Over budget
      const overAmount = spent - allocated;
      alerts.push({
        id: `over-budget-${budget.categoryId}`,
        severity: "danger",
        icon: "alert-circle",
        title: `${budget.icon} ${budget.categoryName} — Over Budget`,
        description: `You've exceeded your budget for ${budget.categoryName}.`,
        amount: formatCurrency(overAmount, code),
      });
    } else if (allocated > 0 && budget.percentUsed >= 80) {
      // Near 80% threshold
      alerts.push({
        id: `threshold-80-${budget.categoryId}`,
        severity: "warning",
        icon: "alert",
        title: `${budget.icon} ${budget.categoryName} — 80% Used`,
        description: `You've used ${budget.percentUsed}% of your ${budget.categoryName} budget.`,
        amount: `${formatCurrency(spent, code)} / ${formatCurrency(allocated, code)}`,
      });
    }
  }

  return alerts;
}

export default function InsightsScreen() {
  const month = getPeriodMonth();
  const code = useCurrency();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["dashboard", month],
    queryFn: () => dashboardApi.getDashboard(month),
  });

  const dashboard = data?.data?.data;
  const alerts = dashboard ? deriveAlerts(dashboard, code) : [];

  const overBudgetAlerts = alerts.filter((a) => a.id.startsWith("over-budget"));
  const thresholdAlerts = alerts.filter((a) => a.id.startsWith("threshold-80"));
  const overAllocationAlerts = alerts.filter((a) => a.id === "over-allocation");

  return (
    <View style={styles.container}>
      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError ? (
        <ErrorState message="Couldn't load your insights." onRetry={() => refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor="#007AFF" />
          }
        >
          <Text style={styles.header}>Insights</Text>

          {alerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={56} color="#34C759" />
              <Text style={styles.emptyTitle}>All Clear</Text>
              <Text style={styles.emptyText}>
                No alerts — you're on track this month.
              </Text>
            </View>
          ) : (
            <>
              {/* Over-Allocation */}
              {overAllocationAlerts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Over-Allocation</Text>
                  {overAllocationAlerts.map((alert) => (
                    <AlertCard key={alert.id} {...alert} />
                  ))}
                </View>
              )}

              {/* Over Budget */}
              {overBudgetAlerts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Over Budget</Text>
                  {overBudgetAlerts.map((alert) => (
                    <AlertCard key={alert.id} {...alert} />
                  ))}
                </View>
              )}

              {/* Nearing 80% */}
              {thresholdAlerts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Nearing Limit</Text>
                  {thresholdAlerts.map((alert) => (
                    <AlertCard key={alert.id} {...alert} />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#34C759",
  },
  emptyText: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
  },
});
