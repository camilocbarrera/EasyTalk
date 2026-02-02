import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { db, translations, type NewTranslation } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/constants/languages";
import { broadcastTranslation } from "@/lib/supabase/broadcast";

export { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/constants/languages";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Use faster model for translations
const TRANSLATION_MODEL = "openai/gpt-oss-20b";

export async function translateMessage(
  messageId: string,
  content: string,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): Promise<string> {
  // Don't translate if same language
  if (sourceLanguage === targetLanguage) {
    return content;
  }

  // Check cache first
  const cached = await db.query.translations.findFirst({
    where: and(
      eq(translations.messageId, messageId),
      eq(translations.targetLanguage, targetLanguage)
    ),
  });

  if (cached) {
    return cached.translatedContent;
  }

  // Call GROQ for translation
  const { text: translatedContent } = await generateText({
    model: groq(TRANSLATION_MODEL),
    prompt: `Translate the following text from ${SUPPORTED_LANGUAGES[sourceLanguage]} to ${SUPPORTED_LANGUAGES[targetLanguage]}.
Only respond with the translation, no explanations or additional text.

Text to translate:
${content}`,
  });

  // Store in cache
  const newTranslation: NewTranslation = {
    messageId,
    targetLanguage,
    translatedContent,
  };

  await db.insert(translations).values(newTranslation);

  return translatedContent;
}

export async function detectLanguage(content: string): Promise<LanguageCode> {
  const { text } = await generateText({
    model: groq(TRANSLATION_MODEL),
    prompt: `Detect the language of the following text and respond with ONLY the ISO 639-1 language code (e.g., en, es, fr, de, it, pt, zh, ja, ko, ar, ru, hi).

Text:
${content}`,
  });

  const detectedCode = text.trim().toLowerCase() as LanguageCode;

  // Validate that it's a supported language
  if (detectedCode in SUPPORTED_LANGUAGES) {
    return detectedCode;
  }

  // Default to English if detection fails
  return "en";
}

export async function getTranslationsForMessage(
  messageId: string
): Promise<Record<LanguageCode, string>> {
  const messageTranslations = await db.query.translations.findMany({
    where: eq(translations.messageId, messageId),
  });

  const result: Partial<Record<LanguageCode, string>> = {};

  for (const translation of messageTranslations) {
    result[translation.targetLanguage as LanguageCode] =
      translation.translatedContent;
  }

  return result as Record<LanguageCode, string>;
}

interface LanguageWithPriority {
  languageCode: LanguageCode;
  priority: number;
}

export async function translateMessageForParticipants(
  sessionId: string,
  messageId: string,
  content: string,
  sourceLanguage: LanguageCode,
  targetLanguages: LanguageCode[] | LanguageWithPriority[]
): Promise<Record<LanguageCode, string>> {
  const results: Partial<Record<LanguageCode, string>> = {};

  // Normalize input - handle both simple array and priority-based array
  let languagesWithPriority: LanguageWithPriority[];

  if (targetLanguages.length > 0 && typeof targetLanguages[0] === "object") {
    languagesWithPriority = targetLanguages as LanguageWithPriority[];
  } else {
    languagesWithPriority = (targetLanguages as LanguageCode[]).map(
      (languageCode, index) => ({ languageCode, priority: index })
    );
  }

  // Filter out source language and get unique targets, sorted by priority
  const uniqueTargets = languagesWithPriority
    .filter((lang) => lang.languageCode !== sourceLanguage)
    .sort((a, b) => a.priority - b.priority)
    .reduce((acc, lang) => {
      if (!acc.some((l) => l.languageCode === lang.languageCode)) {
        acc.push(lang);
      }
      return acc;
    }, [] as LanguageWithPriority[]);

  // Translate primary languages first (priority 0), then secondary
  const primaryLanguages = uniqueTargets.filter((l) => l.priority === 0);
  const secondaryLanguages = uniqueTargets.filter((l) => l.priority > 0);

  // Translate primary languages first (in parallel)
  if (primaryLanguages.length > 0) {
    await Promise.all(
      primaryLanguages.map(async ({ languageCode }) => {
        const translated = await translateMessage(
          messageId,
          content,
          sourceLanguage,
          languageCode
        );
        results[languageCode] = translated;

        // Broadcast translation to connected clients
        await broadcastTranslation(sessionId, messageId, languageCode, translated);
      })
    );
  }

  // Then translate secondary languages (in parallel)
  if (secondaryLanguages.length > 0) {
    await Promise.all(
      secondaryLanguages.map(async ({ languageCode }) => {
        const translated = await translateMessage(
          messageId,
          content,
          sourceLanguage,
          languageCode
        );
        results[languageCode] = translated;

        // Broadcast translation to connected clients
        await broadcastTranslation(sessionId, messageId, languageCode, translated);
      })
    );
  }

  // Include original for source language
  results[sourceLanguage] = content;

  return results as Record<LanguageCode, string>;
}
