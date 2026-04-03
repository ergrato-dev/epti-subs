import { useEffect, useState } from "react";
import { Stack, Redirect } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { Session } from "@supabase/supabase-js";

export default function AuthLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s),
    );
    return () => subscription.unsubscribe();
  }, []);

  // Cargando sesion
  if (session === undefined) return null;

  // Si ya esta autenticado, ir directo a la app
  if (session) return <Redirect href="/(app)/(tabs)/home" />;

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
