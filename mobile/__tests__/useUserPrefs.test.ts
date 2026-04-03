jest.mock(
  "@react-native-async-storage/async-storage",
  () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserPrefs } from "../lib/useUserPrefs";

describe("useUserPrefs — valores por defecto", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("devuelve currency=COP por defecto", async () => {
    const { result } = renderHook(() => useUserPrefs());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.prefs.currency).toBe("COP");
  });

  it("devuelve notificationsEnabled=true por defecto", async () => {
    const { result } = renderHook(() => useUserPrefs());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.prefs.notificationsEnabled).toBe(true);
  });

  it("devuelve notifyDaysBefore=3 por defecto", async () => {
    const { result } = renderHook(() => useUserPrefs());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.prefs.notifyDaysBefore).toBe(3);
  });
});

describe("useUserPrefs — carga desde AsyncStorage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("carga currency guardada (rama: currency !== null)", async () => {
    await AsyncStorage.setItem("epti_currency", "USD");
    const { result } = renderHook(() => useUserPrefs());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.prefs.currency).toBe("USD");
  });

  it("carga notificationsEnabled=false desde AsyncStorage (notifEnabled !== null && value === 'false')", async () => {
    await AsyncStorage.setItem("epti_notify_enabled", "false");
    const { result } = renderHook(() => useUserPrefs());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.prefs.notificationsEnabled).toBe(false);
  });

  it("carga notificationsEnabled=true desde AsyncStorage (value === 'true')", async () => {
    await AsyncStorage.setItem("epti_notify_enabled", "true");
    const { result } = renderHook(() => useUserPrefs());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.prefs.notificationsEnabled).toBe(true);
  });

  it("carga notifyDaysBefore=7 desde AsyncStorage (rama: notifDays no es null)", async () => {
    await AsyncStorage.setItem("epti_notify_days", "7");
    const { result } = renderHook(() => useUserPrefs());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.prefs.notifyDaysBefore).toBe(7);
  });
});

describe("useUserPrefs — setters", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("setCurrency actualiza el estado y persiste en AsyncStorage", async () => {
    const { result } = renderHook(() => useUserPrefs());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => {
      await result.current.setCurrency("EUR");
    });

    expect(result.current.prefs.currency).toBe("EUR");
    expect(await AsyncStorage.getItem("epti_currency")).toBe("EUR");
  });

  it("setNotificationsEnabled actualiza el estado y persiste", async () => {
    const { result } = renderHook(() => useUserPrefs());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => {
      await result.current.setNotificationsEnabled(false);
    });

    expect(result.current.prefs.notificationsEnabled).toBe(false);
    expect(await AsyncStorage.getItem("epti_notify_enabled")).toBe("false");
  });

  it("setNotifyDaysBefore actualiza el estado y persiste", async () => {
    const { result } = renderHook(() => useUserPrefs());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => {
      await result.current.setNotifyDaysBefore(5);
    });

    expect(result.current.prefs.notifyDaysBefore).toBe(5);
    expect(await AsyncStorage.getItem("epti_notify_days")).toBe("5");
  });
});
