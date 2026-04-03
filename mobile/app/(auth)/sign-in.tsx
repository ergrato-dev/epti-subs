import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Colors } from "../../constants/Colors";
import { Typography, Spacing, Radius } from "../../constants/Theme";

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(app)/(tabs)/home");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("common.error");
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.appName}>Epti Subs</Text>
          <Text style={styles.appTagline}>SMART BILLING</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{t("auth.welcomeBack")}</Text>
          <Text style={styles.subtitle}>{t("auth.signInSubtitle")}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("auth.email")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("auth.emailPlaceholder")}
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("auth.password")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("auth.passwordPlaceholder")}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t("auth.signIn")}</Text>
            )}
          </Pressable>

          <Text style={styles.footer}>
            {t("auth.noAccount", { link: "" })}{" "}
            <Link href="/(auth)/sign-up" style={styles.link}>
              {t("auth.createAccount")}
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing["3xl"],
    gap: Spacing.xl,
  },
  header: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold,
    color: "#fff",
  },
  appName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  appTagline: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing["2xl"],
    gap: Spacing.base,
  },
  title: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.base,
    borderRadius: Radius.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: "#fff",
  },
  footer: {
    textAlign: "center",
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  link: {
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
});
