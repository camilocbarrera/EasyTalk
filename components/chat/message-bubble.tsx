"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { type LanguageCode } from "@/lib/constants/languages";
import { Languages, Dot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  return (
    <div
      className={cn(
        "flex gap-2.5 mb-3",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for other users - aligned to bottom */}
      {!isOwnMessage && (
        <div className="flex flex-col justify-end">
          {showHeader ? (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={userImageUrl || undefined} alt={userName} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-blue-600 text-white">
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
        {/* Name and time - only for others */}
        {showHeader && !isOwnMessage && (
          <div className="flex items-center gap-2 text-xs px-1 mb-0.5">
            <span className="font-medium text-muted-foreground">{userName}</span>
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
            "py-3 px-4 text-[15px] leading-relaxed rounded-2xl",
            isOwnMessage
              ? "bg-blue-50 text-blue-600 rounded-br-md"
              : "bg-muted/60 text-foreground rounded-bl-md"
          )}
        >
          {displayContent}
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

        {/* Translation toggle - only show if translation exists */}
        {needsTranslation && hasTranslation && (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors px-1"
            onClick={() => setShowOriginal(!showOriginal)}
          >
            <Languages className="h-3 w-3" />
            {showOriginal ? "Show translation" : "Show original"}
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
