import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { categoriesApi } from "@/src/api/categories.api";
import CTAbutton from "@/src/Components/CTAbutton";

const COLOR_OPTIONS = [
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#007AFF",
  "#5856D6",
  "#AF52DE",
  "#FF2D55",
  "#8E8E93",
  "#000000",
];

const EMOJI_OPTIONS = [
  "📦",
  "🍕",
  "🚗",
  "🛍️",
  "💼",
  "💻",
  "💰",
  "🏠",
  "🎮",
  "📚",
  "✈️",
  "🏋️",
  "🎵",
  "🍕",
  "💊",
  "🎁",
];

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["category", id],
    queryFn: () => categoriesApi.getOne(id),
  });

  const category = data?.data?.data;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#8E8E93");
  const initialized = useState(false);

  if (!initialized[0] && category) {
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    initialized[0] = true;
  }

  const updateMutation = useMutation({
    mutationFn: () => categoriesApi.update(id!, { name, icon, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", id] });
      router.back();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => categoriesApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", id] });
      router.back();
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  if (isLoading || !category) {
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
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Category</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Category name"
        />

        <Text style={styles.label}>Type</Text>
        <View
          style={[
            styles.typeBadge,
            category.type === "INCOME" ? styles.typeIncome : styles.typeExpense,
          ]}
        >
          <Text style={styles.typeBadgeText}>{category.type}</Text>
        </View>
        <Text style={styles.typeHint}>
          Type cannot be changed after creation
        </Text>

        <Text style={styles.label}>Icon</Text>
        <View style={styles.grid}>
          {EMOJI_OPTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiOption,
                icon === emoji && styles.emojiSelected,
              ]}
              onPress={() => setIcon(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Color</Text>
        <View style={styles.grid}>
          {COLOR_OPTIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorOption,
                { backgroundColor: c },
                color === c && styles.colorSelected,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>

      <CTAbutton
        title="Save Changes"
        onPress={() => updateMutation.mutate()}
        backgroundcolor="#007AFF"
        textColor="#FFFFFF"
        buttonIcon="checkmark"
        buttonColor="#FFFFFF"
      />

      <CTAbutton
        title="Delete Category"
        onPress={handleDelete}
        backgroundcolor="#FFF2F2"
        textColor="#FF3B30"
        buttonIcon="trash"
        buttonColor="#FF3B30"
        marginVertical={12}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  content: { paddingBottom: 40 },
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
  card: { backgroundColor: "#fff", margin: 16, borderRadius: 12, padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeIncome: { backgroundColor: "#34C75920" },
  typeExpense: { backgroundColor: "#FF3B3020" },
  typeBadgeText: { fontSize: 13, fontWeight: "600", color: "#000" },
  typeHint: { fontSize: 12, color: "#8E8E93", marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F7",
  },
  emojiSelected: {
    backgroundColor: "#007AFF20",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  emojiText: { fontSize: 22 },
  colorOption: { width: 40, height: 40, borderRadius: 20 },
  colorSelected: { borderWidth: 3, borderColor: "#000" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
});
