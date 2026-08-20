import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { transactionsApi } from "@/src/api/transactions.api";
import { categoriesApi } from "@/src/api/categories.api";
import CTAbutton from "@/src/Components/CTAbutton";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () => transactionsApi.getOne(id!),
    enabled: !!id,
  });

  const transaction = txData?.data?.data ?? null;

  const { data: catData } = useQuery({
    queryKey: ["categories", transaction?.type],
    queryFn: () => categoriesApi.getAll(transaction?.type),
    enabled: !!transaction?.type,
  });

  const rawCats = catData?.data?.data;
  const categories = Array.isArray(rawCats) ? rawCats : [];

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date());
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (transaction && !initialized) {
      setAmount(String(transaction.amount));
      setDescription(transaction.description || "");
      setCategoryId(transaction.categoryId);
      setDate(new Date(transaction.date));
      setInitialized(true);
    }
  }, [transaction, initialized]);

  const updateMutation = useMutation({
    mutationFn: () =>
      transactionsApi.update(id!, {
        amount: parseFloat(amount),
        categoryId,
        date: date.toISOString(),
        description: description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      router.back();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => transactionsApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      router.back();
    },
  });

  const handleDelete = () => {
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  const selectedCategory = categories.find((c: any) => c.id === categoryId);

  if (txLoading || !transaction) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Transaction</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        {/* Amount */}
        <View style={{ marginVertical: 5 }}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>

        {/* category */}
        <View style={{ marginVertical: 5 }}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            {selectedCategory ? (
              <View style={styles.pickerContent}>
                <Text>{selectedCategory.icon}</Text>
                <Text style={styles.pickerText}>{selectedCategory.name}</Text>
              </View>
            ) : (
              <Text style={styles.pickerPlaceholder}>Select category</Text>
            )}
            <Ionicons name="chevron-down" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Date */}
        <View style={{ marginVertical: 5 }}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.pickerButton}>
            <Text style={styles.pickerText}>
              {date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={{ marginVertical: 5 }}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            multiline
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginVertical: 20 }}>
        <CTAbutton
          title="Save Changes"
          onPress={() => updateMutation.mutate()}
          backgroundcolor="#007AFF"
          textColor="#FFFFFF"
          buttonColor="#FFFFFF"
        />

        <CTAbutton
          title="Delete Transaction"
          onPress={handleDelete}
          backgroundcolor="#FFF2F2"
          textColor="#FF3B30"
          buttonIcon="trash"
          buttonColor="#FF3B30"
          marginVertical={12}
        />
      </View>

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
              <Text style={styles.sheetTitle}>Select Category</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  title: { fontSize: 20, fontWeight: "600", color: "#000" },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    borderColor: "#D1D5DB",
    borderWidth: 1,
    marginVertical: 20,
  },
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
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  pickerText: { fontSize: 16, color: "#000" },
  pickerPlaceholder: { fontSize: 16, color: "#8E8E93" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
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
