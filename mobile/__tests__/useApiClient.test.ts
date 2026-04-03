// Mocks declarados antes de importaciones — jest.mock se iza automáticamente
jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  },
}));

jest.mock("../lib/apiClient", () => ({
  apiClient: {
    request: jest.fn().mockResolvedValue({ data: { ok: true } }),
    defaults: {
      baseURL: "http://localhost:3000",
      timeout: 10000,
      headers: { common: {} },
    },
  },
  setAuthToken: jest.fn(),
}));

import { renderHook, waitFor } from "@testing-library/react-native";
import { useApiClient } from "../lib/useApiClient";
import { supabase } from "../lib/supabase";
import { setAuthToken, apiClient } from "../lib/apiClient";

describe("useApiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restaurar comportamiento por defecto: sin sesion
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  it("inicia con ready=false cuando no hay sesion activa", async () => {
    const { result } = renderHook(() => useApiClient());

    await waitFor(() => {
      // El efecto debe haber resuelto con session=null
      expect(setAuthToken).toHaveBeenCalledWith(null);
    });

    expect(result.current.ready).toBe(false);
  });

  it("setea ready=true y llama setAuthToken con el token cuando hay sesion", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "jwt-test-token" } },
    });

    const { result } = renderHook(() => useApiClient());

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    expect(setAuthToken).toHaveBeenCalledWith("jwt-test-token");
  });

  it("actualiza el token cuando onAuthStateChange dispara con sesion activa", async () => {
    // El mock llama al callback inmediatamente al registrarse (simula sign-in sincrónico)
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
      (cb: (_event: string, session: unknown) => void) => {
        cb("SIGNED_IN", { access_token: "auth-change-token" });
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      },
    );

    const { result } = renderHook(() => useApiClient());

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    expect(setAuthToken).toHaveBeenCalledWith("auth-change-token");
  });

  it("llama unsubscribe al desmontar el hook", async () => {
    const unsubscribeMock = jest.fn();
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    });

    const { unmount } = renderHook(() => useApiClient());

    // Esperar que el efecto se registre
    await waitFor(() => {
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it("request() refresca el token antes de cada llamada a apiClient", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "refreshed-token" } },
    });

    const { result } = renderHook(() => useApiClient());

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    // Resetear para que solo cuente la llamada de request()
    (setAuthToken as jest.Mock).mockClear();
    (supabase.auth.getSession as jest.Mock).mockClear();

    await result.current.request({ url: "/api/test", method: "GET" });

    expect(supabase.auth.getSession).toHaveBeenCalled();
    expect(apiClient.request).toHaveBeenCalledWith({
      url: "/api/test",
      method: "GET",
    });
  });

  it("request() no setea token cuando la sesion refrescada no tiene access_token", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useApiClient());

    await waitFor(() => {
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    (setAuthToken as jest.Mock).mockClear();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });

    await result.current.request({ url: "/api/test", method: "GET" });

    expect(setAuthToken).not.toHaveBeenCalled();
  });

  it("onAuthStateChange con session null setea ready=false y limpia el token", async () => {
    let authChangeCallback!: (_event: string, session: unknown) => void;
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
      (cb: (_event: string, session: unknown) => void) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      },
    );

    const { result } = renderHook(() => useApiClient());

    await waitFor(() => {
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    authChangeCallback("SIGNED_OUT", null);

    await waitFor(() => {
      expect(result.current.ready).toBe(false);
    });

    expect(setAuthToken).toHaveBeenCalledWith(null);
  });
});
