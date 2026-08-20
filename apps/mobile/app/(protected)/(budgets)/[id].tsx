import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { budgetsApi } from "@/src/api/budgets.api";
import { transactionsApi } from "@/src/api/transactions.api";
import { formatCurrency } from "@/src/utils/formatCurrency";
import { formatPeriodMonth, getPeriodDateRange } from "@/src/utils/month";
import { formatTransactionDate } from "@/src/utils/formatDate";

export default function BudgetDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["budget", id],
    queryFn: () => budgetsApi.getOne(id),
  });

  const budget = data?.data?.data;
  const allocated = budget ? Number(budget.allocatedAmount) : 0;
  const spent = budget ? Number(budget.spentAmount) : 0;
  const over = spent > allocated;
  const remaining = allocated - spent;
  const pct =
    allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

  const { from, to } = budget
    ? getPeriodDateRange(budget.periodMonth)
    : { from: "", to: "" };

  const { data: txData } = useQuery({
    queryKey: ["transactions", budget?.categoryId, budget?.periodMonth],
    queryFn: () =>
      transactionsApi.getAll({
        categoryId: budget!.categoryId,
        from,
        to,
        limit: 20,
      }),
    enabled: !!budget?.categoryId,
  });

  const transactions: any[] = txData?.data?.data ?? [];

  const removeMutation = useMutation({
    mutationFn: () => budgetsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      router.back();
    },
    onError: (error: any) =>
      Alert.alert(
        "Delete failed",
        error?.response?.data?.error?.message || error?.message,
      ),
  });

  const canDelete = budget?.status === "DRAFT" || budget?.status === "ARCHIVED";

  const showActions = () => {
    const options = ["Edit allocation", "Delete budget", "Cancel"];
    const cancelButtonIndex = 2;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            router.push({
              pathname: "/(protected)/(budgets)/set-budget",
              params: { id },
            });
          } else if (buttonIndex === 1 && canDelete) {
            removeMutation.mutate();
          }
        },
      );
    } else {
      Alert.alert(
        "Budget Actions",
        "",
        [
          {
            text: "Edit allocation",
            onPress: () =>
              router.push({
                pathname: "/(protected)/(budgets)/set-budget",
                params: { id },
              }),
          },
          canDelete
            ? {
                text: "Delete budget",
                style: "destructive",
                onPress: () => removeMutation.mutate(),
              }
            : null,
          { text: "Cancel", style: "cancel" },
        ].filter(Boolean) as any,
      );
    }
  };

  if (isLoading || !budget) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={showActions}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: (budget.category?.color || "#8E8E93") + "20" },
            ]}
          >
            <Text style={styles.heroIcon}>{budget.category?.icon || "📦"}</Text>
          </View>
          <Text style={styles.categoryName}>{budget.category?.name}</Text>
          <Text style={styles.period}>
            {formatPeriodMonth(budget.periodMonth)}
          </Text>

          <Text
            style={[styles.heroAmount, { color: over ? "#FF3B30" : "#000" }]}
          >
            {formatCurrency(spent)}
            <Text style={styles.heroOf}>/{formatCurrency(allocated)}</Text>
          </Text>

          <Text style={styles.pctText}>{pct}% of budget used</Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${pct}%`,
                  backgroundColor: over ? "#FF3B30" : "#007AFF",
                },
              ]}
            />
          </View>
        </View>

        {/* Stats - 3 column */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text
              style={[styles.statValue, { color: over ? "#FF3B30" : "#000" }]}
            >
              {formatCurrency(spent)}
            </Text>
          </View>
          <View/>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Budget</Text>
            <Text style={styles.statValue}>{formatCurrency(allocated)}</Text>
          </View>
          <View/>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text
              style={[
                styles.statValue,
                { color: remaining >= 0 ? "#007AFF" : "#FF3B30" },
              ]}
            >
              {formatCurrency(Math.abs(remaining))}
            </Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.txSection}>
          <Text style={styles.txHeader}>Transactions</Text>

          {transactions.length === 0 ? (
            <Text style={styles.txEmpty}>
              No transactions for this category this month
            </Text>
          ) : (
            transactions.map((tx: any) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.txIcon,
                      {
                        backgroundColor:
                          (budget.category?.color || "#8E8E93") + "15",
                      },
                    ]}
                  >
                    <Text style={styles.txIconText}>
                      {budget.category?.icon || "📦"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.txName} numberOfLines={1}>
                      {tx.description || "Transaction"}
                    </Text>
                    <Text style={styles.txDate}>
                      {formatTransactionDate(tx.date)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.txAmount}>
                  -{formatCurrency(Number(tx.amount))}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  content: { paddingBottom: 48 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F7",
  },
  hero: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroIcon: { fontSize: 32 },
  categoryName: { fontSize: 22, fontWeight: "700", color: "#000" },
  period: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
    marginBottom: 16,
  },
  heroAmount: {
    fontSize: 30,
    fontWeight: "800",
  },
  heroOf: {
    fontSize: 16,
    fontWeight: "400",
    color: "#8E8E93",
  },
  pctText: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 6,
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E5EA",
    width: "90%",
    overflow: "hidden",
  },
  progressFill: { height: 8, borderRadius: 4 },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomColor: "#E5E5EA",
  },
  statCol: { flex: 1, alignItems: "center", gap: 4 },
  statLabel: { fontSize: 14, color: "#8E8E93", fontWeight: "500" },
  statValue: { fontSize: 15, fontWeight: "bold", color: "#000" },

  txSection: {
    backgroundColor: "#fff",
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  txHeader: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  txEmpty: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    paddingVertical: 20,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  txLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  txIconText: { fontSize: 15 },
  txName: { fontSize: 15, fontWeight: "500", color: "#000", maxWidth: 180 },
  txDate: { fontSize: 12, color: "#8E8E93", marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "600", color: "#FF3B30" },
});
