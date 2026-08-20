import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { useState, useRef } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/src/hooks/useAuth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CTAbutton from "@/src/Components/CTAbutton";
import { useRouter, Link } from "expo-router";
import OAuthButton from "@/src/Components/(auth)/OAuthButton";
import StepIndicator from "@/src/Components/(auth)/StepIndicator";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/src/constants/theme";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const schema = Yup.object().shape({
  fullName: Yup.string(),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "At least 8 characters")
    .matches(/[A-Z]/, "Must contain an uppercase letter")
    .matches(/[0-9]/, "Must contain a number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
});

export default function RegisterScreen() {
  const { register, confirmAuth, verifyEmail, resendVerification, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{
    user: any;
    accessToken: string;
    refreshToken: string;
  } | null>(null);

  // Verification code state
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  const handleFormSubmit = async (values: any, { setSubmitting }: any) => {
    setError(null);
    try {
      const result = await register(
        values.email,
        values.password,
        values.fullName || undefined,
      );
      setPendingAuth(result);
      setCurrentStep(1);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Registration failed. Please try again.";
      setError(
        typeof message === "string"
          ? message
          : "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyNext = () => {
    setCurrentStep(2);
    setShowCompleteModal(true);
  };

  const handleComplete = async () => {
    if (pendingAuth) {
      await confirmAuth(
        pendingAuth.user,
        pendingAuth.accessToken,
        pendingAuth.refreshToken,
      );
    }
    setShowCompleteModal(false);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join("");
    if (code.length !== 6) {
      setVerifyError("Please enter the complete 6-digit code");
      return;
    }
    setVerifyError(null);
    setIsVerifying(true);
    try {
      await verifyEmail(pendingAuth!.user.email, code);
      handleVerifyNext();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || "Invalid or expired code";
      setVerifyError(typeof msg === "string" ? msg : "Invalid or expired code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendVerification(pendingAuth!.user.email);
      setResendCooldown(60);
      setVerificationCode(["", "", "", "", "", ""]);
      setVerifyError(null);
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
      setVerifyError("Failed to resend code. Please try again.");
    }
  };

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
    >
      <View style={styles.heading}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Let&apos;s get you started on your</Text>
        <Text style={{ color: "#007AFF", fontSize: 14, fontWeight: "600" }}>
          financial journey 🚀
        </Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#FF3B30" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <View style={styles.formCard}>
        <StepIndicator currentStep={currentStep} />

        {currentStep === 0 && (
          <Formik
            initialValues={{
              fullName: "",
              email: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={schema}
            onSubmit={handleFormSubmit}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View style={styles.formContent}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  placeholder="Enter your full names"
                  onChangeText={handleChange("fullName")}
                  onBlur={handleBlur("fullName")}
                  value={values.fullName}
                  style={[styles.input, { marginBottom: 5 }]}
                />
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  placeholder="Email"
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  value={values.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { marginBottom: 5 }]}
                />
                {touched.email && errors.email && (
                  <Text style={[styles.error, { marginBottom: 5 }]}>
                    {errors.email}
                  </Text>
                )}

                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Password"
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                    value={values.password}
                    secureTextEntry={!showPassword}
                    style={[styles.input, { paddingRight: 45 }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                {/* <PasswordStrengthMeter password={values.password} /> */}
                {touched.password && errors.password && (
                  <Text style={[styles.error, { marginBottom: 5 }]}>
                    {errors.password}
                  </Text>
                )}

                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Confirm Password"
                    onChangeText={handleChange("confirmPassword")}
                    onBlur={handleBlur("confirmPassword")}
                    value={values.confirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    style={[styles.input, { paddingRight: 45 }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                {touched.confirmPassword && errors.confirmPassword && (
                  <Text style={[styles.error, { marginBottom: 5 }]}>
                    {errors.confirmPassword}
                  </Text>
                )}

                <CTAbutton
                  title={isLoading ? "Creating account..." : "Register"}
                  onPress={handleSubmit}
                  textColor="#fff"
                  backgroundcolor="#007AFF"
                  marginVertical={15}
                />
              </View>
            )}
          </Formik>
        )}

        {currentStep === 1 && (
          <View style={styles.verifyContent}>
            <Ionicons
              name="mail-open-outline"
              size={60}
              color={Colors.light.primary}
            />
            <Text style={styles.verifyTitle}>Verify Your Email</Text>
            <Text style={styles.verifyText}>
              We sent a 6-digit code to{"\n"}
              <Text style={{ fontWeight: "600", color: "#000" }}>
                {pendingAuth?.user.email}
              </Text>
            </Text>

            <View style={styles.codeContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    codeInputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    verifyError && styles.codeInputError,
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

            {verifyError && (
              <View style={styles.verifyErrorBanner}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.verifyErrorText}>{verifyError}</Text>
              </View>
            )}

            <CTAbutton
              title={isVerifying ? "Verifying..." : "Verify"}
              onPress={handleVerify}
              textColor="#fff"
              backgroundcolor="#007AFF"
              marginVertical={10}
            />

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

            <TouchableOpacity onPress={() => setCurrentStep(0)}>
              <Text style={styles.verifyLink}>Back to Registration</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.seperatorContainer}>
        <View style={styles.seperator} />
        <Text style={styles.seperatorText}> Or continue with </Text>
        <View style={styles.seperator} />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginVertical: 5,
        }}
      >
        <OAuthButton title="Continue with Google" buttonWidth={200} />
        <OAuthButton title="Continue with Facebook" buttonWidth={200} />
      </View>

      <View style={styles.linkContainer}>
        <Text style={{ color: "#666", fontSize: 14 }}>
          Already have an account?{" "}
        </Text>
        <Link href={"/(auth)/login"} style={styles.link}>
          Log In
        </Link>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#34C759" />
            </View>
            <Text style={styles.modalTitle}>Registration Complete!</Text>
            <Text style={styles.modalText}>
              Your account has been created successfully. Welcome to Budget
              Tracker!
            </Text>
            <CTAbutton
              title="Get Started"
              onPress={handleComplete}
              textColor="#fff"
              backgroundcolor="#007AFF"
              marginVertical={10}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: "#fff" },
  heading: {
    gap: 5,
    paddingVertical: 10,
  },
  title: {
    fontSize: 27,
    paddingBottom: 5,
    fontWeight: "700",
  },
  subtitle: {
    color: "#666",
    fontSize: 15,
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
  label: {
    fontWeight: "600",
    color: "#000",
    paddingBottom: 3,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formContent: {
    paddingTop: 5,
  },
input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 5,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  error: { color: "#FF3B30", fontSize: 12, marginBottom: 5 },
  seperatorContainer: {
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: 10,
    gap: 2,
  },
  seperator: {
    height: 1,
    backgroundColor: "#ccc",
    width: "34%",
    borderWidth: 1,
  },
  seperatorText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
  linkContainer: {
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
  },
  link: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "600",
  },
  verifyContent: {
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  verifyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },
  verifyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  verifyLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 20,
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
  verifyErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF2F2",
    borderWidth: 1,
    borderColor: "#FFD4D4",
    borderRadius: 8,
    padding: 10,
    gap: 6,
    width: "100%",
  },
  verifyErrorText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
});
