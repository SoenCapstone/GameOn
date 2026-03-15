import { clerkClient } from "@clerk/nextjs/server";

const adminRole = "admin";

function isAdminRole(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === adminRole;
}

export async function isAdmin({
  userId,
  email,
}: {
  userId?: string;
  email?: string;
}): Promise<boolean> {
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
