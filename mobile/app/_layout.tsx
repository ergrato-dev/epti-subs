import "../lib/i18n"; // initialize i18n before anything renders
import { useEffect } from "react";
import { Stack } from "expo-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { setAuthToken } from "../lib/apiClient";
import { requestNotificationPermission } from "../lib/notifications";
import posthog from "../lib/posthog";

// Secure token cache for Clerk — tokens stored encrypted on device
const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    return SecureStore.deleteItemAsync(key);
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
