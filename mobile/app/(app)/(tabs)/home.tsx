import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";
import { useApiClient } from "../../../lib/useApiClient";
import { useUserPrefs } from "../../../lib/useUserPrefs";
import { SubscriptionCard } from "../../../components/SubscriptionCard";
import { trackScreenView } from "../../../lib/posthog";
import { Colors } from "../../../constants/Colors";
import { Typography, Spacing, Radius } from "../../../constants/Theme";
import type { Subscription } from "../../../types/subscription";

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "COP" ? 0 : 2,
  }).format(amount);
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();
  const { request, ready } = useApiClient();
  const { prefs } = useUserPrefs();

  const [upcoming, setUpcoming] = useState<Subscription[]>([]);
  const [all, setAll] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();

  async function loadData() {
    try {
      const [upcomingData, allData] = await Promise.all([
        request<Subscription[]>({
          method: "GET",
          url: "/subscriptions/upcoming",
        }),
        request<Subscription[]>({ method: "GET", url: "/subscriptions" }),
      ]);
      setUpcoming(upcomingData);
      setAll(allData);
      const sum = allData
        .filter((s) => s.currency === prefs.currency)
        .reduce((acc, s) => acc + parseFloat(s.cost), 0);
      setTotal(sum);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (ready) {
      loadData();
      trackScreenView("home");
    }
  }, [ready, prefs.currency]);

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  const firstName =
    user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? "";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent}
        />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {t("home.greeting", { name: firstName })}
          </Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/(app)/subscription-form")}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {/* ── Balance card ── */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t("common.balance")}</Text>
        <Text style={styles.balanceAmount}>
          {formatAmount(total, prefs.currency)}
        </Text>
        <Text style={styles.balanceDate}>
          {String(now.getMonth() + 1).padStart(2, "0")}/
          {String(now.getFullYear()).slice(2)}
        </Text>
      </View>

      {/* ── Upcoming ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("common.upcoming")}</Text>
        <Pressable onPress={() => router.push("/(app)/(tabs)/subscriptions")}>
          <Text style={styles.viewAll}>{t("common.viewAll")}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator
          color={Colors.accent}
          style={{ marginVertical: Spacing.xl }}
        />
      ) : upcoming.length === 0 ? (
        <Text style={styles.empty}>{t("home.noUpcoming")}</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.upcomingRow}
        >
          {upcoming.slice(0, 5).map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              compact
              onPress={() =>
                router.push({
                  pathname: "/(app)/subscription-detail",
                  params: { id: sub.id },
                })
              }
            />
          ))}
        </ScrollView>
      )}

      {/* ── All Subscriptions ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("common.allSubscriptions")}</Text>
        <Pressable onPress={() => router.push("/(app)/(tabs)/subscriptions")}>
          <Text style={styles.viewAll}>{t("common.viewAll")}</Text>
        </Pressable>
      </View>

      {loading ? null : all.length === 0 ? (
        <Text style={styles.empty}>{t("home.noSubscriptions")}</Text>
      ) : (
        all.slice(0, 4).map((sub) => (
          <SubscriptionCard
            key={sub.id}
            subscription={sub}
            onPress={() =>
              router.push({
                pathname: "/(app)/subscription-detail",
                params: { id: sub.id },
              })
            }
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: Typography.sizes["2xl"],
    color: "#fff",
    lineHeight: 28,
  },
  balanceCard: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  balanceLabel: {
    fontSize: Typography.sizes.sm,
    color: "rgba(255,255,255,0.75)",
    fontWeight: Typography.weights.medium,
  },
  balanceAmount: {
    fontSize: Typography.sizes["4xl"],
    fontWeight: Typography.weights.bold,
    color: "#fff",
    marginVertical: Spacing.xs,
  },
  balanceDate: {
    fontSize: Typography.sizes.sm,
    color: "rgba(255,255,255,0.7)",
    alignSelf: "flex-end",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  viewAll: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  upcomingRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  empty: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: "center",
    marginVertical: Spacing.xl,
  },
});
