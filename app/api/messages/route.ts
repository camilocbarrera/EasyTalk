import { auth } from "@clerk/nextjs/server";
import { db, messages, users, sessions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  translateMessageForParticipants,
  detectLanguage,
  type LanguageCode,
} from "@/lib/translation/service";

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
      participants: {
        with: {
          user: true,
        },
      },
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

  // Get user's language preference
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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

  // Get all participant languages for translation
  const participantLanguages = session.participants
    .map((p) => p.user.languagePreference as LanguageCode)
    .filter((lang) => lang && lang !== originalLanguage);

  // Translate in background (don't block response)
  if (participantLanguages.length > 0) {
    translateMessageForParticipants(
      message.id,
      content,
      originalLanguage,
      participantLanguages
    ).catch((err) => {
      console.error("Translation error:", err);
    });
  }

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
