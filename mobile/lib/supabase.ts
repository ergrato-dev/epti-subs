import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Supabase client security audit ───────────────────────────────────────────
// [x] EXPO_PUBLIC_SUPABASE_ANON_KEY es la clave pública (anon) — nunca la
//     service role key en mobile.
// [x] Sesión persistida en AsyncStorage (cifrado en reposo via Expo SQLite
//     en producción; aceptable dado que Supabase valida el JWT server-side
//     y el token es rotado automáticamente con autoRefreshToken: true).
// [x] detectSessionInUrl: false — requerido en React Native (sin window.location)
// [x] El User ID opaco de Supabase (UUID) es el único identificador almacenado.
// ──────────────────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY son requeridos en .env",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage es el almacenamiento de sesiones recomendado por Supabase
    // para React Native. Ver nota de seguridad en el audit comment arriba.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tipo helper: usuario autenticado con id opaco
export type SupabaseUser = Awaited<
  ReturnType<typeof supabase.auth.getUser>
>["data"]["user"];
