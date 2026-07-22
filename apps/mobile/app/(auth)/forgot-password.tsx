import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CTAbutton from "@/src/Components/CTAbutton";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/hooks/useAuth";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { forgotPassword, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const placeholder = require("../../assets/images/Login.png");

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to send reset code. Please try again.";
      setError(
        typeof message === "string"
          ? message
          : "Failed to send reset code. Please try again.",
      );
    }
  };

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
    >
      <Image source={placeholder} resizeMode="contain" style={styles.image} />

      <View style={styles.heading}>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          {sent
            ? `We've sent a 6-digit code to ${email}. Check your inbox and enter the code on the next screen.`
            : "No worries! Enter your email and we'll send you a code to reset your password."}
        </Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#FF3B30" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {sent ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#34C759" />
          <Text style={styles.successBannerText}>
            Reset code sent! Check your inbox.
          </Text>
        </View>
      ) : null}

      {!sent && (
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={25} color="#D1D5D8" />
          <TextInput
            placeholder="Email address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      )}

      {sent ? (
        <CTAbutton
          title="Enter Reset Code"
          backgroundcolor="#007AFF"
          onPress={() =>
            router.push({
              pathname: "/(auth)/reset-password",
              params: { email: email.trim() },
            })
          }
          marginVertical={10}
          textColor="#fff"
        />
      ) : (
        <CTAbutton
          title={isLoading ? "Sending..." : "Send Reset Code"}
          backgroundcolor="#007AFF"
          onPress={handleSendCode}
          marginVertical={10}
          textColor="#fff"
        />
      )}

      <CTAbutton
        buttonIcon="arrow-back"
        buttonColor="#007AFF"
        title="Back to login"
        borderColor="#D1D5DB"
        textColor="#007AFF"
        onPress={() => router.back()}
        borderWidth={1}
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    flex: 1,
  },
  contentContainer: {
    justifyContent: "center",
    paddingVertical: 50,
  },
  image: { height: 350, width: 350, alignSelf: "center" },
  heading: {
    gap: 10,
  },
  title: {
    textAlign: "center",
    fontSize: 27,
    fontWeight: "700",
  },
  subtitle: {
    color: "#666",
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 23,
  },
  inputWrapper: {
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  input: {
    padding: 12,
    fontSize: 16,
    flex: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF2F2",
    borderWidth: 1,
    borderColor: "#FFD4D4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  errorBannerText: {
    color: "#FF3B30",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF4",
    borderWidth: 1,
    borderColor: "#C6F6D5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  successBannerText: {
    color: "#34C759",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
});
