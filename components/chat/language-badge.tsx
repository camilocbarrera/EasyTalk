import { Badge } from "@/components/ui/badge";
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/lib/constants/languages";

const LANGUAGE_FLAGS: Record<LanguageCode, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  it: "🇮🇹",
  pt: "🇵🇹",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  ar: "🇸🇦",
  ru: "🇷🇺",
  hi: "🇮🇳",
};

interface LanguageBadgeProps {
  language: LanguageCode;
  size?: "sm" | "default";
  showFlag?: boolean;
  showName?: boolean;
}

export function LanguageBadge({
  language,
  size = "default",
  showFlag = false,
  showName = true,
}: LanguageBadgeProps) {
  const languageName = SUPPORTED_LANGUAGES[language] || language;
  const flag = LANGUAGE_FLAGS[language];

  return (
    <Badge
      variant="secondary"
      className={size === "sm" ? "text-[10px] px-1.5 py-0 gap-1" : "gap-1"}
    >
      {showFlag && flag && <span>{flag}</span>}
      {showName && <span>{languageName}</span>}
    </Badge>
  );
}

export { LANGUAGE_FLAGS };
