import { useEffect, useState } from "react";
import { Redirect, Stack } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { Session } from "@supabase/supabase-js";

export default function AppLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s),
    );
    return () => subscription.unsubscribe();
  }, []);

  // Cargando sesion inicial
  if (session === undefined) return null;

  // Guard: redirige a auth si no hay sesion activa
  if (!session) return <Redirect href="/(auth)/onboarding" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
