import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { CartesianChart, Bar } from "victory-native";
import { useApiClient } from "../../../lib/useApiClient";
import { Colors } from "../../../constants/Colors";
import { Typography, Spacing, Radius } from "../../../constants/Theme";
import type { InsightsMonthly } from "../../../types/subscription";

function twoDigits(n: number) {
  return String(n).padStart(2, "0");
}

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function InsightsScreen() {
  const { t } = useTranslation();
  const { request, ready } = useApiClient();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<InsightsMonthly | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData(y: number, m: number) {
    setLoading(true);
    try {
      const res = await request<InsightsMonthly>({
        method: "GET",
        url: `/insights/monthly?year=${y}&month=${m}`,
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (ready) loadData(year, month);
    }, [ready, year, month]),
  );

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    const isCurrentOrFuture =
      year > now.getFullYear() ||
      (year === now.getFullYear() && month >= now.getMonth() + 1);
    if (isCurrentOrFuture) return;
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  // victory-native v41 API: array of plain objects with numeric values
  const chartData = (data?.breakdown ?? []).map((item, index) => ({
    index: index + 1,
    value: parseFloat(item.cost),
  }));

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("insights.title")}</Text>
      </View>

      {/* Month navigator */}
      <View style={styles.monthNav}>
        <Pressable onPress={prevMonth} style={styles.navButton}>
          <Text style={styles.navArrow}>{"<"}</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {t("insights.month", { month: twoDigits(month), year })}
        </Text>
        <Pressable
          onPress={nextMonth}
          style={[styles.navButton, isCurrentMonth && styles.navButtonDisabled]}
          disabled={isCurrentMonth}
        >
          <Text
            style={[styles.navArrow, isCurrentMonth && styles.navArrowDisabled]}
          >
            {">"}
          </Text>
        </Pressable>
      </View>

      {/* Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>{t("insights.expenses")}</Text>
        {loading ? (
          <ActivityIndicator color={Colors.accent} />
        ) : (
          <Text style={styles.totalAmount}>
            {formatCOP(data?.totalCOP ?? 0)}
          </Text>
        )}
      </View>

      {/* Bar chart — victory-native v41 API */}
      {!loading && chartData.length > 0 && (
        <View style={styles.chartContainer}>
          <CartesianChart
            data={chartData}
            xKey="index"
            yKeys={["value"]}
            domainPadding={{ left: 20, right: 20 }}
            axisOptions={{
              labelColor: Colors.textMuted,
              lineColor: Colors.textMuted,
              tickCount: { x: chartData.length, y: 4 },
              formatYLabel: (v: number) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000
                    ? `${(v / 1_000).toFixed(0)}k`
                    : String(v),
            }}
          >
            {({ points, chartBounds }) => (
              <Bar
                points={points.value}
                chartBounds={chartBounds}
                color={Colors.accent}
                roundedCorners={{ topLeft: 4, topRight: 4 }}
              />
            )}
          </CartesianChart>
        </View>
      )}

      {/* Breakdown list */}
      {!loading && (data?.breakdown.length ?? 0) === 0 && (
        <Text style={styles.empty}>{t("home.noSubscriptions")}</Text>
      )}

      {!loading &&
        data?.breakdown.map((item) => (
          <View key={item.id} style={styles.breakdownRow}>
            <Text style={styles.breakdownName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.breakdownCost}>
              {formatCOP(parseFloat(item.cost))}
            </Text>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  header: { marginTop: Spacing.xl, marginBottom: Spacing.lg },
  title: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.base,
  },
  navButton: { padding: Spacing.sm },
  navButtonDisabled: { opacity: 0.3 },
  navArrow: {
    fontSize: Typography.sizes["2xl"],
    color: Colors.accent,
    fontWeight: Typography.weights.bold,
  },
  navArrowDisabled: { color: Colors.textMuted },
  monthLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  totalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    fontSize: Typography.sizes["3xl"],
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  chartContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    height: 220,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  breakdownName: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  breakdownCost: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semibold,
  },
  empty: {
    fontSize: Typography.sizes.base,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
