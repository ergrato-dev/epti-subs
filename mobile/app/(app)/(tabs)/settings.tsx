import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import i18n from "../../../lib/i18n";
import { useUserPrefs } from "../../../lib/useUserPrefs";
import { useApiClient } from "../../../lib/useApiClient";
import {
  schedulePaymentReminders,
  cancelAllReminders,
  requestNotificationPermission,
} from "../../../lib/notifications";
import { Colors } from "../../../constants/Colors";
import { Typography, Spacing, Radius } from "../../../constants/Theme";
import type { Subscription } from "../../../types/subscription";

const CURRENCIES = ["COP", "USD", "EUR", "MXN", "BRL"];
const DAYS_OPTIONS = [1, 3, 5, 7];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const {
    prefs,
    loaded,
    setCurrency,
    setNotificationsEnabled,
    setNotifyDaysBefore,
  } = useUserPrefs();
  const { request, ready } = useApiClient();
  const currentLang = i18n.language?.startsWith("en") ? "en" : "es";

  async function handleSignOut() {
    Alert.alert(t("settings.signOut"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.signOut"),
        style: "destructive",
        onPress: async () => {
          await cancelAllReminders();
          await signOut();
          router.replace("/(auth)/onboarding");
        },
      },
    ]);
  }

  function toggleLanguage() {
    const next = currentLang === "es" ? "en" : "es";
    i18n.changeLanguage(next);
  }

  async function handleToggleNotifications(value: boolean) {
    await setNotificationsEnabled(value);
    if (!value) {
      await cancelAllReminders();
      return;
    }
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        t("settings.notifications"),
        "Activa los permisos en Ajustes del sistema",
      );
      await setNotificationsEnabled(false);
      return;
    }
    await reschedule(prefs.notifyDaysBefore);
  }

  async function handleDaysChange(days: number) {
    await setNotifyDaysBefore(days);
    if (prefs.notificationsEnabled) await reschedule(days);
  }

  async function reschedule(days: number) {
    if (!ready) return;
    const subs = await request<Subscription[]>({
      method: "GET",
      url: "/subscriptions",
    });
    await schedulePaymentReminders(
      subs.map((s) => ({
        id: s.id,
        name: s.name,
        nextPaymentDate: s.nextPaymentDate,
      })),
      days,
    );
  }

  if (!loaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("settings.title")}</Text>

      {/* ── Profile ── */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(
              user?.firstName?.[0] ??
              user?.emailAddresses[0]?.emailAddress[0] ??
              "U"
            ).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>
            {user?.firstName
              ? `${user.firstName} ${user.lastName ?? ""}`.trim()
              : user?.emailAddresses[0]?.emailAddress}
          </Text>
          {user?.firstName ? (
            <Text style={styles.profileEmail}>
              {user.emailAddresses[0]?.emailAddress}
            </Text>
          ) : null}
        </View>
      </View>

      {/* ── Currency ── */}
      <Text style={styles.sectionLabel}>{t("settings.defaultCurrency")}</Text>
      <View style={styles.chipRow}>
        {CURRENCIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, prefs.currency === c && styles.chipActive]}
            onPress={() => setCurrency(c)}
          >
            <Text
              style={[
                styles.chipText,
                prefs.currency === c && styles.chipTextActive,
              ]}
            >
              {c}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Notifications ── */}
      <Text style={styles.sectionLabel}>{t("settings.notifications")}</Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{t("settings.notifications")}</Text>
        <Switch
          value={prefs.notificationsEnabled}
          onValueChange={handleToggleNotifications}
          trackColor={{ false: Colors.bgCardAlt, true: Colors.accent }}
          thumbColor="#fff"
        />
      </View>

      {prefs.notificationsEnabled && (
        <View style={styles.chipRow}>
          {DAYS_OPTIONS.map((d) => (
            <Pressable
              key={d}
              style={[
                styles.chip,
                prefs.notifyDaysBefore === d && styles.chipActive,
              ]}
              onPress={() => handleDaysChange(d)}
            >
              <Text
                style={[
                  styles.chipText,
                  prefs.notifyDaysBefore === d && styles.chipTextActive,
                ]}
              >
                {t("settings.notifyDaysBefore", { count: d })}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* ── Language ── */}
      <Text style={styles.sectionLabel}>{t("settings.language")}</Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>
          {currentLang === "es" ? "Español" : "English"}
        </Text>
        <Pressable style={styles.langToggle} onPress={toggleLanguage}>
          <Text style={styles.langToggleText}>
            {currentLang === "es" ? "Switch to EN" : "Cambiar a ES"}
          </Text>
        </Pressable>
      </View>

      {/* ── Sign out ── */}
      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>{t("settings.signOut")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.base,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: "#fff",
  },
  profileName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: {
    borderColor: Colors.accent,
    backgroundColor: "rgba(6,182,212,0.12)",
  },
  chipText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  chipTextActive: {
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  rowLabel: { fontSize: Typography.sizes.base, color: Colors.textPrimary },
  langToggle: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
  },
  langToggleText: {
    fontSize: Typography.sizes.sm,
    color: "#fff",
    fontWeight: Typography.weights.semibold,
  },
  signOutBtn: {
    marginTop: Spacing.xl,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: "center",
  },
  signOutText: {
    color: Colors.danger,
    fontWeight: Typography.weights.semibold,
    fontSize: Typography.sizes.base,
  },
});
