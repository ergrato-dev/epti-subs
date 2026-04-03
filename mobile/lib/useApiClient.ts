import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { apiClient, setAuthToken } from "./apiClient";
import type { AxiosRequestConfig } from "axios";

// Refresca el token de Clerk antes de cada request y lo inyecta en axios
export function useApiClient() {
  const { getToken, isSignedIn } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setAuthToken(null);
      setReady(false);
      return;
    }
    getToken().then((t) => {
      setAuthToken(t);
      setReady(true);
    });
  }, [isSignedIn, getToken]);

  const request = useCallback(
    async <T>(config: AxiosRequestConfig): Promise<T> => {
      // Siempre refrescar el token antes de llamar (puede expirar)
      const token = await getToken();
      setAuthToken(token);
      const res = await apiClient.request<T>(config);
      return res.data;
    },
    [getToken],
  );

  return { request, ready };
}
