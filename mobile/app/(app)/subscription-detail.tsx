import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApiClient } from "../../lib/useApiClient";
import { trackSubscriptionDeleted } from "../../lib/posthog";
import { Colors } from "../../constants/Colors";
import { Typography, Spacing, Radius } from "../../constants/Theme";
import type { Subscription } from "../../types/subscription";

function formatCOP(amount: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "COP" ? 0 : 2,
  }).format(amount);
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SubscriptionDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { request, ready } = useApiClient();

  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      request<Subscription>({ method: "GET", url: `/subscriptions/${id}` })
        .then(setSub)
        .finally(() => setLoading(false));
    }, [ready, id]),
  );

  async function handleDelete() {
    if (!sub) return;
    Alert.alert(
      t("subscription.cancelConfirm", { name: sub.name }),
      t("subscription.cancelConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            await request({ method: "DELETE", url: `/subscriptions/${id}` });
            if (sub) trackSubscriptionDeleted(sub.name);
            router.back();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  if (!sub) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{t("common.error")}</Text>
      </View>
    );
  }

  const days = daysUntil(sub.nextPaymentDate);

  return (
    <View style={styles.container}>
      {/* ── Nav bar ── */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {sub.name}
        </Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(app)/subscription-form",
              params: { id: sub.id },
            })
          }
        >
          <Text style={styles.editLink}>{t("common.edit")}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Hero card ── */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: sub.color ?? Colors.accent },
          ]}
        >
          <Text style={styles.heroName}>{sub.name}</Text>
          <Text style={styles.heroCost}>
            {formatCOP(parseFloat(sub.cost), sub.currency)}
          </Text>
          <Text style={styles.heroCycle}>
            {t(`common.${sub.billingCycle}`).toLowerCase()}
          </Text>
        </View>

        {/* ── Upcoming badge ── */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {days === 0
              ? "Hoy"
              : days < 0
                ? "Vencido"
                : t("common.daysLeft", { count: days })}
          </Text>
        </View>

        {/* ── Info rows ── */}
        <View style={styles.infoCard}>
          {sub.planName ? (
            <InfoRow label={t("subscription.plan")} value={sub.planName} />
          ) : null}
          {sub.paymentLast4 ? (
            <InfoRow
              label={t("subscription.paymentLast4")}
              value={`•••• ${sub.paymentLast4}`}
            />
          ) : null}
          <InfoRow
            label={t("subscription.nextPayment")}
            value={new Date(sub.nextPaymentDate).toLocaleDateString("es-CO")}
          />
          <InfoRow
            label={t("subscription.currency")}
            value={sub.currency}
            last
          />
        </View>

        {/* ── Delete ── */}
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>
            {t("subscription.cancelSubscription")}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: Colors.danger, fontSize: Typography.sizes.base },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.xs },
  backText: {
    fontSize: Typography.sizes["2xl"],
    color: Colors.accent,
    fontWeight: Typography.weights.bold,
  },
  navTitle: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  editLink: {
    fontSize: Typography.sizes.base,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  scroll: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  heroName: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold,
    color: "#fff",
  },
  heroCost: {
    fontSize: Typography.sizes["4xl"],
    fontWeight: Typography.weights.bold,
    color: "#fff",
    marginTop: Spacing.sm,
  },
  heroCycle: {
    fontSize: Typography.sizes.sm,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },
  badge: {
    alignSelf: "flex-end",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.base,
  },
  badgeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.base,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  infoLabel: { fontSize: Typography.sizes.base, color: Colors.textMuted },
  infoValue: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  deleteBtn: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: "center",
  },
  deleteText: {
    color: Colors.danger,
    fontWeight: Typography.weights.semibold,
    fontSize: Typography.sizes.base,
  },
});
