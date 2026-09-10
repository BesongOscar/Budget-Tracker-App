import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { categoriesApi } from "@/src/api/categories.api";
import { budgetsApi } from "@/src/api/budgets.api";
import {
  formatPeriodMonth,
  getPeriodMonth,
  shiftPeriodMonth,
} from "@/src/utils/month";
import { formatCurrency } from "@/src/utils/formatCurrency";
import { useCurrency } from "@/src/hooks/useCurrency";
import { useOfflineMutation } from "@/src/hooks/useOfflineMutation";
import CTAbutton from "@/src/Components/CTAbutton";

export default function SetBudgetScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const code = useCurrency();
  const { id, month } = useLocalSearchParams<{ id?: string; month?: string }>();

  const targetMonth = month ?? getPeriodMonth();
  const isEdit = !!id;

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const { data: budgetData } = useQuery({
    queryKey: ["budget", id],
    queryFn: () => budgetsApi.getOne(id!),
    enabled: isEdit,
  });
  const editingBudget = budgetData?.data?.data;

  useEffect(() => {
    if (editingBudget) {
      setAmount(String(Number(editingBudget.allocatedAmount)));
      setCategoryId(editingBudget.categoryId);
    }
  }, [editingBudget]);

  const { data: catData } = useQuery({
    queryKey: ["categories", "EXPENSE"],
    queryFn: () => categoriesApi.getAll("EXPENSE"),
  });

  const { data: periodData } = useQuery({
    queryKey: ["budgets", targetMonth],
    queryFn: () => budgetsApi.getPeriod({ month: targetMonth }),
  });
  const periodBudgets: any[] = periodData?.data?.data?.budgets ?? [];
  const summary = periodData?.data?.data?.summary;

  const categories = useMemo(() => {
    const raw = catData?.data?.data;
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const budgeted = new Set(periodBudgets.map((b: any) => b.categoryId));
    return raw.filter((c: any) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return isEdit || !budgeted.has(c.id);
    });
  }, [catData, periodBudgets, isEdit]);

  const selectedCategory = categories.find((c: any) => c.id === categoryId);

  const entered = parseFloat(amount);
  const remainingAfter = summary
    ? summary.remainingToAllocate - (Number.isFinite(entered) ? entered : 0)
    : null;

  const saveMutation = useOfflineMutation<any, undefined>({
    mutationFn: async () =>
      isEdit
        ? budgetsApi.update(id!, { allocatedAmount: entered })
        : budgetsApi.create({
            categoryId,
            allocatedAmount: entered,
            periodMonth: targetMonth,
          }),
    op: () =>
      isEdit
        ? {
            kind: "budget",
            action: "update",
            id,
            payload: { allocatedAmount: entered },
          }
        : {
            kind: "budget",
            action: "create",
            payload: { categoryId, allocatedAmount: entered, periodMonth: targetMonth },
          },
    invalidateKeys: [["budgets"], ["budget"]],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      router.back();
    },
    onError: (error: any) =>
      Alert.alert(
        "Failed to save",
        error?.response?.data?.error?.message || error?.message,
      ),
  });

  const copyMutation = useOfflineMutation<any, undefined>({
    mutationFn: async () =>
      budgetsApi.copyPeriod({
        fromMonth: shiftPeriodMonth(targetMonth, -1),
        toMonth: targetMonth,
      }),
    op: () => ({
      kind: "budget",
      action: "copy",
      payload: {
        fromMonth: shiftPeriodMonth(targetMonth, -1),
        toMonth: targetMonth,
      },
    }),
    invalidateKeys: [["budgets"]],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      router.back();
    },
    onError: (error: any) =>
      Alert.alert(
        "Copy failed",
        error?.response?.data?.error?.message || error?.message,
      ),
  });

  const canSubmit =
    amount &&
    Number.isFinite(entered) &&
    entered >= 0 &&
    (isEdit || categoryId) &&
    !saveMutation.isPending;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? "Edit Budget" : "Set Budget"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.periodLabel}>{formatPeriodMonth(targetMonth)}</Text>

        {!isEdit && (
          <>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowPicker(true)}
            >
              {selectedCategory ? (
                <View style={styles.pickerContent}>
                  <Text style={{ fontSize: 20 }}>{selectedCategory.icon}</Text>
                  <Text style={styles.pickerText}>{selectedCategory.name}</Text>
                </View>
              ) : (
                <Text style={styles.pickerPlaceholder}>Select category</Text>
              )}
              <Ionicons name="chevron-down" size={18} color="#000" />
            </TouchableOpacity>
          </>
        )}

        {isEdit && editingBudget && (
          <Text style={styles.editCategory}>
            {editingBudget.category?.icon} {editingBudget.category?.name}
          </Text>
        )}

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#C7C7CC"
        />

        {remainingAfter !== null && amount !== "" && (
          <Text style={styles.preview}>
            Remaining to allocate after this:{" "}
            <Text
              style={{
                fontWeight: "700",
                color: remainingAfter < 0 ? "#FF3B30" : "#34C759",
              }}
            >
              {formatCurrency(remainingAfter, code)}
            </Text>
          </Text>
        )}

        <CTAbutton
          title={isEdit ? "Save Changes" : "Save Budget"}
          onPress={() => saveMutation.mutate(undefined as any)}
          backgroundcolor={canSubmit ? "#007AFF" : "#C7C7CC"}
          textColor="#FFFFFF"
          marginVertical={20}
          disabled={!canSubmit}
        />

        {!isEdit && (
          <CTAbutton
            title="Copy last month's budgets"
            onPress={() => copyMutation.mutate(undefined as any)}
            backgroundcolor="#FFFFFF"
            textColor="#007AFF"
            borderColor="#007AFF"
            borderWidth={1}
            marginVertical={4}
            disabled={copyMutation.isPending}
          />
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View
            style={styles.bottomSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Expense Categories</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
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
                    setShowPicker(false);
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
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#000" },
  content: { paddingHorizontal: 20, paddingVertical: 8 },
  periodLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  label: { fontSize: 16, fontWeight: "600", paddingVertical: 5 },
  editCategory: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    paddingVertical: 10,
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
  pickerText: { fontSize: 16, color: "#000" },
  pickerPlaceholder: { fontSize: 16, color: "#8E8E93" },
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
  preview: { fontSize: 13, color: "#8E8E93", marginTop: 10 },
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
