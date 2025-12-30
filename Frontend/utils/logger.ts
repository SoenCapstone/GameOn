import { logger, consoleTransport } from "react-native-logs";
import { isDevelopment } from "@/utils/runtime";

const severity =
  (process.env.EXPO_PUBLIC_LOG_LEVEL as "debug" | "info" | "warn" | "error") ??
  (isDevelopment ? "debug" : "info");

export const log = logger.createLogger({
  severity,
  transport: consoleTransport,
  printLevel: true,
  printDate: true,
  transportOptions: {
    colors: {
      debug: "grey",
      info: "cyan",
      warn: "yellow",
      error: "red",
    },
  },
});

export const createScopedLog = (scope: string) => ({
  debug: (m: string, d?: unknown) => log.debug(`${scope}: ${m}`, d),
  info: (m: string, d?: unknown) =>
    d === undefined
      ? log.info(`${scope}: ${m}`)
      : log.info(`${scope}: ${m}`, d),
  warn: (m: string, d?: unknown) => log.warn(`${scope}: ${m}`, d),
  error: (m: string, d?: unknown) => log.error(`${scope}: ${m}`, d),
});
