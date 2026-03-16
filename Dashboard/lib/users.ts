import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { query } from "@/lib/db";

type DbUserRow = {
  id: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  image_url: string | null;
};

type CountRow = {
  total: number;
};

type ExistingUserEmailRow = {
  email: string;
};

type ClerkWebhookEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkWebhookUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string;
  has_image: boolean;
  primary_email_address_id: string | null;
  email_addresses: ClerkWebhookEmailAddress[];
};

export type DashboardUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
  locked: boolean;
};

export type DashboardUsersResponse = {
  users: DashboardUser[];
  total: number;
  limit: number;
  offset: number;
};

export type DashboardUserOption = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
};

export type CreateDashboardUserInput = {
  email: string;
};

export class DashboardUserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = "DashboardUserAlreadyExistsError";
  }
}

function normalizeLimit(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 25;
  }

  return Math.min(value, 100);
}

function normalizeOffset(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function buildSearchPattern(search?: string): string | null {
  const trimmed = search?.trim();

  if (!trimmed) {
    return null;
  }

  return `%${trimmed}%`;
}

export async function getUserOptions(): Promise<DashboardUserOption[]> {
  const result = await query<DbUserRow>(
    `
      SELECT id, firstname, lastname, email, image_url
      FROM users
      ORDER BY
        COALESCE(firstname, ''),
        COALESCE(lastname, ''),
        COALESCE(email, ''),
        id
    `,
  );

  return result.rows.map((user) => ({
    id: user.id,
    firstName: user.firstname,
    lastName: user.lastname,
    email: user.email,
    imageUrl: user.image_url,
  }));
}

export async function getUsers(params?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<DashboardUsersResponse> {
  const limit = normalizeLimit(params?.limit ?? 25);
  const offset = normalizeOffset(params?.offset ?? 0);
  const searchPattern = buildSearchPattern(params?.search);

  const filters = searchPattern
    ? `
      WHERE
        COALESCE(firstname, '') ILIKE $1
        OR COALESCE(lastname, '') ILIKE $1
        OR COALESCE(email, '') ILIKE $1
    `
    : "";

  const listParams = searchPattern
    ? [searchPattern, limit, offset]
    : [limit, offset];

  const countParams = searchPattern ? [searchPattern] : [];

  const [usersResult, countResult] = await Promise.all([
    query<DbUserRow>(
      `
        SELECT id, firstname, lastname, email, image_url
        FROM users
        ${filters}
        ORDER BY COALESCE(firstname, ''), COALESCE(lastname, ''), id
        LIMIT $${searchPattern ? 2 : 1}
        OFFSET $${searchPattern ? 3 : 2}
      `,
      listParams,
    ),
    query<CountRow>(
      `
        SELECT COUNT(*)::int AS total
        FROM users
        ${filters}
      `,
      countParams,
    ),
  ]);

  const users = usersResult.rows.map((user) => ({
    id: user.id,
    firstName: user.firstname,
    lastName: user.lastname,
    email: user.email,
    imageUrl: user.image_url,
  }));

  let lockedByUserId = new Map<string, boolean>();

  if (users.length > 0) {
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({
      userId: users.map((user) => user.id),
      limit: users.length,
    });

    lockedByUserId = new Map(
      clerkUsers.data.map((user) => [user.id, user.locked]),
    );
  }

  return {
    users: users.map((user) => ({
      ...user,
      locked: lockedByUserId.get(user.id) ?? false,
    })),
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
}

function normalizeCreateUserInput(input: CreateDashboardUserInput) {
  return {
    email: input.email.trim().toLowerCase(),
  };
}

async function assertUserDoesNotExist(email: string) {
  const existingDatabaseUser = await query<ExistingUserEmailRow>(
    `
      SELECT email
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email],
  );

  if (existingDatabaseUser.rows[0]) {
    throw new DashboardUserAlreadyExistsError(email);
  }

  const client = await clerkClient();
  const existingClerkUsers = await client.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });

  if (existingClerkUsers.data[0]) {
    throw new DashboardUserAlreadyExistsError(email);
  }
}
export async function createUserInvitation(input: CreateDashboardUserInput) {
  const normalized = normalizeCreateUserInput(input);
  const client = await clerkClient();

  await assertUserDoesNotExist(normalized.email);

  return client.invitations.createInvitation({
    emailAddress: normalized.email,
  });
}

function getPrimaryEmailFromClerkUser(user: ClerkWebhookUser): string | null {
  const primaryEmail = user.email_addresses.find(
    (emailAddress) => emailAddress.id === user.primary_email_address_id,
  );

  return primaryEmail?.email_address ?? user.email_addresses[0]?.email_address ?? null;
}

export async function upsertUserFromClerkUser(user: ClerkWebhookUser) {
  const email = getPrimaryEmailFromClerkUser(user);

  if (!email) {
    throw new Error(`Clerk user ${user.id} does not have an email address.`);
  }

  await query(
    `
      INSERT INTO users (id, firstname, lastname, email, image_url)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id)
      DO UPDATE SET
        firstname = EXCLUDED.firstname,
        lastname = EXCLUDED.lastname,
        email = EXCLUDED.email,
        image_url = EXCLUDED.image_url
    `,
    [
      user.id,
      user.first_name,
      user.last_name,
      email.toLowerCase(),
      user.has_image ? user.image_url : null,
    ],
  );
}

export async function deleteUserFromMirror(userId: string) {
  await query(
    `
      DELETE FROM users
      WHERE id = $1
    `,
    [userId],
  );
}

async function revokeUserSessions(userId: string) {
  const client = await clerkClient();
  let offset = 0;
  const limit = 100;

  while (true) {
    const sessions = await client.sessions.getSessionList({
      userId,
      limit,
      offset,
    });

    await Promise.all(
      sessions.data.map((session) => client.sessions.revokeSession(session.id)),
    );

    offset += sessions.data.length;

    if (offset >= sessions.totalCount || sessions.data.length === 0) {
      break;
    }
  }
}

export async function lockDashboardUser(userId: string) {
  const client = await clerkClient();

  const user = await client.users.lockUser(userId);
  await revokeUserSessions(userId);

  return user;
}

export async function unlockDashboardUser(userId: string) {
  const client = await clerkClient();

  return client.users.unlockUser(userId);
}

export async function deleteDashboardUser(userId: string) {
  const client = await clerkClient();

  await client.users.deleteUser(userId);
}
