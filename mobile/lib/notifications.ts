import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NOTIF_DAYS_KEY = "epti_notify_days";
export const NOTIF_ENABLED_KEY = "epti_notify_enabled";

/** Request permission on Android 13+ / iOS. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/** Cancel all scheduled notifications and reschedule based on current subscriptions. */
export async function schedulePaymentReminders(
  subscriptions: Array<{ id: number; name: string; nextPaymentDate: string }>,
  daysBefore: number,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const sub of subscriptions) {
    const paymentDate = new Date(sub.nextPaymentDate);
    const triggerDate = new Date(paymentDate);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(9, 0, 0, 0); // 9 AM

    if (triggerDate <= new Date()) continue; // already past

    await Notifications.scheduleNotificationAsync({
      identifier: `subs-${sub.id}`,
      content: {
        title: `💳 ${sub.name}`,
        body: `Pago en ${daysBefore} día${daysBefore !== 1 ? "s" : ""}`,
        data: { subscriptionId: sub.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
