import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/src/store/authStore";
import { useOfflineQueueStore } from "@/src/store/offlineQueueStore";
import { useNetwork } from "@/src/hooks/useNetwork";
import { usersApi } from "@/src/api/users.api";
import CTAbutton from "@/src/Components/CTAbutton";
import { useCurrencyStore } from "@/src/store/currencyStore";

const CURRENCIES: { code: string; label: string; symbol: string }[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "XAF", label: "CFA Franc", symbol: "FCFA" },
  { code: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { code: "GHS", label: "Ghanaian Cedi", symbol: "₵" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const { isOffline } = useNetwork();
  const enqueue = useOfflineQueueStore((s) => s.enqueue);
  const { currencyCode, setCurrency } = useCurrencyStore();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const currency = currencyCode || user?.currencyCode || "USD";

  const initials = (user?.fullName ?? user?.email ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const save = async () => {
    if (!fullName.trim()) {
      Alert.alert("Name required", "Please enter your full name.");
      return;
    }
    // Offline: queue the profile update and reflect it locally right away.
    if (isOffline) {
      enqueue({
        kind: "profile",
        action: "update",
        payload: { fullName: fullName.trim() },
      });
      setUser({ ...(user as any), fullName: fullName.trim() });
      setEditing(false);
      Alert.alert(
        "Name queued",
        "Your name will be saved when you're back online.",
      );
      return;
    }
    setSaving(true);
    try {
      const res = await usersApi.updateProfile({ fullName: fullName.trim() });
      const updated = res.data.data;
      setUser(updated);
      setEditing(false);
      Alert.alert("Saved", "Profile updated");
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.error?.message || e?.message);
    } finally {
      setSaving(false);
    }
  };

  const pickCurrency = () => {
    Alert.alert("Currency", "Choose your currency", [
      ...CURRENCIES.map((c) => ({
        text: `${c.symbol} ${c.label}`,
        onPress: async () => {
          // Support offline: restrict notification toggle; currency writes go to the outbox.
          if (isOffline) {
            enqueue({
              kind: "profile",
              action: "update",
              payload: { currencyCode: c.code },
            });
            setCurrency(c.code);
            Alert.alert(
              "Currency queued",
              `${c.label} (${c.code}) will be saved when you're back online.`,
            );
            return;
          }
          try {
            const res = await usersApi.updateProfile({ currencyCode: c.code });
            setUser(res.data.data);
            setCurrency(c.code);
            Alert.alert(
              "Currency updated",
              `Now showing ${c.label} (${c.code})`,
            );
          } catch (e: any) {
            Alert.alert(
              "Failed",
              e?.response?.data?.error?.message || e?.message,
            );
          }
        },
      })),
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Notification toggle uses existing push-token registration.
  const toggleNotifications = () => {
    Alert.alert(
      "Notifications",
      "Push notifications are managed during onboarding. A test can be sent from here.",
      [
        {
          text: "Send test",
          onPress: async () => {
            try {
              await usersApi.sendTestPush();
              Alert.alert("Sent", "Test push sent");
            } catch (e: any) {
              Alert.alert(
                "Failed",
                e?.response?.data?.error?.message || e?.message,
              );
            }
          },
        },
        { text: "Close", style: "cancel" },
      ],
    );
  };

  const Row = ({ icon, title, value, onPress }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#007AFF" />
      <Text style={styles.rowText}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
    </TouchableOpacity>
  );
  return (
    <View style={[styles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              width: "100%",
              paddingLeft: 10,
              gap: 20,
              borderRadius: 10,
              borderColor: "#ccc",
            }}
          >
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
            {/* User Info */}
            <View style={{ flexDirection: "column" }}>
              <Text style={styles.name}>
                {user?.fullName || "Add your name"}
              </Text>
              <Text style={styles.email}>{user?.email}</Text>
              {editing ? (
                <View style={styles.editBox}>
                  <Text style={styles.label}>Full name</Text>
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Your full name"
                    autoCapitalize="words"
                  />
                  <CTAbutton
                    title="Save"
                    onPress={save}
                    backgroundcolor="#007AFF"
                    textColor="#FFF"
                    marginVertical={12}
                    disabled={saving}
                  />
                </View>
              ) : (
                <CTAbutton
                  title="Edit Profile"
                  onPress={() => setEditing(true)}
                  backgroundcolor="#007AFF"
                  textColor="#FFF"
                  marginVertical={20}
                />
              )}
            </View>
          </View>

          {/* <TouchableOpacity
            style={styles.row}
            onPress={() => router.push("/(protected)/(Profile)/settings")}
          >
            <Ionicons name="settings-outline" size={22} color="#007AFF" />
            <Text style={styles.rowText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity> */}
          <View
            style={{
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#ccc",
              width: "100%",
              paddingHorizontal: 10,
              marginVertical: 20,
            }}
          >
            <Row
              icon="cash-outline"
              title="Currency"
              value={currency}
              onPress={pickCurrency}
            />
            <Row
              icon="notifications-outline"
              title="Notifications"
              value=""
              onPress={toggleNotifications}
            />
            <Row
              icon="lock-closed-outline"
              title="Security"
              value=""
              onPress={() => router.push("/(auth)/forgot-password")}
            />
            <Row
              icon="pricetags-outline"
              title="Categories"
              value=""
              onPress={() => router.push("/(protected)/(Profile)/categories")}
            />
            <Row
              icon="help-circle-outline"
              title="Help"
              value=""
              onPress={() => Alert.alert("Help", "Contact support@example.com")}
            />
          </View>

          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              padding: 12,
              width: "100%",
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
            }}
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            <Text style={[styles.rowText, { color: "#FF3B30" }]}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { paddingHorizontal: 15, alignItems: "center", marginTop: 20 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: "#FFF", fontSize: 34, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700", color: "#000", marginTop: 14 },
  email: { fontSize: 14, color: "#8E8E93", marginTop: 4 },
  editBox: { alignSelf: "stretch", marginTop: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#000", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  rowText: { fontSize: 16, color: "#000", flex: 1 },
  value: { fontSize: 14, color: "#8E8E93" },
});
