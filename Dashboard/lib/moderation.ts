import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { query } from "@/lib/db";
import {
  type ModerationQueueItem,
  readModerationState,
  removeModerationQueueItem,
  updateModerationCursor,
  upsertModerationQueueItems,
} from "@/lib/moderation-store";
import { lockDashboardUser } from "@/lib/users";

type MessageRow = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type TeamPostRow = {
  id: string;
  author_user_id: string;
  title: string | null;
  body: string;
  created_at: string;
};

type LeaguePostRow = {
  id: string;
  author_user_id: string;
  title: string | null;
  body: string;
  created_at: string;
};

type ModerationContentItem = {
  id: string;
  userId: string;
  contentType: "message" | "team_post" | "league_post";
  contentId: string;
  contentText: string;
  contentPreview: string;
  cursorCreatedAt: string;
  createdAt: string;
};

type ToxicityClassification = {
  label: string;
  results: Array<{
    match: boolean | null;
  }>;
};

type ClerkModerationMetadata = {
  offenseCount?: number;
};

export type ScanModerationContentResult = {
  scannedCount: number;
  warningCount: number;
  queuedCount: number;
  queueItems: ModerationQueueItem[];
};

type ClerkModerationUser = {
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
  }>;
  privateMetadata: Record<string, unknown>;
};

type ModerationUserRow = {
  id: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  image_url: string | null;
};

export type ModerationQueueListItem = ModerationQueueItem & {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    imageUrl: string | null;
  };
};

const moderationLabels = [
  "identity_attack",
  "insult",
  "obscene",
  "severe_toxicity",
  "sexual_explicit",
  "threat",
  "toxicity",
] as const;

const explicitModerationRules = [
  {
    label: "harassment",
    pattern: /\b(fuck you|go fuck yourself|kill yourself|kys)\b/i,
  },
  {
    label: "profanity",
    pattern:
      /\b(fuck|fucking|motherfucker|shit|bullshit|bitch|asshole|bastard|dick|cunt|pussy)\b/i,
  },
] as const;

declare global {
  var gameOnDashboardToxicityClassifier:
    | Promise<ModerationClassifier>
    | undefined;
}

type ModerationClassifier = {
  classify(inputs: string[] | string): Promise<ToxicityClassification[]>;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(apiKey);
}

function getResendFromEmail() {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  return from;
}

function buildContentPreview(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 200);
}

function buildPostText(title: string | null, body: string) {
  return [title?.trim(), body.trim()].filter(Boolean).join("\n\n");
}

function toUtcIsoString(timestamp: string) {
  return new Date(timestamp.replace(" ", "T") + "Z").toISOString();
}

function normalizeMessageCursor(cursor: string | null) {
  if (!cursor) {
    return null;
  }

  // Legacy buggy cursor values were saved as ISO strings after local-time parsing.
  // Messages store UTC timestamps without timezone, so those old cursor values skip
  // newer rows. Reset once and let the scanner rebuild the correct raw cursor.
  if (cursor.includes("T")) {
    return null;
  }

  return cursor;
}

async function getToxicityClassifier() {
  if (!globalThis.gameOnDashboardToxicityClassifier) {
    globalThis.gameOnDashboardToxicityClassifier = (async () => {
      try {
        await import("@tensorflow/tfjs");
        const toxicity = await import("@tensorflow-models/toxicity");

        return toxicity.load(0.7, [...moderationLabels]);
      } catch (error) {
        globalThis.gameOnDashboardToxicityClassifier = undefined;
        throw new Error(
          `Failed to load toxicity model: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
      }
    })();
  }

  return globalThis.gameOnDashboardToxicityClassifier;
}

function getQueueItemId(item: ModerationContentItem) {
  return `${item.contentType}:${item.contentId}`;
}

function getMatchedLabels(
  classifications: ToxicityClassification[],
  index: number,
) {
  return classifications
    .filter((classification) => classification.results[index]?.match === true)
    .map((classification) => classification.label);
}

function getExplicitRuleMatches(text: string) {
  return explicitModerationRules
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => rule.label);
}

async function getNewMessages(since: string | null) {
  const result = await query<MessageRow>(
    `
      SELECT id::text, sender_id, content, created_at::text
      FROM messages
      WHERE deleted_at IS NULL
        AND ($1::timestamptz IS NULL OR created_at > $1::timestamptz)
      ORDER BY created_at ASC
      LIMIT 250
    `,
    [since],
  );

  return result.rows.map<ModerationContentItem>((row) => ({
    id: `message:${row.id}`,
    userId: row.sender_id,
    contentType: "message",
    contentId: row.id,
    contentText: row.content,
    contentPreview: buildContentPreview(row.content),
    cursorCreatedAt: row.created_at,
    createdAt: toUtcIsoString(row.created_at),
  }));
}

async function getNewTeamPosts(since: string | null) {
  const result = await query<TeamPostRow>(
    `
      SELECT id::text, author_user_id, title, body, created_at::text
      FROM team_posts
      WHERE $1::timestamptz IS NULL OR created_at > $1::timestamptz
      ORDER BY created_at ASC
      LIMIT 250
    `,
    [since],
  );

  return result.rows.map<ModerationContentItem>((row) => {
    const contentText = buildPostText(row.title, row.body);

    return {
      id: `team_post:${row.id}`,
      userId: row.author_user_id,
      contentType: "team_post",
      contentId: row.id,
      contentText,
      contentPreview: buildContentPreview(contentText),
      cursorCreatedAt: row.created_at,
      createdAt: new Date(row.created_at).toISOString(),
    };
  });
}

async function getNewLeaguePosts(since: string | null) {
  const result = await query<LeaguePostRow>(
    `
      SELECT id::text, author_user_id, title, body, created_at::text
      FROM league_posts
      WHERE $1::timestamptz IS NULL OR created_at > $1::timestamptz
      ORDER BY created_at ASC
      LIMIT 250
    `,
    [since],
  );

  return result.rows.map<ModerationContentItem>((row) => {
    const contentText = buildPostText(row.title, row.body);

    return {
      id: `league_post:${row.id}`,
      userId: row.author_user_id,
      contentType: "league_post",
      contentId: row.id,
      contentText,
      contentPreview: buildContentPreview(contentText),
      cursorCreatedAt: row.created_at,
      createdAt: new Date(row.created_at).toISOString(),
    };
  });
}

async function getUserModerationState(userId: string) {
  const client = await clerkClient();
  let user: ClerkModerationUser;

  try {
    user = await client.users.getUser(userId);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 404
    ) {
      return null;
    }

    throw error;
  }

  const moderation = (user.privateMetadata?.moderation ??
    {}) as ClerkModerationMetadata;

  return {
    user,
    offenseCount:
      typeof moderation.offenseCount === "number" ? moderation.offenseCount : 0,
  };
}

async function setUserOffenseCount(userId: string, offenseCount: number) {
  const client = await clerkClient();
  let user: ClerkModerationUser;

  try {
    user = await client.users.getUser(userId);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 404
    ) {
      return false;
    }

    throw error;
  }

  const existingModeration = (user.privateMetadata?.moderation ??
    {}) as ClerkModerationMetadata;

  await client.users.updateUserMetadata(userId, {
    privateMetadata: {
      ...user.privateMetadata,
      moderation: {
        ...existingModeration,
        offenseCount,
      },
    },
  });

  return true;
}

function getPrimaryEmail(user: ClerkModerationUser) {
  const primaryEmail = user.emailAddresses.find(
    (emailAddress: { id: string; emailAddress: string }) =>
      emailAddress.id === user.primaryEmailAddressId,
  );

  return primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
}

async function sendWarningEmail(params: {
  email: string;
  contentPreview: string;
}) {
  const resend = getResendClient();

  await resend.emails.send({
    from: getResendFromEmail(),
    to: params.email,
    subject: "GameOn warning: inappropriate content detected",
    text: `We detected content that may violate GameOn policies.\n\nContent:\n${params.contentPreview}\n\nFuture violations may lead to your account being locked.`,
  });
}

async function sendLockEmail(params: {
  email: string;
  contentPreview: string;
}) {
  const resend = getResendClient();

  await resend.emails.send({
    from: getResendFromEmail(),
    to: params.email,
    subject: "GameOn account locked for policy violation",
    text: `Your GameOn account has been locked for 30 days due to policy violations.\n\nContent:\n${params.contentPreview}`,
  });
}

export async function scanModerationContent(): Promise<ScanModerationContentResult> {
  const state = await readModerationState();
  const normalizedMessagesCursor = normalizeMessageCursor(
    state.lastScannedAt.messages,
  );
  const [messages, teamPosts, leaguePosts] = await Promise.all([
    getNewMessages(normalizedMessagesCursor),
    getNewTeamPosts(state.lastScannedAt.teamPosts),
    getNewLeaguePosts(state.lastScannedAt.leaguePosts),
  ]);

  const items = [...messages, ...teamPosts, ...leaguePosts].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );

  if (items.length === 0) {
    return {
      scannedCount: 0,
      warningCount: 0,
      queuedCount: 0,
      queueItems: [] as ModerationQueueItem[],
    };
  }

  const classifier = await getToxicityClassifier();
  const classifications = (await classifier.classify(
    items.map((item) => item.contentText),
  )) as ToxicityClassification[];

  const offenseCountByUserId = new Map<string, number>();
  const newQueueItems: ModerationQueueItem[] = [];
  let warningCount = 0;

  for (const [index, item] of items.entries()) {
    const labels = Array.from(
      new Set([
        ...getMatchedLabels(classifications, index),
        ...getExplicitRuleMatches(item.contentText),
      ]),
    );

    if (labels.length === 0) {
      continue;
    }

    let offenseCount = offenseCountByUserId.get(item.userId);
    let user: ClerkModerationUser | undefined;

    if (offenseCount === undefined) {
      const moderationState = await getUserModerationState(item.userId);
      if (!moderationState) {
        console.warn(
          `[moderation] skipped content for missing Clerk user ${item.userId}`,
        );
        continue;
      }

      offenseCount = moderationState.offenseCount;
      user = moderationState.user;
      offenseCountByUserId.set(item.userId, offenseCount);
    }

    if (offenseCount < 1) {
      const currentUser =
        user ?? (await (await clerkClient()).users.getUser(item.userId));
      const email = getPrimaryEmail(currentUser);

      if (email) {
        try {
          await sendWarningEmail({
            email,
            contentPreview: item.contentPreview,
          });
        } catch (error) {
          console.error("Failed to send moderation warning email", error);
        }
      }

      warningCount += 1;
      offenseCountByUserId.set(item.userId, 1);
      await setUserOffenseCount(item.userId, 1);
      continue;
    }

    newQueueItems.push({
      id: getQueueItemId(item),
      userId: item.userId,
      contentType: item.contentType,
      contentId: item.contentId,
      contentPreview: item.contentPreview,
      createdAt: item.createdAt,
      labels,
    });
  }

  await upsertModerationQueueItems(newQueueItems);
  await updateModerationCursor({
    messages: messages.at(-1)?.cursorCreatedAt ?? normalizedMessagesCursor,
    teamPosts:
      teamPosts.at(-1)?.cursorCreatedAt ?? state.lastScannedAt.teamPosts,
    leaguePosts:
      leaguePosts.at(-1)?.cursorCreatedAt ?? state.lastScannedAt.leaguePosts,
  });

  return {
    scannedCount: items.length,
    warningCount,
    queuedCount: newQueueItems.length,
    queueItems: newQueueItems,
  };
}

export async function getModerationQueueItems() {
  const queue = await readModerationState().then((state) => state.queue);

  if (queue.length === 0) {
    return [] as ModerationQueueListItem[];
  }

  const uniqueUserIds = Array.from(new Set(queue.map((item) => item.userId)));
  const usersResult = await query<ModerationUserRow>(
    `
      SELECT id, firstname, lastname, email, image_url
      FROM users
      WHERE id = ANY($1::text[])
    `,
    [uniqueUserIds],
  );

  const userById = new Map(
    usersResult.rows.map((user) => [
      user.id,
      {
        id: user.id,
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
        imageUrl: user.image_url,
      },
    ]),
  );

  return queue.map((item) => ({
    ...item,
    user: userById.get(item.userId) ?? {
      id: item.userId,
      firstName: null,
      lastName: null,
      email: null,
      imageUrl: null,
    },
  }));
}

export async function dismissModerationQueueItem(itemId: string) {
  return removeModerationQueueItem(itemId);
}

export async function lockModeratedUser(itemId: string) {
  const state = await readModerationState();
  const queueItem = state.queue.find((item) => item.id === itemId);

  if (!queueItem) {
    throw new Error("Moderation queue item not found.");
  }

  const moderationState = await getUserModerationState(queueItem.userId);
  if (!moderationState) {
    await removeModerationQueueItem(itemId);
    return;
  }

  const nextOffenseCount = moderationState.offenseCount + 1;

  await lockDashboardUser(queueItem.userId);
  await setUserOffenseCount(queueItem.userId, nextOffenseCount);

  const email = getPrimaryEmail(moderationState.user);

  if (email) {
    try {
      await sendLockEmail({
        email,
        contentPreview: queueItem.contentPreview,
      });
    } catch (error) {
      console.error("Failed to send moderation lock email", error);
    }
  }

  await removeModerationQueueItem(itemId);

  return {
    userId: queueItem.userId,
    offenseCount: nextOffenseCount,
  };
}
