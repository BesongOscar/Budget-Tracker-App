import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import CTAbutton from "@/src/Components/CTAbutton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OAuthButton from "@/src/Components/(auth)/OAuthButton";
import { Ionicons } from "@expo/vector-icons";

const schema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.heading}>
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>Log in to continue to your account</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#FF3B30" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          setError(null);
          try {
            await login(values.email, values.password);
          } catch (e: any) {
            const message =
              e?.response?.data?.message ||
              e?.message ||
              "Login failed. Please try again.";
            setError(
              typeof message === "string"
                ? message
                : "Login failed. Please try again.",
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
        }) => (
          <View style={{ marginTop: 10 }}>
            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 5,
                },
              ]}
            >
              <Ionicons name="mail-outline" size={25} color={"#D1D5DB"} />
              <TextInput
                placeholder="Email address"
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                value={values.email}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { marginLeft: 5 }]}
              />
            </View>
            {touched.email && errors.email && (
              <Text style={[styles.error, { marginBottom: 5 }]}>
                {errors.email}
              </Text>
            )}

            {/* password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 5,
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={25}
                  color={"#D1D5DB"}
                />
                <TextInput
                  placeholder="Password"
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { paddingRight: 30, marginLeft: 5 }]}
                />
              </View>
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
            {touched.password && errors.password && (
              <Text style={[styles.error, { marginBottom: 5 }]}>
                {errors.password}
              </Text>
            )}

            <Link href={"/(auth)/forgot-password"} style={styles.forgot}>
              <Text>Forgot Password?</Text>
            </Link>

            <CTAbutton
              title={isLoading ? "Logging in..." : "Log In"}
              textColor="#fff"
              backgroundcolor="#007AFF"
              onPress={handleSubmit}
              marginVertical={10}
            />

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
                marginVertical: 10,
              }}
            >
              <OAuthButton title="Continue with Google" buttonWidth={200} />
              <OAuthButton title="Continue with Facebook" buttonWidth={200} />
            </View>

            <View style={styles.linkContainer}>
              <Text style={{ color: "#666", fontSize: 14 }}>
                Don&apos;t have an account?{" "}
              </Text>
              <Link href={"/(auth)/register"} style={styles.link}>
                Sign up
              </Link>
            </View>
          </View>
        )}
      </Formik>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: "#fff" },
  heading: {
    gap: 5,
    paddingVertical: 20,
  },
  title: {
    fontSize: 27,
    fontWeight: "700",
  },
  subtitle: {
    color: "#666",
    fontSize: 15,
  },
  label: {
    fontWeight: "600",
    color: "#000",
    paddingBottom: 3,
  },
  // InputContainer: {
  //   width: "100%",
  //   flexDirection: "row",
  //   alignItems: "center",
  //   backgroundColor: "#fff",
  //   borderRadius: 8,
  //   paddingHorizontal: 16,
  //   justifyContent: "flex-start",
  //   marginBottom: 10,
  //   borderWidth: 1,
  //   borderColor: "#D1D5DB",
  // },
  inputWrapper: {
    position: "relative",
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  input: {
    borderColor: "#D1D5DB",
    fontSize: 16,
    color: "#000",
    paddingHorizontal: 5,
  },
  error: { color: "#FF3B30", fontSize: 12, marginBottom: 5 },
  forgot: {
    color: "#007AFF",
    textAlign: "right",
    marginBottom: 16,
    marginTop: 5,
    fontWeight: "600",
  },
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
});
