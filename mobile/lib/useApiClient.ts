import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { apiClient, setAuthToken } from "./apiClient";
import type { AxiosRequestConfig } from "axios";

// Sincroniza el token de Supabase con el header Authorization de axios.
// El token se refresca automáticamente por el cliente Supabase (autoRefreshToken).
export function useApiClient() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Intentar obtener la sesión activa al montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setAuthToken(session.access_token);
        setReady(true);
      } else {
        setAuthToken(null);
        setReady(false);
      }
    });

    // Escuchar cambios de sesión (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setAuthToken(session.access_token);
        setReady(true);
      } else {
        setAuthToken(null);
        setReady(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const request = useCallback(
    async <T>(config: AxiosRequestConfig): Promise<T> => {
      // Siempre refrescar el token antes de llamar (puede haber expirado)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) setAuthToken(session.access_token);

      const res = await apiClient.request<T>(config);
      return res.data;
    },
    [],
  );

  return { request, ready };
}
