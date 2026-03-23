import { verifyWebhook } from "@clerk/backend/webhooks";
import { NextResponse } from "next/server";
import { deleteUserFromMirror, upsertUserFromClerkUser } from "@/lib/users";

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

function isClerkWebhookUser(value: unknown): value is ClerkWebhookUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    Array.isArray(user.email_addresses) &&
    typeof user.image_url === "string" &&
    typeof user.has_image === "boolean"
  );
}

export async function POST(request: Request) {
  try {
    const event = await verifyWebhook(request);

    if (event.type === "user.created" || event.type === "user.updated") {
      if (!isClerkWebhookUser(event.data)) {
        return NextResponse.json(
          { error: "Invalid Clerk user payload" },
          { status: 400 },
        );
      }

      await upsertUserFromClerkUser(event.data);
    }

    if (event.type === "user.deleted") {
      const deletedUserId = event.data.id;

      if (typeof deletedUserId === "string") {
        await deleteUserFromMirror(deletedUserId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to process Clerk webhook", error);

    return NextResponse.json(
      { error: "Failed to process Clerk webhook" },
      { status: 400 },
    );
  }
}
