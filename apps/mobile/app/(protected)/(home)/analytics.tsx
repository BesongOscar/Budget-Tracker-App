import { useState } from "react";
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
import { PieChart, BarChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import { analyticsApi } from "@/src/api/analytics.api";
import { transactionsApi } from "@/src/api/transactions.api";
import { getPeriodMonth, getPeriodDateRange } from "@/src/utils/month";
import { formatCurrency } from "@/src/utils/formatCurrency";
import { useCurrency } from "@/src/hooks/useCurrency";
import PeriodPicker from "@/src/Components/Analytics/PeriodPicker";
import LoadingSkeleton from "@/src/Components/LoadingSkeleton";
import ErrorState from "@/src/Components/ErrorState";

export default function AnalyticsScreen() {
  const router = useRouter();
  const code = useCurrency();
  const [periodMonth, setPeriodMonth] = useState(getPeriodMonth());

  const { data: byCategoryData, isLoading: loadingCategory, isError: byCategoryIsError } = useQuery({
    queryKey: ["analytics", "by-category", periodMonth],
    queryFn: () => analyticsApi.getByCategory(periodMonth),
  });

  const trendResult = useQuery({
    queryKey: ["analytics", "trend", 6],
    queryFn: () => analyticsApi.getTrend(6),
  });
  const { data: trendData, isLoading: loadingTrend, isError: trendIsError, refetch: refetchTrend } = trendResult;

  const { data: transactionsData, isError: dailyIsError, refetch: refetchDaily } = useQuery({
    queryKey: ["analytics", "daily", periodMonth],
    queryFn: () => {
      const { from, to } = getPeriodDateRange(periodMonth);
      return transactionsApi.getAll({ type: "EXPENSE", from, to, limit: 100 });
    },
  });

  const categories = byCategoryData?.data?.data?.categories ?? [];
  const grandTotal = byCategoryData?.data?.data?.grandTotal ?? 0;
  const trend = trendData?.data?.data ?? [];

  // Previous month comparison
  const currentIdx = trend.findIndex(
    (t: { periodMonth: string }) => t.periodMonth === periodMonth,
  );
  const currentMonthExpenses =
    currentIdx >= 0 ? (trend[currentIdx]?.expenses ?? 0) : 0;
  const prevMonthExpenses =
    currentIdx > 0 ? (trend[currentIdx - 1]?.expenses ?? 0) : 0;
  const percentChange =
    prevMonthExpenses > 0
      ? Math.round(
          ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) *
            100 *
            10,
        ) / 10
      : 0;

  // Daily totals from transactions
  const rawTransactions = transactionsData?.data?.data ?? [];
  const dailyTotals: Record<number, number> = {};
  for (const tx of rawTransactions) {
    const day = new Date(tx.date).getDate();
    dailyTotals[day] = (dailyTotals[day] || 0) + Number(tx.amount);
  }

  const daysInMonth = new Date(
    parseInt(periodMonth.split("-")[0]),
    parseInt(periodMonth.split("-")[1]),
    0,
  ).getDate();

  const barData = Array.from({ length: daysInMonth }, (_, i) => ({
    value: dailyTotals[i + 1] || 0,
    label: (i + 1) % 5 === 0 || i + 1 === 1 ? `${i + 1}` : "",
    frontColor: "#007AFF",
  }));

  // Pie chart data
  const pieData = categories.map(
    (c: { color: string; categoryName: string; totalSpent: number }) => ({
      value: c.totalSpent,
      color: c.color,
      text: c.categoryName,
      textColor: "#000",
    }),
  );

  const isLoading = loadingCategory || loadingTrend;
  const isError = byCategoryIsError || trendIsError || dailyIsError;
  const refetch = () => {
    refetchTrend();
    refetchDaily();
  };
  const isRefreshing = isLoading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <PeriodPicker periodMonth={periodMonth} onChange={setPeriodMonth} />
      </View>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : isError ? (
        <ErrorState message="Couldn't load analytics." onRetry={refetch} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#007AFF" />
          }
        >
          {/* Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Spent</Text>
            <Text style={styles.cardAmount}>
              {formatCurrency(currentMonthExpenses, code)}
            </Text>
            {prevMonthExpenses > 0 && (
              <Text
                style={[
                  styles.cardChange,
                  { color: percentChange > 0 ? "#FF3B30" : "#34C759" },
                ]}
              >
                {percentChange > 0 ? "↑" : "↓"} {Math.abs(percentChange)}% vs
                last month
              </Text>
            )}
          </View>

          {/* Donut Chart — Spending by Category */}
          {categories.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Spending by Category</Text>

              <View style={styles.chartContainer}>
                <PieChart
                  data={pieData}
                  donut
                  radius={90}
                  innerRadius={55}
                  innerCircleColor="#fff"
                  centerLabelComponent={() => (
                    <View style={styles.centerLabel}>
                      <Text style={styles.centerAmount}>
                        {formatCurrency(grandTotal, code)}
                      </Text>
                      <Text style={styles.centerText}>Total</Text>
                    </View>
                  )}
                />
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                {categories.map(
                  (c: {
                    categoryId: string;
                    icon: string;
                    color: string;
                    categoryName: string;
                    totalSpent: number;
                    percentage: number;
                  }) => (
                    <View key={c.categoryId} style={styles.legendItem}>
                      <View
                        style={[styles.legendDot, { backgroundColor: c.color }]}
                      />
                      <Text style={styles.legendIcon}>{c.icon}</Text>
                      <Text style={styles.legendName} numberOfLines={1}>
                        {c.categoryName}
                      </Text>
                      <Text style={styles.legendAmount}>
                        {formatCurrency(c.totalSpent, code)}
                      </Text>
                      <Text style={styles.legendPct}>{c.percentage}%</Text>
                    </View>
                  ),
                )}
              </View>
            </View>
          )}

          {/* Daily Spending Bar Chart */}
          {barData.some((d) => d.value > 0) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Daily Spending</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={barData}
                  barWidth={14}
                  spacing={4}
                  barBorderRadius={4}
                  noOfSections={4}
                  yAxisThickness={0}
                  xAxisThickness={0}
                  xAxisLabelTextStyle={styles.xAxisLabel}
                  yAxisTextStyle={styles.yAxisLabel}
                  isAnimated
                />
              </ScrollView>
            </View>
          )}

          {/* Empty state */}
          {categories.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyText}>
                No expense data for this month
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 10,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  backButton: {
    fontSize: 24,
    color: "#007AFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
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
  card: {
    margin: 16,
    marginBottom: 0,
    padding: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: "#8E8E93",
  },
  cardAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    marginTop: 4,
  },
  cardChange: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  centerLabel: {
    alignItems: "center",
  },
  centerAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  centerText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  legend: {
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendIcon: {
    fontSize: 16,
  },
  legendName: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  legendPct: {
    fontSize: 13,
    color: "#8E8E93",
    width: 40,
    textAlign: "right",
  },
  xAxisLabel: {
    fontSize: 10,
    color: "#8E8E93",
  },
  yAxisLabel: {
    fontSize: 10,
    color: "#8E8E93",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#8E8E93",
  },
});
