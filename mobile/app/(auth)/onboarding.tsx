import { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Colors } from "../../constants/Colors";
import { Typography, Spacing, Radius } from "../../constants/Theme";

const { width } = Dimensions.get("window");
const SIZE = width * 0.72;

// ─── Formas geométricas decorativas (refleja el diseño de referencia) ─────────
function GeometricBackground() {
  return (
    <View style={geo.container} pointerEvents="none">
      {/* Círculo grande naranja/accent arriba-derecha */}
      <View style={[geo.shape, geo.circleLg, { backgroundColor: Colors.accent }]} />
      {/* Semicírculo beige arriba-izquierda */}
      <View style={[geo.shape, geo.semiLeft, { backgroundColor: "#E8E0D0" }]} />
      {/* Círculo teal centro */}
      <View style={[geo.shape, geo.circleMd, { backgroundColor: "#0D9488" }]} />
      {/* Cuadrado redondeado azul oscuro */}
      <View style={[geo.shape, geo.squareDark, { backgroundColor: "#1E3A5F" }]} />
      {/* Semicírculo beige abajo */}
      <View style={[geo.shape, geo.semiBottom, { backgroundColor: "#E8E0D0" }]} />
      {/* Círculo pequeño accent abajo-izquierda */}
      <View style={[geo.shape, geo.circleSm, { backgroundColor: Colors.accent }]} />
    </View>
  );
}

const geo = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shape: {
    position: "absolute",
  },
  circleLg: {
    width: SIZE * 0.55,
    height: SIZE * 0.55,
    borderRadius: (SIZE * 0.55) / 2,
    top: -SIZE * 0.05,
    right: -SIZE * 0.05,
  },
  semiLeft: {
    width: SIZE * 0.42,
    height: SIZE * 0.42,
    borderRadius: (SIZE * 0.42) / 2,
    top: SIZE * 0.05,
    left: -SIZE * 0.1,
  },
  circleMd: {
    width: SIZE * 0.3,
    height: SIZE * 0.3,
    borderRadius: (SIZE * 0.3) / 2,
    top: SIZE * 0.35,
    right: SIZE * 0.1,
  },
  squareDark: {
    width: SIZE * 0.38,
    height: SIZE * 0.38,
    borderRadius: Radius.lg,
    top: SIZE * 0.42,
    left: SIZE * 0.05,
  },
  semiBottom: {
    width: SIZE * 0.32,
    height: SIZE * 0.32,
    borderRadius: (SIZE * 0.32) / 2,
    bottom: SIZE * 0.08,
    right: SIZE * 0.05,
  },
  circleSm: {
    width: SIZE * 0.2,
    height: SIZE * 0.2,
    borderRadius: (SIZE * 0.2) / 2,
    bottom: SIZE * 0.02,
    left: SIZE * 0.28,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      {/* Ilustración geométrica */}
      <View style={styles.illustration}>
        <GeometricBackground />
      </View>

      {/* Texto y CTA */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.title}>{t("auth.onboardingTitle")}</Text>
        <Text style={styles.subtitle}>{t("auth.onboardingSubtitle")}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/(auth)/sign-in")}
        >
          <Text style={styles.buttonText}>{t("auth.getStarted")}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  illustration: {
    flex: 1,
    position: "relative",
  },
  content: {
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: Spacing["3xl"],
    alignItems: "center",
    gap: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes["3xl"],
    fontWeight: Typography.weights.bold,
    color: Colors.bg,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.bg,
    opacity: 0.75,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  button: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingVertical: Spacing.base,
    borderRadius: Radius.full,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.bg,
  },
});
