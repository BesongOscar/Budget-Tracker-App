import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/src/api/transactions.api";
import { formatCurrency } from "@/src/utils/formatCurrency";
import { useCurrency } from "@/src/hooks/useCurrency";
import {
  formatTransactionDate,
  formatFullDate,
  groupByDate,
} from "@/src/utils/formatDate";
import EmptyState from "@/src/Components/EmptyState";
import LoadingSkeleton from "@/src/Components/LoadingSkeleton";
import ErrorState from "@/src/Components/ErrorState";

type Filter = "ALL" | "INCOME" | "EXPENSE";

export default function TransactionListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const code = useCurrency();
  const [filter, setFilter] = useState<Filter>("ALL");

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [
      "transactions",
      { type: filter === "ALL" ? undefined : filter, limit: 50 },
    ],
    queryFn: () =>
      transactionsApi.getAll({
        type: filter === "ALL" ? undefined : filter,
        limit: 50,
      }),
  });

  const raw = data?.data?.data;
  const transactions = Array.isArray(raw) ? raw : [];
  const grouped = groupByDate(transactions);

  const sections: { title: string; data: any[] }[] = Object.entries(
    grouped,
  ).map(([title, data]) => ({ title, data }));

  const renderTransaction = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.transactionRow}
      onPress={() => router.push(`/(transactions)/${item.id}`)}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: (item.category?.color || "#8E8E93") + "20" },
        ]}
      >
        <Text style={styles.iconText}>{item.category?.icon || "📦"}</Text>
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDesc} numberOfLines={1}>
          {item.description || item.category?.name || "Transaction"}
        </Text>
        <Text style={styles.transactionDate}>
          {formatTransactionDate(item.date)}
        </Text>
      </View>
      <View style={styles.amountColumn}>
        <Text
          style={[
            styles.transactionAmount,
            { color: item.type === "INCOME" ? "#34C759" : "#FF3B30" },
          ]}
        >
          {item.type === "INCOME" ? "+" : "-"}
          {formatCurrency(Number(item.amount), code)}
        </Text>
        <Text style={styles.transactionFullDate}>
          {formatFullDate(item.date)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      <View style={styles.filterRow}>
        {(["ALL", "INCOME", "EXPENSE"] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "ALL" ? "All" : f === "INCOME" ? "Income" : "Expense"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : isError && transactions.length === 0 ? (
        <ErrorState message="Couldn't load your transactions." onRetry={() => refetch()} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          message="Tap + to add your first transaction"
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor="#007AFF" />
          }
        >
          {sections.map((section) => (
            <View key={section.title} style={styles.sectionGroup}>
              <Text style={styles.sectionHeader}>{section.title}</Text>
              <View style={styles.sectionCard}>
                {section.data.map(renderTransaction)}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  title: { fontSize: 28, fontWeight: "700", color: "#000" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E5E5EA",
  },
  filterPillActive: { backgroundColor: "#007AFF" },
  filterText: { fontSize: 13, fontWeight: "500", color: "#8E8E93" },
  filterTextActive: { color: "#fff" },
  scrollContent: { paddingBottom: 24 },
  sectionGroup: {},
  sectionCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    textTransform: "uppercase",
  },
  // cardDivider: {
  //   height: 1,
  //   backgroundColor: "#F2F2F7",
  //   marginHorizontal: 16,
  // },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 1,
    paddingVertical: 12,
    marginHorizontal: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: { fontSize: 20 },
  transactionInfo: { flex: 1 },
  transactionDesc: { fontSize: 16, color: "#000", fontWeight: "500" },
  transactionDate: { fontSize: 13, color: "#8E8E93", marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: "600" },
  amountColumn: { alignItems: "flex-end" },
  transactionFullDate: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 2,
  },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
});
