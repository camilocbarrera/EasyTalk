import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { db, translations, type NewTranslation } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/constants/languages";

export { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/constants/languages";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

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
    model: groq("llama-3.3-70b-versatile"),
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
    model: groq("llama-3.3-70b-versatile"),
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

export async function translateMessageForParticipants(
  messageId: string,
  content: string,
  sourceLanguage: LanguageCode,
  targetLanguages: LanguageCode[]
): Promise<Record<LanguageCode, string>> {
  const results: Partial<Record<LanguageCode, string>> = {};

  // Filter out source language and get unique targets
  const uniqueTargets = [
    ...new Set(targetLanguages.filter((lang) => lang !== sourceLanguage)),
  ];

  // Translate to all target languages in parallel
  await Promise.all(
    uniqueTargets.map(async (targetLanguage) => {
      const translated = await translateMessage(
        messageId,
        content,
        sourceLanguage,
        targetLanguage
      );
      results[targetLanguage] = translated;
    })
  );

  // Include original for source language
  results[sourceLanguage] = content;

  return results as Record<LanguageCode, string>;
}
