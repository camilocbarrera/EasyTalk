"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LanguageBadge } from "./language-badge";
import { type LanguageCode } from "@/lib/constants/languages";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  content: string;
  translatedContent?: string;
  originalLanguage: LanguageCode;
  userName: string;
  userImageUrl?: string | null;
  timestamp: string;
  isOwnMessage: boolean;
  showHeader: boolean;
  userLanguage: LanguageCode;
}

export function MessageBubble({
  content,
  translatedContent,
  originalLanguage,
  userName,
  timestamp,
  isOwnMessage,
  showHeader,
  userLanguage,
}: MessageBubbleProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const isTranslated = originalLanguage !== userLanguage && translatedContent;
  const displayContent =
    isTranslated && !showOriginal ? translatedContent : content;

  return (
    <div
      className={cn("flex mt-2", isOwnMessage ? "justify-end" : "justify-start")}
    >
      <div
        className={cn("max-w-[75%] w-fit flex flex-col gap-1", {
          "items-end": isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn("flex items-center gap-2 text-xs px-3", {
              "justify-end flex-row-reverse": isOwnMessage,
            })}
          >
            <span className="font-medium">{userName}</span>
            <LanguageBadge language={originalLanguage} size="sm" />
            <span className="text-foreground/50 text-xs">
              {new Date(timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            "py-2 px-3 rounded-xl text-sm w-fit",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {displayContent}
        </div>
        {isTranslated && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-muted-foreground"
            onClick={() => setShowOriginal(!showOriginal)}
          >
            <Languages className="h-3 w-3" />
            {showOriginal ? "Show translation" : "Show original"}
          </Button>
        )}
      </div>
    </div>
  );
}
