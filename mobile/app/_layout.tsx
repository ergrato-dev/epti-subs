import "../lib/i18n"; // initialize i18n before anything renders
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../lib/supabase";
import { setAuthToken } from "../lib/apiClient";
import { requestNotificationPermission } from "../lib/notifications";
import posthog from "../lib/posthog";

// -- Token storage security audit -----------------------------------------
// SECURITY: Sesion de Supabase persistida con auto-refresh.
//
// Audit checklist:
//   [x] supabase.auth.onAuthStateChange sincroniza el access_token con axios
//       antes de cualquier request a la API Express.
//   [x] El token JWT es verificado localmente en el API con SUPABASE_JWT_SECRET
//       (sin round-trip a Supabase en cada request).
//   [x] No se expone PII -- solo el UUID opaco de Supabase (auth.uid()) a PostHog.
//   [x] autoRefreshToken: true rota los tokens automaticamente.
// -------------------------------------------------------------------------

function TokenSync() {
  useEffect(() => {
    // Sincronizar token inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthToken(session?.access_token ?? null);
      if (session?.user?.id) posthog?.identify(session.user.id);
    });

    // Escuchar cambios: sign-in, sign-out, token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthToken(session?.access_token ?? null);
      if (session?.user?.id) posthog?.identify(session.user.id);
      else posthog?.reset();
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

function AppBootstrap() {
  useEffect(() => {
    requestNotificationPermission();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <>
      <AppBootstrap />
      <TokenSync />
      <StatusBar style="light" backgroundColor="#0A1628" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
