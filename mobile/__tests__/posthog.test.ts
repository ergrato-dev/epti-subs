// Mock PostHog SDK antes de importar el modulo (jest.mock se ice antes del import estatico)
jest.mock("posthog-react-native", () => {
  const MockPostHog = jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  }));
  return { __esModule: true, default: MockPostHog };
});

import posthog, {
  trackSubscriptionCreated,
  trackSubscriptionDeleted,
  trackScreenView,
} from "../lib/posthog";

// En tests, __DEV__ === true (definido en jest.setup.js), por lo que posthog sera null
describe("posthog (modo __DEV__)", () => {
  it("exporta null en modo __DEV__", () => {
    expect(posthog).toBeNull();
  });

  it("trackSubscriptionCreated no lanza cuando posthog es null", () => {
    expect(() => trackSubscriptionCreated("Netflix", "monthly")).not.toThrow();
  });

  it("trackSubscriptionDeleted no lanza cuando posthog es null", () => {
    expect(() => trackSubscriptionDeleted("Spotify")).not.toThrow();
  });

  it("trackScreenView no lanza cuando posthog es null", () => {
    expect(() => trackScreenView("home")).not.toThrow();
  });
});
