import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ModerationQueueItem = {
  id: string;
  userId: string;
  contentType: "message" | "team_post" | "league_post";
  contentId: string;
  contentPreview: string;
  createdAt: string;
  labels: string[];
};

type ModerationState = {
  lastScannedAt: {
    messages: string | null;
    teamPosts: string | null;
    leaguePosts: string | null;
  };
  queue: ModerationQueueItem[];
};

const initialModerationState: ModerationState = {
  lastScannedAt: {
    messages: null,
    teamPosts: null,
    leaguePosts: null,
  },
  queue: [],
};

function getModerationStatePath() {
  return path.join(process.cwd(), ".moderation", "state.json");
}

async function ensureModerationStateFile() {
  const filePath = getModerationStatePath();
  const directoryPath = path.dirname(filePath);

  await mkdir(directoryPath, { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(
      filePath,
      JSON.stringify(initialModerationState, null, 2),
      "utf8",
    );
  }

  return filePath;
}

export async function readModerationState(): Promise<ModerationState> {
  const filePath = await ensureModerationStateFile();
  const content = await readFile(filePath, "utf8");

  return JSON.parse(content) as ModerationState;
}

export async function writeModerationState(state: ModerationState) {
  const filePath = await ensureModerationStateFile();

  await writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
}

export async function getModerationQueue() {
  const state = await readModerationState();

  return state.queue;
}

export async function upsertModerationQueueItems(items: ModerationQueueItem[]) {
  const state = await readModerationState();
  const existingById = new Map(state.queue.map((item) => [item.id, item]));

  for (const item of items) {
    existingById.set(item.id, item);
  }

  state.queue = Array.from(existingById.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );

  await writeModerationState(state);
}

export async function removeModerationQueueItem(itemId: string) {
  const state = await readModerationState();
  const nextQueue = state.queue.filter((item) => item.id !== itemId);

  state.queue = nextQueue;

  await writeModerationState(state);

  return state.queue;
}

export async function updateModerationCursor(params: {
  messages?: string | null;
  teamPosts?: string | null;
  leaguePosts?: string | null;
}) {
  const state = await readModerationState();

  state.lastScannedAt.messages =
    params.messages ?? state.lastScannedAt.messages;
  state.lastScannedAt.teamPosts =
    params.teamPosts ?? state.lastScannedAt.teamPosts;
  state.lastScannedAt.leaguePosts =
    params.leaguePosts ?? state.lastScannedAt.leaguePosts;

  await writeModerationState(state);

  return state.lastScannedAt;
}
