"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { type LanguageCode } from "@/lib/constants/languages";
import { Languages, Dot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LANGUAGE_FLAGS } from "@/components/chat/language-badge";

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
  userImageUrl,
  timestamp,
  isOwnMessage,
  showHeader,
  userLanguage,
}: MessageBubbleProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const needsTranslation = originalLanguage !== userLanguage;
  const hasTranslation = translatedContent !== undefined;
  const isTranslating = needsTranslation && !hasTranslation;
  const isShowingTranslation = hasTranslation && !showOriginal;

  // Always show translation when available, unless user toggled to original
  let displayContent: string;
  if (hasTranslation && !showOriginal) {
    displayContent = translatedContent;
  } else {
    displayContent = content;
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const flag = LANGUAGE_FLAGS[originalLanguage];

  return (
    <div
      className={cn(
        "flex gap-2.5 mb-3",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for other users */}
      {!isOwnMessage && (
        <div className="flex flex-col justify-end">
          {showHeader ? (
            <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-background shadow-sm">
              <AvatarImage src={userImageUrl || undefined} alt={userName} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-purple-600 text-white font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8 flex-shrink-0" />
          )}
        </div>
      )}

      <div
        className={cn("max-w-[280px] flex flex-col gap-1", {
          "items-end": isOwnMessage,
          "items-start": !isOwnMessage,
        })}
      >
        {/* Name and time */}
        {showHeader && !isOwnMessage && (
          <div className="flex items-center gap-2 text-xs px-1 mb-0.5">
            <span className="font-medium text-foreground/80">{userName}</span>
            <span className="text-muted-foreground/60">
              {new Date(timestamp).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "relative py-3 px-4 text-[15px] leading-relaxed rounded-2xl shadow-sm",
            isOwnMessage
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
              : "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-zinc-800 dark:to-zinc-900 text-foreground rounded-bl-md border border-border/50"
          )}
        >
          {displayContent}

          {/* Language flag badge for translated messages */}
          {isShowingTranslation && flag && (
            <span
              className={cn(
                "absolute -bottom-1 text-[10px] opacity-50 hover:opacity-100 transition-opacity",
                isOwnMessage ? "left-2" : "right-2"
              )}
              title={`Translated from ${originalLanguage}`}
            >
              {flag}
            </span>
          )}
        </div>

        {/* Translating indicator */}
        {isTranslating && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground px-1">
            <Languages className="h-3 w-3" />
            <span>Translating</span>
            <div className="flex -space-x-2">
              <Dot className="h-4 w-4 animate-typing-dot-bounce" />
              <Dot className="h-4 w-4 animate-typing-dot-bounce [animation-delay:150ms]" />
              <Dot className="h-4 w-4 animate-typing-dot-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Translation toggle */}
        {needsTranslation && hasTranslation && (
          <button
            className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors px-1"
            onClick={() => setShowOriginal(!showOriginal)}
          >
            <Languages className="h-2.5 w-2.5" />
            <span>{showOriginal ? "translated" : "original"}</span>
          </button>
        )}

        {/* Time for own messages */}
        {isOwnMessage && showHeader && (
          <span className="text-[10px] text-muted-foreground/60 px-1">
            {new Date(timestamp).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        )}
      </div>
    </div>
  );
}
