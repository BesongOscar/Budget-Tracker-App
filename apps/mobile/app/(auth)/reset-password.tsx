import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CTAbutton from "@/src/Components/CTAbutton";
import { useAuth } from "@/src/hooks/useAuth";
import { Colors } from "@/src/constants/theme";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const insets = useSafeAreaInsets();
  const { resetPassword, resendVerification, isLoading } = useAuth();

  // Code input state
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cleanup cooldown on unmount
  useEffect(() => {
    return () => {};
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    const codeStr = code.join("");
    if (codeStr.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    if (!newPassword) {
      setError("New password is required");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain an uppercase letter");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError("Password must contain a number");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
    try {
      await resetPassword(email!, codeStr, newPassword);
      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 2000);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || "Invalid or expired code";
      setError(typeof msg === "string" ? msg : "Invalid or expired code");
    }
  };

  const handleResendCode = async () => {
    try {
      await resendVerification(email!);
      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
      setError(null);
      codeInputRefs.current[0]?.focus();
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("Failed to resend code. Please try again.");
    }
  };

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
    >
      <View style={styles.heading}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{"\n"}
          <Text style={{ fontWeight: "600", color: "#000" }}>{email}</Text>
        </Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#FF3B30" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {success && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#34C759" />
          <Text style={styles.successBannerText}>{success}</Text>
        </View>
      )}

      <View style={styles.formCard}>
        <Text style={styles.label}>Verification Code</Text>
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                codeInputRefs.current[index] = ref;
              }}
              style={[
                styles.codeInput,
                error && styles.codeInputError,
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(index, value)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(index, nativeEvent.key)
              }
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <View style={styles.resendContainer}>
          <Text style={{ color: "#666", fontSize: 13 }}>
            Didn't receive the code?{" "}
          </Text>
          {resendCooldown > 0 ? (
            <Text style={{ color: "#999", fontSize: 13 }}>
              Resend in {resendCooldown}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.verifyLink}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>New Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="New password"
            style={[styles.input, { paddingRight: 45 }]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(!showNewPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showNewPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Confirm new password"
            style={[styles.input, { paddingRight: 45 }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        <CTAbutton
          title={isLoading ? "Resetting..." : "Reset Password"}
          onPress={handleResetPassword}
          textColor="#fff"
          backgroundcolor="#007AFF"
          marginVertical={15}
        />
      </View>

      <CTAbutton
        title="Back to login"
        borderColor="#D1D5DB"
        textColor="#007AFF"
        onPress={() => router.replace("/(auth)/login")}
        borderWidth={1}
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  heading: {
    gap: 5,
    paddingVertical: 10,
  },
  title: {
    fontSize: 27,
    fontWeight: "700",
  },
  subtitle: {
    color: "#666",
    fontSize: 15,
    lineHeight: 22,
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
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontWeight: "600",
    color: "#000",
    paddingBottom: 3,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 12,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
  },
  codeInputError: {
    borderColor: "#FF3B30",
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  verifyLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
  },
});
