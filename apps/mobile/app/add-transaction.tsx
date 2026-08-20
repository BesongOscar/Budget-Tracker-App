import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { categoriesApi } from "@/src/api/categories.api";
import { transactionsApi } from "@/src/api/transactions.api";
import { budgetsApi } from "@/src/api/budgets.api";
import { formatCurrency } from "@/src/utils/formatCurrency";
import CTAbutton from "@/src/Components/CTAbutton";

type TransactionType = "INCOME" | "EXPENSE";

export default function AddTransactionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date());
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ["categories", type],
    queryFn: () => categoriesApi.getAll(type),
  });

  const categories = useMemo(() => {
    const rawCats = catData?.data?.data;
    if (!Array.isArray(rawCats)) return [];

    // Deduplicate by id (safety net for stale persisted cache)
    const seen = new Set<string>();
    return rawCats.filter((c: any) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [catData]);

  const createMutation = useMutation({
    mutationFn: () =>
      transactionsApi.create({
        amount: parseFloat(amount),
        type,
        categoryId,
        date: date.toISOString(),
        description: description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      router.back();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Something went wrong";
      Alert.alert("Failed to save", message);
    },
  });

  const selectedCategory = categories.find((c: any) => c.id === categoryId);

  const now = new Date();
  const currentPeriodMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;

  const { data: budgetData } = useQuery({
    queryKey: ["budget", categoryId, currentPeriodMonth],
    queryFn: () => budgetsApi.getForCategory(categoryId, currentPeriodMonth),
    enabled: !!categoryId,
  });

  const budget =
    budgetData?.data?.data?.budgets?.find(
      (b: any) => b.categoryId === categoryId,
    ) ?? null;

  const allocated = budget ? Number(budget.allocatedAmount) : 0;
  const spent = budget ? Number(budget.spentAmount) : 0;
  const remaining = allocated - spent;
  const isOverBudget = budget ? spent > allocated : false;
  const spentPct =
    budget && allocated > 0 ? Math.min(100, (spent / allocated) * 100) : 0;

  const canSubmit =
    amount && parseFloat(amount) > 0 && categoryId && !createMutation.isPending;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Transaction</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.typeRow}>
          {(["EXPENSE", "INCOME"] as TransactionType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeButton, type === t && styles.typeButtonActive]}
              onPress={() => {
                setType(t);
                setCategoryId("");
              }}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === t && styles.typeButtonTextActive,
                ]}
              >
                {t === "EXPENSE" ? "Expense" : "Income"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View>
          {/* Amount */}
          <View style={{ marginVertical: 5 }}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="FCFA0.00"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          {/* Category Picker */}
          <View style={{ marginVertical: 5 }}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              {selectedCategory ? (
                <View style={styles.pickerContent}>
                  <Text style={{ fontSize: 20 }}>{selectedCategory.icon}</Text>
                  <Text style={styles.pickerText}>{selectedCategory.name}</Text>
                </View>
              ) : (
                <Text style={styles.pickerPlaceholder}>Select category</Text>
              )}
              <Ionicons name="chevron-down" size={18} color="#000000" />
            </TouchableOpacity>
          </View>

          {type === "EXPENSE" && budget && (
            <View style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <Text style={{ fontSize: 20 }}>{selectedCategory?.icon}</Text>
                <Text style={styles.budgetTitle}>
                  {selectedCategory?.name} Budget
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    isOverBudget
                      ? styles.statusBadgeOver
                      : styles.statusBadgeActive,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {isOverBudget ? "OVER BUDGET" : budget.status}
                  </Text>
                </View>
              </View>

              <View style={styles.budgetRows}>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Allocated</Text>
                  <Text style={styles.budgetValue}>
                    {formatCurrency(allocated)}
                  </Text>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Spent</Text>
                  <Text style={styles.budgetValue}>
                    {formatCurrency(spent)}
                  </Text>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Remaining</Text>
                  <Text
                    style={[
                      styles.budgetValue,
                      { color: isOverBudget ? "#FF3B30" : "#34C759" },
                    ]}
                  >
                    {formatCurrency(remaining)}
                  </Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${spentPct}%`,
                      backgroundColor: isOverBudget ? "#FF3B30" : "#007AFF",
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Date */}
          <View style={{ marginVertical: 5 }}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.pickerButton}>
              <View style={styles.pickerContent}>
                <Ionicons name="calendar-outline" size={20} color="#000000" />
                <Text style={styles.pickerText}>
                  {date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={{ marginVertical: 5 }}>
            <Text style={styles.label}>Notes(optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor="#C7C7CC"
            />
          </View>
        </View>

        <CTAbutton
          title="Save Transaction"
          onPress={() => createMutation.mutate()}
          backgroundcolor={canSubmit ? "#007AFF" : "#C7C7CC"}
          textColor="#FFFFFF"
          marginVertical={24}
          disabled={!canSubmit || createMutation.isPending}
        />
      </ScrollView>

      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View
            style={styles.bottomSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {type === "EXPENSE" ? "Expense" : "Income"} Categories
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    categoryId === item.id && styles.categoryOptionActive,
                  ]}
                  onPress={() => {
                    setCategoryId(item.id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.categoryIcon}>{item.icon}</Text>
                  <Text style={styles.categoryName}>{item.name}</Text>
                  {categoryId === item.id && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 15,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  title: { fontSize: 20, fontWeight: "600", color: "#000" },
  content: { paddingHorizontal: 20, paddingVertical: 5 },
  typeRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    borderWidth: 0.1,
    marginBottom: 25,
    width: "95%",
    alignSelf: "center",
    marginVertical: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  typeButtonText: { fontSize: 14, fontWeight: "600", color: "#333" },
  typeButtonTextActive: { color: "#fff" },
  label: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 5,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: "#D1D5D8",
    borderRadius: 12,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  pickerContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  pickerText: { fontSize: 16, color: "#000", fontWeight: "400" },
  pickerPlaceholder: { fontSize: 16, color: "#8E8E93" },
  descriptionInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  budgetCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    padding: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  budgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  budgetTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: "#000" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusBadgeActive: { backgroundColor: "#34C75920" },
  statusBadgeOver: { backgroundColor: "#FF3B3020" },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: "#000" },
  budgetRows: { gap: 6 },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetLabel: { fontSize: 14, color: "#8E8E93" },
  budgetValue: { fontSize: 14, fontWeight: "600", color: "#000" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E5EA",
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: { height: 8, borderRadius: 4 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "65%",
    paddingBottom: 34,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  sheetTitle: { fontSize: 18, fontWeight: "600", color: "#000" },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  categoryOptionActive: { backgroundColor: "#007AFF10" },
  categoryIcon: { fontSize: 24, marginRight: 12 },
  categoryName: { flex: 1, fontSize: 16, color: "#000" },
});
