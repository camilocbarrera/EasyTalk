"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import {
  useSessionChat,
  type ChatMessageWithTranslation,
} from "@/hooks/use-session-chat";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, MessageCircle, Globe } from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/lib/constants/languages";
import { LANGUAGE_FLAGS } from "@/components/chat/language-badge";

interface SessionChatProps {
  sessionId: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  userLanguages: LanguageCode[];
  initialMessages: {
    id: string;
    content: string;
    originalLanguage: string;
    userId: string;
    user: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      username?: string | null;
      imageUrl?: string | null;
    };
    translations: { targetLanguage: string; translatedContent: string }[];
    createdAt: Date;
  }[];
}

export function SessionChat({
  sessionId,
  userId,
  userName,
  userImageUrl,
  userLanguages: initialUserLanguages,
  initialMessages,
}: SessionChatProps) {
  const { containerRef, scrollToBottom } = useChatScroll();
  const [newMessage, setNewMessage] = useState("");
  const [userLanguages, setUserLanguages] =
    useState<LanguageCode[]>(initialUserLanguages);
  const translationRequestedRef = useRef<Set<string>>(new Set());

  // Primary language is the first in the array
  const primaryLanguage = userLanguages[0] || "en";

  const {
    messages,
    sendMessage,
    isConnected,
    onlineUsers,
    addInitialMessages,
  } = useSessionChat({
    sessionId,
    userId,
    userName,
    userImageUrl,
    userLanguages,
  });

  // Load initial messages on mount
  useEffect(() => {
    addInitialMessages(initialMessages);
  }, [initialMessages, addInitialMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Request translations for messages missing them when language changes
  useEffect(() => {
    if (messages.length === 0) return;

    const messagesNeedingTranslation = messages.filter((msg) => {
      // Skip if already in user's language
      if (msg.originalLanguage === primaryLanguage) return false;
      // Skip if translation already exists
      if (msg.translations[primaryLanguage]) return false;
      // Skip if we already requested this translation
      const requestKey = `${msg.id}-${primaryLanguage}`;
      if (translationRequestedRef.current.has(requestKey)) return false;
      return true;
    });

    if (messagesNeedingTranslation.length === 0) return;

    // Mark as requested to prevent duplicate requests
    messagesNeedingTranslation.forEach((msg) => {
      translationRequestedRef.current.add(`${msg.id}-${primaryLanguage}`);
    });

    // Request translations (fire and forget - updates come via broadcast)
    fetch("/api/messages/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageIds: messagesNeedingTranslation.map((m) => m.id),
        targetLanguage: primaryLanguage,
        sessionId,
      }),
    }).catch(console.error);
  }, [messages, primaryLanguage, sessionId]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !isConnected) return;

      sendMessage(newMessage);
      setNewMessage("");
    },
    [newMessage, isConnected, sendMessage]
  );

  const handleLanguageChange = useCallback((language: LanguageCode) => {
    // Update primary language (put it first in the array)
    setUserLanguages((prev) => {
      const filtered = prev.filter((l) => l !== language);
      return [language, ...filtered].slice(0, 3);
    });

    // Persist to user preferences (non-blocking)
    fetch("/api/users/me/languages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        languages: [language],
      }),
    }).catch(console.error);
  }, []);

  // Determine what content to show for a message
  const getDisplayContent = (
    message: ChatMessageWithTranslation
  ): { content: string; isTranslation: boolean } => {
    // If message is in one of the user's preferred languages, show original
    if (userLanguages.includes(message.originalLanguage)) {
      return { content: message.content, isTranslation: false };
    }

    // Otherwise, try to show translation in primary language
    const translation = message.translations[primaryLanguage];
    if (translation) {
      return { content: translation, isTranslation: true };
    }

    // Fallback to original if no translation available yet
    return { content: message.content, isTranslation: false };
  };

  return (
    <div className="flex flex-col h-full w-full bg-muted/30 antialiased">
      {/* Chat container - constrained width */}
      <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-background shadow-sm">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
              )}
            />
            <span className="text-sm text-muted-foreground">
              {isConnected
                ? onlineUsers.length > 0
                  ? `${onlineUsers.length} online`
                  : "Connected"
                : "Connecting..."}
            </span>
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select
              value={primaryLanguage}
              onValueChange={(value) =>
                handleLanguageChange(value as LanguageCode)
              }
            >
              <SelectTrigger className="h-8 w-[130px] text-xs border-0 bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                  <SelectItem key={code} value={code} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span>{LANGUAGE_FLAGS[code as LanguageCode]}</span>
                      <span>{name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs opacity-70 mt-1">Start the conversation!</p>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => {
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showHeader =
                  !prevMessage || prevMessage.user.id !== message.user.id;

                const { content, isTranslation } = getDisplayContent(message);

                return (
                  <div
                    key={message.id}
                    className="animate-in fade-in slide-in-from-bottom-1 duration-200"
                  >
                    <MessageBubble
                      content={message.content}
                      translatedContent={isTranslation ? content : undefined}
                      originalLanguage={message.originalLanguage}
                      userName={message.user.name}
                      userImageUrl={message.user.imageUrl}
                      timestamp={message.createdAt}
                      isOwnMessage={message.user.id === userId}
                      showHeader={showHeader}
                      userLanguage={primaryLanguage}
                      showTranslatedByDefault={isTranslation}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-border/50"
        >
          <div className="flex items-center gap-2 bg-muted/40 rounded-full px-4 py-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={!isConnected || !newMessage.trim()}
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                newMessage.trim()
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "text-muted-foreground"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
