import { generateText, generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { db, translations, type NewTranslation } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/constants/languages";
import { broadcastTranslation } from "@/lib/supabase/broadcast";

export { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/constants/languages";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const TRANSLATION_MODEL = "openai/gpt-oss-20b";

// Schema for all translations response
const translationsSchema = z.object({
  en: z.string().describe("English translation"),
  es: z.string().describe("Spanish translation"),
  fr: z.string().describe("French translation"),
  de: z.string().describe("German translation"),
  it: z.string().describe("Italian translation"),
  pt: z.string().describe("Portuguese translation"),
  zh: z.string().describe("Chinese translation"),
  ja: z.string().describe("Japanese translation"),
  ko: z.string().describe("Korean translation"),
  ar: z.string().describe("Arabic translation"),
  ru: z.string().describe("Russian translation"),
  hi: z.string().describe("Hindi translation"),
});

export async function translateMessage(
  messageId: string,
  content: string,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): Promise<string> {
  if (sourceLanguage === targetLanguage) {
    return content;
  }

  const cached = await db.query.translations.findFirst({
    where: and(
      eq(translations.messageId, messageId),
      eq(translations.targetLanguage, targetLanguage)
    ),
  });

  if (cached) {
    return cached.translatedContent;
  }

  const { text: translatedContent } = await generateText({
    model: groq(TRANSLATION_MODEL),
    prompt: `Translate the following text from ${SUPPORTED_LANGUAGES[sourceLanguage]} to ${SUPPORTED_LANGUAGES[targetLanguage]}.
Only respond with the translation, no explanations or additional text.

Text to translate:
${content}`,
  });

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

  if (detectedCode in SUPPORTED_LANGUAGES) {
    return detectedCode;
  }

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

export async function translateMessageToAllLanguages(
  sessionId: string,
  messageId: string,
  content: string,
  sourceLanguage: LanguageCode
): Promise<Record<LanguageCode, string>> {
  // Single API call to translate to all 12 languages
  const { object: allTranslations } = await generateObject({
    model: groq(TRANSLATION_MODEL),
    schema: translationsSchema,
    prompt: `Translate the following text from ${SUPPORTED_LANGUAGES[sourceLanguage]} to all 12 languages.
Keep the original text for ${SUPPORTED_LANGUAGES[sourceLanguage]} (${sourceLanguage}).

Text to translate:
${content}`,
  });

  // Save all translations to DB
  const allLanguages = Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[];
  const translationsToInsert: NewTranslation[] = [];

  for (const lang of allLanguages) {
    if (lang === sourceLanguage) continue;

    translationsToInsert.push({
      messageId,
      targetLanguage: lang,
      translatedContent: allTranslations[lang],
    });
  }

  // Batch insert all translations
  if (translationsToInsert.length > 0) {
    await db.insert(translations).values(translationsToInsert);
  }

  // Broadcast all translations to clients
  console.log(`[Translation] Broadcasting ${translationsToInsert.length} translations for message ${messageId}`);
  await Promise.all(
    translationsToInsert.map(({ targetLanguage, translatedContent }) =>
      broadcastTranslation(sessionId, messageId, targetLanguage, translatedContent)
    )
  );
  console.log(`[Translation] Broadcasts complete for message ${messageId}`);

  return allTranslations;
}
