import PostHog from "posthog-react-native";

// PostHog is initialized lazily so it's safe to import this module anywhere.
// The client is a singleton — call posthog.capture() from any screen.
//
// En __DEV__ se devuelve null para evitar que el SDK haga requests de
// configuración hacia app.posthog.com con una API key de placeholder.
// Los helpers de tracking hacen early-return cuando el cliente es null.
const posthog: PostHog | null = __DEV__
  ? null
  : new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "phc_placeholder", {
      host: "https://app.posthog.com",
      flushAt: 20,
      flushInterval: 30000,
    });

export default posthog;

// ─── Typed event helpers ───────────────────────────────────────────────────

export function trackSubscriptionCreated(name: string, billingCycle: string) {
  posthog?.capture("subscription_created", {
    name,
    billing_cycle: billingCycle,
  });
}

export function trackSubscriptionDeleted(name: string) {
  posthog?.capture("subscription_deleted", { name });
}

export function trackScreenView(screen: string) {
  posthog?.capture("$screen", { $screen_name: screen });
}
