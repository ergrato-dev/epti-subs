import "../lib/i18n"; // initialize i18n before anything renders
import { useEffect } from "react";
import { Stack } from "expo-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { setAuthToken } from "../lib/apiClient";
import { requestNotificationPermission } from "../lib/notifications";
import posthog from "../lib/posthog";

// ── Token storage security audit ──────────────────────────────────────────
// SECURITY: Auth tokens MUST be stored in encrypted storage (SecureStore).
// Falling back to unencrypted AsyncStorage is only acceptable during local
// development with Expo Go, where the ExpoCryptoAES native module may be
// absent. In any production or preview build this fallback MUST NOT be used.
//
// Audit checklist satisfied here:
//   [x] SecureStore loaded dynamically to avoid crash when native module is
//       absent in Expo Go (SDK 54 + expo-secure-store v15 mismatch).
//   [x] AsyncStorage fallback is guarded by __DEV__ — production builds
//       throw immediately rather than storing tokens unencrypted.
//   [x] No token value is logged or exposed in error messages.
// ──────────────────────────────────────────────────────────────────────────

let SecureStore: typeof import("expo-secure-store") | null = null;
try {
  SecureStore = require("expo-secure-store");
} catch {
  if (!__DEV__) {
    // In a production/preview build the native module MUST be present.
    // Throwing here prevents the app from running with insecure token storage.
    throw new Error(
      "[SECURITY] expo-secure-store native module is unavailable in a non-dev build. " +
        "Auth tokens cannot be stored securely. Aborting."
    );
  }
  // DEV only: native module missing (e.g. Expo Go) — AsyncStorage fallback below.
}

const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    if (SecureStore) return SecureStore.getItemAsync(key);
    // __DEV__ fallback — AsyncStorage is NOT encrypted
    return AsyncStorage.getItem(key);
  },
  async saveToken(key: string, value: string): Promise<void> {
    if (SecureStore) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    // __DEV__ fallback — AsyncStorage is NOT encrypted
    await AsyncStorage.setItem(key, value);
  },
  async clearToken(key: string): Promise<void> {
    if (SecureStore) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    // __DEV__ fallback — AsyncStorage is NOT encrypted
    await AsyncStorage.removeItem(key);
  },
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
