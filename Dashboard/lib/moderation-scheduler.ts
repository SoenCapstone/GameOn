import "server-only";

import type { ScanModerationContentResult } from "@/lib/moderation";
import { scanModerationContent } from "@/lib/moderation";

declare global {
  var gameOnModerationScanTimer: NodeJS.Timeout | undefined;
  var gameOnModerationScanInFlight: boolean | undefined;
  var gameOnModerationScanQueue:
    | Promise<ScanModerationContentResult | null>
    | undefined;
}

const moderationScanIntervalMs = 60 * 1000;

async function performModerationScan() {
  globalThis.gameOnModerationScanInFlight = true;

  try {
    console.log(
      `[moderation] scan started at ${new Date().toLocaleString()}`,
    );

    const result = await scanModerationContent();

    console.log(
      `[moderation] scanned ${result.scannedCount} items, warned ${result.warningCount}, queued ${result.queuedCount}`,
    );

    return result;
  } catch (error) {
    console.error("[moderation] scheduled scan failed", error);
    throw error;
  } finally {
    globalThis.gameOnModerationScanInFlight = false;
  }
}

function enqueueModerationScan() {
  const currentQueue = globalThis.gameOnModerationScanQueue ?? Promise.resolve(null);
  const nextQueue = currentQueue
    .catch(() => null)
    .then(() => performModerationScan());

  globalThis.gameOnModerationScanQueue = nextQueue.finally(() => {
    if (globalThis.gameOnModerationScanQueue === nextQueue) {
      globalThis.gameOnModerationScanQueue = undefined;
    }
  });

  return nextQueue;
}

async function runModerationScan() {
  if (globalThis.gameOnModerationScanInFlight) {
    return null;
  }

  return enqueueModerationScan();
}

export async function runModerationScanNow() {
  return enqueueModerationScan();
}

export function startModerationScheduler() {
  if (globalThis.gameOnModerationScanTimer) {
    return;
  }

  void runModerationScan();

  globalThis.gameOnModerationScanTimer = setInterval(() => {
    void runModerationScan();
  }, moderationScanIntervalMs);

  console.log(
    `[moderation] scheduler started with ${Math.round(
      moderationScanIntervalMs / 1000,
    )} second interval`,
  );
}
