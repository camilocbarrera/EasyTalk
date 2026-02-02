import { auth } from "@clerk/nextjs/server";
import { db, messages, sessions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  translateMessageToAllLanguages,
  detectLanguage,
  type LanguageCode,
} from "@/lib/translation/service";
import { ensureUserInDb } from "@/lib/auth/ensure-user";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sessionId, content } = body;

  if (!sessionId || !content) {
    return NextResponse.json(
      { error: "sessionId and content are required" },
      { status: 400 }
    );
  }

  // Verify session exists and user is participant
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      participants: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isParticipant = session.participants.some((p) => p.userId === userId);
  const isCreator = session.creatorId === userId;

  if (!isParticipant && !isCreator) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  // Ensure user exists in database (sync from Clerk if needed)
  const user = await ensureUserInDb(userId);
  if (!user) {
    return NextResponse.json(
      { error: "Failed to sync user. Please try again." },
      { status: 500 }
    );
  }

  // Detect language of the message (or use user's preference)
  const detectedLanguage = await detectLanguage(content);
  const originalLanguage = detectedLanguage || (user.languagePreference as LanguageCode) || "en";

  // Create message
  const [message] = await db
    .insert(messages)
    .values({
      sessionId,
      userId,
      content,
      originalLanguage,
    })
    .returning();

  // Translate to ALL languages in background (don't block response)
  translateMessageToAllLanguages(
    sessionId,
    message.id,
    content,
    originalLanguage
  ).catch((err) => {
    console.error("Translation error:", err);
  });

  // Return message with user info
  const fullMessage = await db.query.messages.findFirst({
    where: eq(messages.id, message.id),
    with: {
      user: true,
      translations: true,
    },
  });

  return NextResponse.json(fullMessage, { status: 201 });
}
