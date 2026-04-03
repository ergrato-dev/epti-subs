import "../lib/i18n"; // initialize i18n before anything renders
import { useEffect } from "react";
import { Stack } from "expo-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { setAuthToken } from "../lib/apiClient";
import { requestNotificationPermission } from "../lib/notifications";
import posthog from "../lib/posthog";

// ── Token storage security audit ──────────────────────────────────────────
// SECURITY: Auth tokens stored exclusively in expo-secure-store (encrypted).
//
// Audit checklist:
//   [x] expo-secure-store@15.0.8 — uses Android Keystore / iOS Keychain.
//       Compatible with Expo Go SDK 54 (bundledNativeModules: ~15.0.8).
//   [x] ExpoCryptoAES natively absent en SDK 54 fue resuelto pinando
//       expo-crypto@15.0.8 via pnpm.overrides (v55 lo introducía vía
//       expo-auth-session@55 ← @clerk/clerk-expo). v15 no tiene ese módulo.
//   [x] @clerk/clerk-expo peer-dep: expo-secure-store >=12.4.0 ✓
//   [x] No token value is logged or exposed in error messages.
// ──────────────────────────────────────────────────────────────────────────

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  clearToken: (key: string) => SecureStore.deleteItemAsync(key),
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set in .env");
}

function TokenSync() {
  const { getToken, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setAuthToken(null);
      return;
    }
    getToken().then((token) => setAuthToken(token));
    // Identify user in PostHog (no PII — only the opaque Clerk userId)
    if (userId) posthog.identify(userId);
  }, [isSignedIn, getToken, userId]);

  return null;
}

function AppBootstrap() {
  useEffect(() => {
    // Request notification permissions once on first launch
    requestNotificationPermission();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AppBootstrap />
      <TokenSync />
      <StatusBar style="light" backgroundColor="#0A1628" />
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}
