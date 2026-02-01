import { Badge } from "@/components/ui/badge";
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/lib/constants/languages";

interface LanguageBadgeProps {
  language: LanguageCode;
  size?: "sm" | "default";
}

export function LanguageBadge({ language, size = "default" }: LanguageBadgeProps) {
  const languageName = SUPPORTED_LANGUAGES[language] || language;

  return (
    <Badge
      variant="secondary"
      className={size === "sm" ? "text-[10px] px-1.5 py-0" : ""}
    >
      {languageName}
    </Badge>
  );
}
