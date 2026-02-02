import { auth } from "@clerk/nextjs/server";
import { db, messages } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { translateMessage, type LanguageCode } from "@/lib/translation/service";
import { broadcastTranslation } from "@/lib/supabase/broadcast";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { messageIds, targetLanguage, sessionId } = body as {
    messageIds: string[];
    targetLanguage: LanguageCode;
    sessionId: string;
  };

  if (!messageIds?.length || !targetLanguage || !sessionId) {
    return NextResponse.json(
      { error: "messageIds, targetLanguage, and sessionId are required" },
      { status: 400 }
    );
  }

  // Fetch messages
  const messagesToTranslate = await db.query.messages.findMany({
    where: inArray(messages.id, messageIds),
    with: {
      translations: true,
    },
  });

  // Filter to only messages that need translation
  const needsTranslation = messagesToTranslate.filter((msg) => {
    if (msg.originalLanguage === targetLanguage) return false;
    return !msg.translations.some((t) => t.targetLanguage === targetLanguage);
  });

  // Translate all in parallel and broadcast each
  const results: Record<string, string> = {};

  await Promise.all(
    needsTranslation.map(async (msg) => {
      const translated = await translateMessage(
        msg.id,
        msg.content,
        msg.originalLanguage as LanguageCode,
        targetLanguage
      );
      results[msg.id] = translated;

      // Broadcast to all clients in the session
      await broadcastTranslation(sessionId, msg.id, targetLanguage, translated);
    })
  );

  return NextResponse.json({ translations: results });
}
