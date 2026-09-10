import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { categoriesApi } from "@/src/api/categories.api";
import EmptyState from "@/src/Components/EmptyState";
import LoadingSkeleton from "@/src/Components/LoadingSkeleton";
import ErrorState from "@/src/Components/ErrorState";
import { confirmDelete } from "@/src/utils/confirmDelete";
import { useOfflineMutation } from "@/src/hooks/useOfflineMutation";

type Tab = "INCOME" | "EXPENSE";

export default function CategoryListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("EXPENSE");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["categories", activeTab],
    queryFn: () => categoriesApi.getAll(activeTab),
  });

  const raw = data?.data?.data;
  const categories = Array.isArray(raw) ? raw : [];

  const deleteMutation = useOfflineMutation<any, string>({
    mutationFn: async (cid) => categoriesApi.remove(cid),
    op: (cid) => ({ kind: "category", action: "delete", id: cid }),
    invalidateKeys: [["categories"]],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const handleDelete = useCallback(
    (id: string, name: string) => {
      confirmDelete({
        title: "Delete Category",
        message: `Are you sure you want to delete "${name}"?`,
        onConfirm: () => deleteMutation.mutate(id),
      });
    },
    [deleteMutation],
  );

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.categoryRow}
      onPress={() => router.push(`/(Profile)/category/${item.id}`)}
      onLongPress={() => handleDelete(item.id, item.name)}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.color + "20" }]}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabRow}>
        {(["EXPENSE", "INCOME"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "EXPENSE" ? "Expense" : "Income"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          message={`Create your first ${activeTab.toLowerCase()} category to start tracking`}
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  title: { fontSize: 20, fontWeight: "600", color: "#000" },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "#E5E5EA",
  },
  tabActive: { backgroundColor: "#007AFF" },
  tabText: { fontSize: 14, fontWeight: "500", color: "#8E8E93" },
  tabTextActive: { color: "#fff" },
  list: { backgroundColor: "#fff", marginTop: 8 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: { fontSize: 20 },
  categoryName: { flex: 1, fontSize: 16, color: "#000" },
  separator: { height: 1, backgroundColor: "#F2F2F7", marginLeft: 72 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
});
