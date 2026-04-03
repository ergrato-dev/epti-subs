import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  LayoutAnimation,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApiClient } from "../../../lib/useApiClient";
import { SubscriptionCard } from "../../../components/SubscriptionCard";
import { Colors } from "../../../constants/Colors";
import { Typography, Spacing, Radius } from "../../../constants/Theme";
import type { Subscription } from "../../../types/subscription";

export default function SubscriptionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { request, ready } = useApiClient();

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function loadData() {
    try {
      const data = await request<Subscription[]>({
        method: "GET",
        url: "/subscriptions",
      });
      setSubs(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (ready) loadData();
    }, [ready]),
  );

  function toggleExpand(id: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function handleCancel(sub: Subscription) {
    const { Alert } = await import("react-native");
    Alert.alert(
      t("subscription.cancelConfirm", { name: sub.name }),
      t("subscription.cancelConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            await request({
              method: "DELETE",
              url: `/subscriptions/${sub.id}`,
            });
            loadData();
          },
        },
      ],
    );
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("subscription.title")}</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/(app)/subscription-form")}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {subs.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>{t("home.noSubscriptions")}</Text>
        </View>
      ) : (
        <FlatList
          data={subs}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View>
              <SubscriptionCard
                subscription={item}
                onPress={() => toggleExpand(item.id)}
              />
              {expandedId === item.id && (
                <View style={styles.expandedPanel}>
                  {item.planName ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>
                        {t("subscription.plan")}
                      </Text>
                      <Text style={styles.infoValue}>{item.planName}</Text>
                    </View>
                  ) : null}
                  {item.paymentLast4 ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>
                        {t("subscription.paymentLast4")}
                      </Text>
                      <Text style={styles.infoValue}>
                        •••• {item.paymentLast4}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.expandedActions}>
                    <Pressable
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() =>
                        router.push({
                          pathname: "/(app)/subscription-detail",
                          params: { id: item.id },
                        })
                      }
                    >
                      <Text style={styles.editBtnText}>{t("common.edit")}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.cancelBtn]}
                      onPress={() => handleCancel(item)}
                    >
                      <Text style={styles.cancelBtnText}>
                        {t("subscription.cancelSubscription")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.sizes["2xl"],
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
  list: {
    padding: Spacing.base,
    gap: Spacing.sm,
    paddingBottom: Spacing["3xl"],
  },
  empty: { fontSize: Typography.sizes.base, color: Colors.textMuted },
  expandedPanel: {
    backgroundColor: Colors.bgCardAlt,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    marginTop: -Radius.lg,
    paddingTop: Radius.lg + Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  infoValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  expandedActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  editBtn: { backgroundColor: Colors.accent },
  editBtnText: {
    color: "#fff",
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  cancelBtn: {
    backgroundColor: "rgba(239,68,68,0.15)",
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  cancelBtnText: {
    color: Colors.danger,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});
