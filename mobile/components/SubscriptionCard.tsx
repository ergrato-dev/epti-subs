import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Colors } from "../constants/Colors";
import { Typography, Spacing, Radius } from "../constants/Theme";
import type { Subscription } from "../types/subscription";

interface Props {
  subscription: Subscription;
  onPress?: () => void;
  compact?: boolean;
}

function formatCurrency(amount: string, currency: string) {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

// Elige un color de la paleta basado en el id de la suscripción
function getCardColor(sub: Subscription): string {
  if (sub.color) return sub.color;
  return Colors.cardColors[sub.id % Colors.cardColors.length];
}

export function SubscriptionCard({
  subscription: sub,
  onPress,
  compact,
}: Props) {
  const cardColor = getCardColor(sub);
  const days = daysUntil(sub.nextPaymentDate);
  const amount = formatCurrency(sub.cost, sub.currency);

  if (compact) {
    // Versión pequeña para el widget "Upcoming" del Home
    return (
      <Pressable
        style={[styles.compact, { backgroundColor: cardColor }]}
        onPress={onPress}
      >
        {sub.logoUrl ? (
          <Image source={{ uri: sub.logoUrl }} style={styles.compactLogo} />
        ) : (
          <View style={styles.compactLogoPlaceholder}>
            <Text style={styles.compactLogoLetter}>
              {sub.name[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.compactAmount}>{amount}</Text>
        <Text style={styles.compactDays}>{days} días</Text>
        <Text style={styles.compactName} numberOfLines={1}>
          {sub.name}
        </Text>
      </Pressable>
    );
  }

  // Versión completa para listas
  return (
    <Pressable
      style={[styles.card, { backgroundColor: cardColor }]}
      onPress={onPress}
    >
      <View style={styles.row}>
        {sub.logoUrl ? (
          <Image source={{ uri: sub.logoUrl }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoLetter}>{sub.name[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{sub.name}</Text>
          {sub.planName && <Text style={styles.plan}>{sub.planName}</Text>}
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{amount}</Text>
          <Text style={styles.cycle}>{sub.billingCycle}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // ── Full card ──────────────────────────────────────────────────────────────
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: "#fff",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: "#fff",
  },
  plan: {
    fontSize: Typography.sizes.sm,
    color: "rgba(255,255,255,0.7)",
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
  amount: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: "#fff",
  },
  cycle: {
    fontSize: Typography.sizes.xs,
    color: "rgba(255,255,255,0.7)",
  },
  // ── Compact card (Upcoming widget) ────────────────────────────────────────
  compact: {
    width: 120,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  compactLogo: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  compactLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  compactLogoLetter: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: "#fff",
  },
  compactAmount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: "#fff",
    marginTop: Spacing.xs,
  },
  compactDays: {
    fontSize: Typography.sizes.xs,
    color: "rgba(255,255,255,0.7)",
  },
  compactName: {
    fontSize: Typography.sizes.xs,
    color: "rgba(255,255,255,0.8)",
    fontWeight: Typography.weights.medium,
  },
});
