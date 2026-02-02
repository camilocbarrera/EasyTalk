"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useSessionChat } from "@/hooks/use-session-chat";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, MessageCircle, Globe, ArrowDown, Languages } from "lucide-react";
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
  const [newMessage, setNewMessage] = useState("");
  const [userLanguages, setUserLanguages] =
    useState<LanguageCode[]>(initialUserLanguages);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const primaryLanguage = userLanguages[0] || "en";

  const {
    messages,
    sendMessage,
    isConnected,
    onlineUsers,
    addInitialMessages,
    refreshTranslations,
  } = useSessionChat({
    sessionId,
    userId,
    userName,
    userImageUrl,
    userLanguages,
  });

  const {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  } = useAutoScroll([messages]);

  useEffect(() => {
    addInitialMessages(initialMessages);
  }, [initialMessages, addInitialMessages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "0px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + "px";
    }
  }, [newMessage]);

  const handleSendMessage = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!newMessage.trim() || !isConnected) return;

      sendMessage(newMessage);
      setNewMessage("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [newMessage, isConnected, sendMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLanguageChange = useCallback(
    (language: LanguageCode) => {
      setUserLanguages((prev) => {
        const filtered = prev.filter((l) => l !== language);
        return [language, ...filtered].slice(0, 3);
      });

      refreshTranslations();

      fetch("/api/users/me/languages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languages: [language],
        }),
      }).catch(console.error);
    },
    [refreshTranslations]
  );

  return (
    <div className="flex flex-col h-full w-full bg-muted/30 antialiased">
      <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-background shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
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

          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select
              value={primaryLanguage}
              onValueChange={(value) =>
                handleLanguageChange(value as LanguageCode)
              }
            >
              <SelectTrigger className="h-8 w-[140px] text-xs border-0 bg-muted/50 hover:bg-muted transition-colors">
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

        {/* Messages */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                <Languages className="h-10 w-10 text-primary/40" />
              </div>
              <p className="text-base font-medium">Start a conversation</p>
              <p className="text-sm opacity-70 mt-1 text-center max-w-[200px]">
                Messages are automatically translated to your language
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => {
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showHeader =
                  !prevMessage || prevMessage.user.id !== message.user.id;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "animate-in fade-in-0 duration-300",
                      message.user.id === userId
                        ? "slide-in-from-right-2"
                        : "slide-in-from-left-2"
                    )}
                  >
                    <MessageBubble
                      content={message.content}
                      translatedContent={message.translations[primaryLanguage]}
                      originalLanguage={message.originalLanguage}
                      userName={message.user.name}
                      userImageUrl={message.user.imageUrl}
                      timestamp={message.createdAt}
                      isOwnMessage={message.user.id === userId}
                      showHeader={showHeader}
                      userLanguage={primaryLanguage}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {!shouldAutoScroll && messages.length > 0 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
            <Button
              onClick={scrollToBottom}
              size="sm"
              variant="secondary"
              className="rounded-full shadow-lg animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
            >
              <ArrowDown className="h-4 w-4 mr-1" />
              New messages
            </Button>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-border/50 bg-background"
        >
          <div className="flex items-end gap-2 bg-muted/40 rounded-2xl px-4 py-2 border border-transparent focus-within:border-primary/20 transition-colors">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              rows={1}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 disabled:cursor-not-allowed resize-none min-h-[24px] max-h-[120px] py-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!isConnected || !newMessage.trim()}
              className={cn(
                "h-8 w-8 rounded-full shrink-0 transition-all duration-200",
                newMessage.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 scale-100"
                  : "bg-muted text-muted-foreground scale-95"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
