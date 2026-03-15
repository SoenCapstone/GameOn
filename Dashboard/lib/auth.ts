import { clerkClient } from "@clerk/nextjs/server";

const adminRole = "admin";

function isAdminRole(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === adminRole;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function getRoleFromSessionClaims(sessionClaims: unknown) {
  const claims = asRecord(sessionClaims);

  if (!claims) {
    return undefined;
  }

  if (isAdminRole(claims.role)) {
    return claims.role;
  }

  const metadataRole = asRecord(claims.metadata)?.role;

  if (isAdminRole(metadataRole)) {
    return metadataRole;
  }

  const publicMetadataRole =
    asRecord(claims.publicMetadata)?.role ??
    asRecord(claims.public_metadata)?.role;

  if (isAdminRole(publicMetadataRole)) {
    return publicMetadataRole;
  }

  return undefined;
}

export async function isAdmin({
  userId,
  email,
  sessionClaims,
}: {
  userId?: string;
  email?: string;
  sessionClaims?: unknown;
}): Promise<boolean> {
  if (getRoleFromSessionClaims(sessionClaims)) {
    return true;
  }

  try {
    const client = await clerkClient();

    let user:
      | {
          publicMetadata?: Record<string, unknown>;
        }
      | undefined;

    if (userId) {
      user = await client.users.getUser(userId);
    } else if (email) {
      const users = await client.users.getUserList({
        emailAddress: [email],
        limit: 1,
      });
      user = users.data[0];
    }

    if (!user) {
      return false;
    }

    return isAdminRole(
      (user.publicMetadata as Record<string, unknown> | undefined)?.role,
    );
  } catch {
    return false;
  }
}
