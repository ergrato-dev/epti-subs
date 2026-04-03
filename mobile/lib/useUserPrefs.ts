import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENCY_KEY = "epti_currency";
const NOTIFY_ENABLED_KEY = "epti_notify_enabled";
const NOTIFY_DAYS_KEY = "epti_notify_days";

interface UserPrefs {
  currency: string;
  notificationsEnabled: boolean;
  notifyDaysBefore: number;
}

const DEFAULTS: UserPrefs = {
  currency: "COP",
  notificationsEnabled: true,
  notifyDaysBefore: 3,
};

export function useUserPrefs() {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(CURRENCY_KEY),
      AsyncStorage.getItem(NOTIFY_ENABLED_KEY),
      AsyncStorage.getItem(NOTIFY_DAYS_KEY),
    ]).then(([currency, notifEnabled, notifDays]) => {
      setPrefs({
        currency: currency ?? DEFAULTS.currency,
        notificationsEnabled:
          notifEnabled !== null
            ? notifEnabled === "true"
            : DEFAULTS.notificationsEnabled,
        notifyDaysBefore: notifDays
          ? parseInt(notifDays, 10)
          : DEFAULTS.notifyDaysBefore,
      });
      setLoaded(true);
    });
  }, []);

  const setCurrency = useCallback(async (value: string) => {
    setPrefs((p) => ({ ...p, currency: value }));
    await AsyncStorage.setItem(CURRENCY_KEY, value);
  }, []);

  const setNotificationsEnabled = useCallback(async (value: boolean) => {
    setPrefs((p) => ({ ...p, notificationsEnabled: value }));
    await AsyncStorage.setItem(NOTIFY_ENABLED_KEY, String(value));
  }, []);

  const setNotifyDaysBefore = useCallback(async (value: number) => {
    setPrefs((p) => ({ ...p, notifyDaysBefore: value }));
    await AsyncStorage.setItem(NOTIFY_DAYS_KEY, String(value));
  }, []);

  return {
    prefs,
    loaded,
    setCurrency,
    setNotificationsEnabled,
    setNotifyDaysBefore,
  };
}
