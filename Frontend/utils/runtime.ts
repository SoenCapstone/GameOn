import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Determines if the application is currently running within the Expo Go client.
 * @returns {boolean} True if running in Expo Go, false otherwise.
 */
export const isRunningInExpoGo =
  Constants.executionEnvironment === "storeClient";

/**
 * Determines if the application is running in a bare workflow environment.
 * @returns {boolean} True if running in a bare workflow, false otherwise.
 */
export const isBareWorkflow = Constants.executionEnvironment === "bare";

/**
 * Determines if the application is running as a standalone app (e.g., from an app store).
 * @returns {boolean} True if running as a standalone app, false otherwise.
 */
export const isStandaloneApp = Constants.executionEnvironment === "standalone";

/**
 * Determines if the current platform is iOS.
 * @returns {boolean} True if running on iOS, false otherwise.
 */
export const isIOS = Platform.OS === "ios";

/**
 * Determines if the current platform is Android.
 * @returns {boolean} True if running on Android, false otherwise.
 */
export const isAndroid = Platform.OS === "android";

/**
 * Determines if the application is currently in a development environment.
 * This includes Expo Go, a custom development client, or a bare workflow run from a dev server.
 * @returns {boolean} True if in development mode, false otherwise.
 */
export const isDevelopment = __DEV__;

/**
 * Determines if the application is running in a production environment (a compiled standalone app).
 * @returns {boolean} True if in production mode, false otherwise.
 */
export const isProduction = !__DEV__;

/**
 * Consolidated device and environment information object.
 */
export const runtime = {
  isRunningInExpoGo,
  isBareWorkflow,
  isStandaloneApp,
  executionEnvironment: Constants.executionEnvironment,

  isIOS,
  isAndroid,
  platformOS: Platform.OS,
  platformVersion: Platform.Version,

  isDevelopment,
  isProduction,
};
