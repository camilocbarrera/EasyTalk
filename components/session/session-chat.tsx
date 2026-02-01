"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import {
  useSessionChat,
  type ChatMessageWithTranslation,
} from "@/hooks/use-session-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Wifi, WifiOff } from "lucide-react";
import type { LanguageCode } from "@/lib/constants/languages";

interface SessionChatProps {
  sessionId: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  userLanguage: LanguageCode;
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
  userLanguage,
  initialMessages,
}: SessionChatProps) {
  const { containerRef, scrollToBottom } = useChatScroll();
  const [newMessage, setNewMessage] = useState("");

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
    userLanguage,
  });

  // Load initial messages on mount
  useEffect(() => {
    addInitialMessages(initialMessages);
  }, [initialMessages, addInitialMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !isConnected) return;

      sendMessage(newMessage);
      setNewMessage("");
    },
    [newMessage, isConnected, sendMessage]
  );

  const getTranslatedContent = (
    message: ChatMessageWithTranslation
  ): string | undefined => {
    if (message.originalLanguage === userLanguage) {
      return undefined;
    }
    return message.translations[userLanguage];
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Connection status */}
      <div
        className={cn(
          "flex items-center justify-center gap-2 py-1 text-xs transition-colors",
          isConnected
            ? "bg-green-500/10 text-green-600 dark:text-green-400"
            : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
        )}
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            Connected
            {onlineUsers.length > 0 && ` - ${onlineUsers.length} online`}
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Connecting...
          </>
        )}
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Start the conversation!
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
                  className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                >
                  <MessageBubble
                    content={message.content}
                    translatedContent={getTranslatedContent(message)}
                    originalLanguage={message.originalLanguage}
                    userName={message.user.name}
                    userImageUrl={message.user.imageUrl}
                    timestamp={message.createdAt}
                    isOwnMessage={message.user.id === userId}
                    showHeader={showHeader}
                    userLanguage={userLanguage}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="flex w-full gap-2 border-t border-border p-4"
      >
        <Input
          className={cn(
            "rounded-full bg-background text-sm transition-all duration-300",
            isConnected && newMessage.trim()
              ? "w-[calc(100%-44px)]"
              : "w-full"
          )}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={
            isConnected ? "Type a message..." : "Connecting..."
          }
          disabled={!isConnected}
        />
        {isConnected && newMessage.trim() && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected}
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
