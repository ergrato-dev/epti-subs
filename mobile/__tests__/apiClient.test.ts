import { apiClient, setAuthToken } from "../lib/apiClient";

describe("apiClient", () => {
  beforeEach(() => {
    // Resetear el token antes de cada test
    setAuthToken(null);
  });

  it("tiene baseURL configurada desde EXPO_PUBLIC_API_URL o fallback", () => {
    expect(apiClient.defaults.baseURL).toBeTruthy();
  });

  it("tiene timeout de 10000ms", () => {
    expect(apiClient.defaults.timeout).toBe(10_000);
  });

  it("tiene Content-Type application/json por defecto", () => {
    const headers = apiClient.defaults.headers as Record<string, unknown>;
    expect(
      headers["Content-Type"] ??
        (headers["common"] as Record<string, unknown>)?.["Content-Type"],
    ).toBeTruthy();
  });
});

describe("setAuthToken", () => {
  it("inyecta el token en el header Authorization de axios", () => {
    setAuthToken("my-test-jwt-token");
    const headers = apiClient.defaults.headers.common as Record<
      string,
      unknown
    >;
    expect(headers["Authorization"]).toBe("Bearer my-test-jwt-token");
  });

  it("elimina el header Authorization cuando se pasa null", () => {
    setAuthToken("some-token");
    setAuthToken(null);
    const headers = apiClient.defaults.headers.common as Record<
      string,
      unknown
    >;
    expect(headers["Authorization"]).toBeUndefined();
  });
});
