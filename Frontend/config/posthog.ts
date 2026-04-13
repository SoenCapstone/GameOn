import PostHog from "posthog-react-native";

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN;
const isPostHogConfigured = Boolean(apiKey);

export const posthog = new PostHog(apiKey || "placeholder_key", {
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true,
  debug: __DEV__,
  flushAt: 20,
  flushInterval: 10000,
  preloadFeatureFlags: true,
});
