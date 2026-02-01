import { auth } from "@clerk/nextjs/server";
import { db, userLanguagePreferences, users } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ensureUserInDb } from "@/lib/auth/ensure-user";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/constants/languages";

const MAX_LANGUAGES = 3;

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await ensureUserInDb(userId);
  if (!user) {
    return NextResponse.json(
      { error: "Failed to sync user. Please try again." },
      { status: 500 }
    );
  }

  // Get user's language preferences ordered by priority
  const preferences = await db.query.userLanguagePreferences.findMany({
    where: eq(userLanguagePreferences.userId, userId),
    orderBy: [asc(userLanguagePreferences.priority)],
  });

  // If no preferences exist, create one from the legacy languagePreference field
  if (preferences.length === 0) {
    const legacyLanguage = user.languagePreference as LanguageCode || "en";
    await db.insert(userLanguagePreferences).values({
      userId,
      languageCode: legacyLanguage,
      priority: 0,
    });
    return NextResponse.json([
      { languageCode: legacyLanguage, priority: 0 },
    ]);
  }

  return NextResponse.json(
    preferences.map((p) => ({
      languageCode: p.languageCode,
      priority: p.priority,
    }))
  );
}

export async function PUT(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await ensureUserInDb(userId);
  if (!user) {
    return NextResponse.json(
      { error: "Failed to sync user. Please try again." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { languages } = body as { languages: LanguageCode[] };

  if (!Array.isArray(languages) || languages.length === 0) {
    return NextResponse.json(
      { error: "At least one language is required" },
      { status: 400 }
    );
  }

  if (languages.length > MAX_LANGUAGES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_LANGUAGES} languages allowed` },
      { status: 400 }
    );
  }

  // Validate all language codes
  const invalidLanguages = languages.filter(
    (lang) => !(lang in SUPPORTED_LANGUAGES)
  );
  if (invalidLanguages.length > 0) {
    return NextResponse.json(
      { error: `Invalid language codes: ${invalidLanguages.join(", ")}` },
      { status: 400 }
    );
  }

  // Remove duplicates while preserving order
  const uniqueLanguages = [...new Set(languages)];

  // Delete existing preferences
  await db
    .delete(userLanguagePreferences)
    .where(eq(userLanguagePreferences.userId, userId));

  // Insert new preferences with priority based on array order
  const newPreferences = uniqueLanguages.map((languageCode, index) => ({
    userId,
    languageCode,
    priority: index,
  }));

  await db.insert(userLanguagePreferences).values(newPreferences);

  // Also update the legacy languagePreference field to the primary language
  await db
    .update(users)
    .set({
      languagePreference: uniqueLanguages[0],
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return NextResponse.json(
    newPreferences.map((p) => ({
      languageCode: p.languageCode,
      priority: p.priority,
    }))
  );
}
