import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  // If no webhook secret, accept all requests (dev mode)
  if (!WEBHOOK_SECRET) {
    const payload = await req.json();
    return handleWebhookEvent(payload as WebhookEvent);
  }

  // Verify webhook signature
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Verification failed", { status: 400 });
  }

  return handleWebhookEvent(evt);
}

async function handleWebhookEvent(evt: WebhookEvent) {
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, username, first_name, last_name, image_url } =
      evt.data;

    const primaryEmail =
      email_addresses.find((e) => e.id === evt.data.primary_email_address_id)
        ?.email_address || email_addresses[0]?.email_address;

    if (!primaryEmail) {
      return new Response("Error: No email found", { status: 400 });
    }

    const userData = {
      id,
      email: primaryEmail,
      username: username || null,
      firstName: first_name || null,
      lastName: last_name || null,
      imageUrl: image_url || null,
      updatedAt: new Date(),
    };

    await db
      .insert(users)
      .values({ ...userData, createdAt: new Date() })
      .onConflictDoUpdate({
        target: users.id,
        set: userData,
      });

    return new Response("User synced", { status: 200 });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (id) {
      await db.delete(users).where(eq(users.id, id));
    }

    return new Response("User deleted", { status: 200 });
  }

  return new Response("Webhook received", { status: 200 });
}
