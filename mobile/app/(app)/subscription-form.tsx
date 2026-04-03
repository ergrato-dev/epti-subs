import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApiClient } from "../../lib/useApiClient";
import { trackSubscriptionCreated } from "../../lib/posthog";
import { Colors } from "../../constants/Colors";
import { Typography, Spacing, Radius } from "../../constants/Theme";
import type { BillingCycle, Subscription } from "../../types/subscription";

const BILLING_CYCLES: BillingCycle[] = [
  "monthly",
  "yearly",
  "quarterly",
  "weekly",
  "daily",
];
const CURRENCIES = ["COP", "USD", "EUR", "MXN", "BRL"];
// Paleta de 20 colores — fuente de verdad en constants/Colors.ts
const CARD_COLORS = Colors.subscriptionColors;

interface FormState {
  name: string;
  cost: string;
  currency: string;
  billingCycle: BillingCycle;
  nextPaymentDate: string;
  planName: string;
  paymentLast4: string;
  color: string;
  logoUrl: string;
}

const INITIAL: FormState = {
  name: "",
  cost: "",
  currency: "COP",
  billingCycle: "monthly",
  nextPaymentDate: new Date().toISOString().slice(0, 10),
  planName: "",
  paymentLast4: "",
  color: CARD_COLORS[0],
  logoUrl: "",
};

export default function SubscriptionFormScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { request, ready } = useApiClient();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Estado de los indicadores de scroll del picker de colores
  const [colorScroll, setColorScroll] = useState({ atStart: true, atEnd: false });
  const colorContentW = useRef(0);
  const colorContainerW = useRef(0);
  function handleColorScroll(x: number) {
    setColorScroll({
      atStart: x <= 2,
      atEnd:
        colorContentW.current > 0 &&
        x >= colorContentW.current - colorContainerW.current - 2,
    });
  }

  useFocusEffect(
    useCallback(() => {
      if (!isEdit || !ready) return;
      request<Subscription>({
        method: "GET",
        url: `/subscriptions/${id}`,
      }).then((sub) => {
        setForm({
          name: sub.name,
          cost: sub.cost,
          currency: sub.currency,
          billingCycle: sub.billingCycle,
          nextPaymentDate: sub.nextPaymentDate.slice(0, 10),
          planName: sub.planName ?? "",
          paymentLast4: sub.paymentLast4 ?? "",
          color: sub.color ?? CARD_COLORS[0],
          logoUrl: sub.logoUrl ?? "",
        });
        setLoading(false);
      });
    }, [ready, id]),
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.cost.trim()) {
      Alert.alert(t("common.error"), "Nombre y costo son requeridos");
      return;
    }
    const costNum = parseFloat(form.cost.replace(",", "."));
    if (isNaN(costNum) || costNum <= 0) {
      Alert.alert(t("common.error"), "Costo inválido");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        cost: costNum,
        currency: form.currency,
        billingCycle: form.billingCycle,
        nextPaymentDate: form.nextPaymentDate,
        planName: form.planName.trim() || null,
        paymentLast4: form.paymentLast4.trim() || null,
        color: form.color,
        logoUrl: form.logoUrl.trim() || null,
      };
      if (isEdit) {
        await request({
          method: "PUT",
          url: `/subscriptions/${id}`,
          data: payload,
        });
      } else {
        await request({ method: "POST", url: "/subscriptions", data: payload });
        trackSubscriptionCreated(payload.name, payload.billingCycle);
      }
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("common.retry"));
    } finally {
      setSaving(false);
    }
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
      {/* ── Nav ── */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>
          {isEdit ? t("common.edit") : t("subscription.add")}
        </Text>
        <Pressable onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={Colors.accent} />
          ) : (
            <Text style={styles.saveLink}>{t("common.save")}</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <Label>{t("subscription.name")}</Label>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => set("name", v)}
          placeholder={t("subscription.namePlaceholder")}
          placeholderTextColor={Colors.textMuted}
        />

        {/* Cost */}
        <Label>{t("subscription.cost")}</Label>
        <TextInput
          style={styles.input}
          value={form.cost}
          onChangeText={(v) => set("cost", v)}
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
        />

        {/* Currency */}
        <Label>{t("subscription.currency")}</Label>
        <View style={styles.chipRow}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.chip, form.currency === c && styles.chipActive]}
              onPress={() => set("currency", c)}
            >
              <Text
                style={[
                  styles.chipText,
                  form.currency === c && styles.chipTextActive,
                ]}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Billing Cycle */}
        <Label>{t("subscription.billingCycle")}</Label>
        <View style={styles.chipRow}>
          {BILLING_CYCLES.map((c) => (
            <Pressable
              key={c}
              style={[
                styles.chip,
                form.billingCycle === c && styles.chipActive,
              ]}
              onPress={() => set("billingCycle", c)}
            >
              <Text
                style={[
                  styles.chipText,
                  form.billingCycle === c && styles.chipTextActive,
                ]}
              >
                {t(`common.${c}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Next Payment Date */}
        <Label>{t("subscription.nextPayment")}</Label>
        <TextInput
          style={styles.input}
          value={form.nextPaymentDate}
          onChangeText={(v) => set("nextPaymentDate", v)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numbers-and-punctuation"
        />

        {/* Plan Name */}
        <Label>{t("subscription.plan")}</Label>
        <TextInput
          style={styles.input}
          value={form.planName}
          onChangeText={(v) => set("planName", v)}
          placeholder={t("subscription.planPlaceholder")}
          placeholderTextColor={Colors.textMuted}
        />

        {/* Payment last4 */}
        <Label>{t("subscription.paymentLast4")}</Label>
        <TextInput
          style={styles.input}
          value={form.paymentLast4}
          onChangeText={(v) =>
            set("paymentLast4", v.replace(/\D/g, "").slice(0, 4))
          }
          placeholder="1234"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
          maxLength={4}
        />

        {/* Color */}
        <Label>Color</Label>
        <View style={styles.colorPickerWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            style={styles.colorScroll}
            contentContainerStyle={styles.colorRow}
            onScroll={(e) => handleColorScroll(e.nativeEvent.contentOffset.x)}
            onContentSizeChange={(w) => {
              colorContentW.current = w;
              handleColorScroll(0);
            }}
            onLayout={(e) => {
              colorContainerW.current = e.nativeEvent.layout.width;
            }}
          >
            {CARD_COLORS.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  form.color === c && styles.colorDotActive,
                ]}
                onPress={() => set("color", c)}
              />
            ))}
          </ScrollView>
          {!colorScroll.atStart && (
            <View style={[styles.colorArrow, styles.colorArrowLeft]} pointerEvents="none">
              <Text style={styles.colorArrowText}>‹</Text>
            </View>
          )}
          {!colorScroll.atEnd && (
            <View style={[styles.colorArrow, styles.colorArrowRight]} pointerEvents="none">
              <Text style={styles.colorArrowText}>›</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={labelStyles.text}>{children}</Text>;
}

const labelStyles = StyleSheet.create({
  text: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
    marginTop: Spacing.base,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  saveLink: {
    fontSize: Typography.sizes.base,
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
  scroll: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
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
  colorPickerWrapper: {
    position: "relative",
    marginBottom: Spacing.sm,
  },
  colorScroll: {},
  colorArrow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  colorArrowLeft: {
    left: 0,
    backgroundColor: Colors.bg,
  },
  colorArrowRight: {
    right: 0,
    backgroundColor: Colors.bg,
  },
  colorArrowText: {
    fontSize: Typography.sizes["2xl"],
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  colorRow: {
    flexDirection: "row",
    gap: Spacing.base,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 2,
  },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: {
    borderWidth: 3,
    borderColor: "#fff",
    transform: [{ scale: 1.15 }],
  },
});
