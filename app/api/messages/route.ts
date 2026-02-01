import { auth } from "@clerk/nextjs/server";
import { db, messages, sessions, userLanguagePreferences } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  translateMessageForParticipants,
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

  // Get all participant language preferences (multiple per user)
  const participantUserIds = session.participants.map((p) => p.userId);

  // Fetch all language preferences for all participants
  const allLanguagePreferences = await Promise.all(
    participantUserIds.map(async (participantUserId) => {
      const prefs = await db.query.userLanguagePreferences.findMany({
        where: eq(userLanguagePreferences.userId, participantUserId),
        orderBy: [asc(userLanguagePreferences.priority)],
      });

      // If no preferences in new table, fall back to legacy field
      if (prefs.length === 0) {
        const participant = session.participants.find(
          (p) => p.userId === participantUserId
        );
        const legacyLang = participant?.user.languagePreference as LanguageCode;
        if (legacyLang) {
          return [{ languageCode: legacyLang, priority: 0 }];
        }
        return [];
      }

      return prefs.map((p) => ({
        languageCode: p.languageCode as LanguageCode,
        priority: p.priority,
      }));
    })
  );

  // Flatten and deduplicate, keeping lowest priority for each language
  const languageMap = new Map<LanguageCode, number>();
  for (const prefs of allLanguagePreferences) {
    for (const pref of prefs) {
      const existing = languageMap.get(pref.languageCode);
      if (existing === undefined || pref.priority < existing) {
        languageMap.set(pref.languageCode, pref.priority);
      }
    }
  }

  const targetLanguages = Array.from(languageMap.entries())
    .filter(([lang]) => lang !== originalLanguage)
    .map(([languageCode, priority]) => ({ languageCode, priority }));

  // Translate in background (don't block response)
  if (targetLanguages.length > 0) {
    translateMessageForParticipants(
      sessionId,
      message.id,
      content,
      originalLanguage,
      targetLanguages
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
