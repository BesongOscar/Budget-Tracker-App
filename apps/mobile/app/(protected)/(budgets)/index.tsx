import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { budgetsApi } from "@/src/api/budgets.api";
import {
  formatPeriodMonth,
  getPeriodMonth,
  shiftPeriodMonth,
} from "@/src/utils/month";
import AllocationSummaryCard from "@/src/Components/Budget/AllocationSummaryCard";
import OverAllocationBanner from "@/src/Components/Budget/OverAllocationBanner";
import EndOfPeriodPrompt from "@/src/Components/Budget/EndOfPeriodPrompt";
import BudgetCard from "@/src/Components/Budget/BudgetCard";
import LoadingSkeleton from "@/src/Components/LoadingSkeleton";
import ErrorState from "@/src/Components/ErrorState";
import { useOfflineMutation } from "@/src/hooks/useOfflineMutation";

export default function BudgetOverviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(getPeriodMonth());
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["budgets", month],
    queryFn: () => budgetsApi.getPeriod({ month }),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const payload = data?.data?.data;
  const budgets: any[] = Array.isArray(payload?.budgets) ? payload.budgets : [];
  const summary = payload?.summary;

  const copyMutation = useOfflineMutation<any, undefined>({
    mutationFn: async () =>
      budgetsApi.copyPeriod({
        fromMonth: shiftPeriodMonth(month, -1),
        toMonth: month,
      }),
    op: () => ({
      kind: "budget",
      action: "copy",
      payload: {
        fromMonth: shiftPeriodMonth(month, -1),
        toMonth: month,
      },
    }),
    invalidateKeys: [["budgets", month]],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", month] });
      Alert.alert("Copied", "Last month's budgets were copied.");
    },
    onError: (error: any) =>
      Alert.alert(
        "Copy failed",
        error?.response?.data?.error?.message || error?.message,
      ),
  });

  const isCurrentMonth = month === getPeriodMonth();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Budgets</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(protected)/(budgets)/set-budget",
              params: { month },
            })
          }
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.periodBar}>
        <TouchableOpacity
          onPress={() => setMonth(getPeriodMonth())}
          style={[styles.periodPill, isCurrentMonth && styles.periodPillActive]}
        >
          <Text
            style={[
              styles.periodPillText,
              isCurrentMonth && styles.periodPillTextActive,
            ]}
          >
            This Month
          </Text>
        </TouchableOpacity>

        <View style={styles.monthNav}>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => setMonth(shiftPeriodMonth(month, -1))}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={18} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{formatPeriodMonth(month)}</Text>
            <TouchableOpacity
              onPress={() => setMonth(shiftPeriodMonth(month, 1))}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
        </View>
      </View>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {summary && <AllocationSummaryCard summary={summary} />}
          {summary?.isOverAllocated && <OverAllocationBanner />}

          {budgets.length === 0 && (
            <EndOfPeriodPrompt
              onCopy={() => copyMutation.mutate(undefined as any)}
              isCopying={copyMutation.isPending}
            />
          )}

          {budgets.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No budgets yet</Text>
              <Text style={styles.emptyMessage}>
                {isCurrentMonth
                  ? "Tap + to set a budget or copy last month to start planning."
                  : "No budgets were set for this month."}
              </Text>
            </View>
          ) : (
            budgets.map((budget: any) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onPress={() => router.push(`/(budgets)/${budget.id}`)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 25,
    backgroundColor: "#FFFFFF",
  },
  title: { fontSize: 28, fontWeight: "700", color: "#000" },
  periodBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  periodPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
  },
  periodPillActive: {
    backgroundColor: "#007AFF",
  },
  periodPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
  },
  periodPillTextActive: {
    color: "#FFFFFF",
  },
  monthNav: {
    width: "50%",
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: "#F2F2F7",
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  monthLabel: { fontSize: 14, fontWeight: "600", color: "#8E8E93" },
  content: { paddingVertical: 8, paddingBottom: 120 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyBox: { alignItems: "center", paddingTop: 32, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#000" },
  emptyMessage: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 6,
  },
});
