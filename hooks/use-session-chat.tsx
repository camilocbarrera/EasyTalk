"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState, useRef } from "react";
import type { LanguageCode } from "@/lib/constants/languages";

interface UseSessionChatProps {
  sessionId: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  userLanguages: LanguageCode[];
}

export interface ChatMessageWithTranslation {
  id: string;
  content: string;
  originalLanguage: LanguageCode;
  userId: string;
  user: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  translations: Partial<Record<LanguageCode, string>>;
  createdAt: string;
}

interface PresenceState {
  id: string;
  name: string;
  imageUrl?: string;
  languages: LanguageCode[];
}

const EVENT_MESSAGE = "new-message";
const EVENT_TRANSLATION = "translation";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function useSessionChat({
  sessionId,
  userId,
  userName,
  userImageUrl,
  userLanguages,
}: UseSessionChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessageWithTranslation[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const messageIdsRef = useRef(new Set<string>());

  // Get primary language (first in array)
  const primaryLanguage = userLanguages[0] || "en";

  useEffect(() => {
    const roomName = `session:${sessionId}`;
    const newChannel = supabase.channel(roomName, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Handle new messages from other users
    newChannel.on("broadcast", { event: EVENT_MESSAGE }, (payload) => {
      const message = payload.payload as ChatMessageWithTranslation;
      // Skip if we already have this message
      if (messageIdsRef.current.has(message.id)) {
        return;
      }
      messageIdsRef.current.add(message.id);
      setMessages((current) => [...current, message]);
    });

    // Handle translation updates (real-time from server)
    newChannel.on("broadcast", { event: EVENT_TRANSLATION }, (payload) => {
      const { messageId, language, content } = payload.payload as {
        messageId: string;
        language: LanguageCode;
        content: string;
      };

      console.log(`[Client] Received translation: ${language} for message ${messageId}`);

      setMessages((current) => {
        const updated = current.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                translations: {
                  ...msg.translations,
                  [language]: content,
                },
              }
            : msg
        );
        return updated;
      });
    });

    // Handle presence
    newChannel.on("presence", { event: "sync" }, () => {
      const state = newChannel.presenceState<PresenceState>();
      const users: PresenceState[] = [];

      for (const presence of Object.values(state)) {
        if (presence[0]) {
          users.push(presence[0]);
        }
      }

      setOnlineUsers(users);
    });

    newChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        await newChannel.track({
          id: userId,
          name: userName,
          imageUrl: userImageUrl,
          languages: userLanguages,
        });
      } else {
        setIsConnected(false);
      }
    });

    channelRef.current = newChannel;

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [sessionId, userId, userName, userImageUrl, userLanguages, supabase]);

  const sendMessage = useCallback(
    async (content: string) => {
      const channel = channelRef.current;
      if (!channel || !isConnected || !content.trim()) return;

      const tempId = generateId();
      const optimisticMessage: ChatMessageWithTranslation = {
        id: tempId,
        content: content.trim(),
        originalLanguage: primaryLanguage,
        userId,
        user: {
          id: userId,
          name: userName,
          imageUrl: userImageUrl,
        },
        translations: {},
        createdAt: new Date().toISOString(),
      };

      // Add to local state immediately (optimistic update)
      messageIdsRef.current.add(tempId);
      setMessages((current) => [...current, optimisticMessage]);

      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            content: content.trim(),
          }),
        });

        if (res.ok) {
          const savedMessage = await res.json();
          const realId = savedMessage.id;

          // Update local state with real ID
          messageIdsRef.current.add(realId);
          setMessages((current) =>
            current.map((msg) =>
              msg.id === tempId
                ? {
                    ...msg,
                    id: realId,
                    originalLanguage: savedMessage.originalLanguage,
                  }
                : msg
            )
          );

          // Broadcast to other users with the real ID
          await channel.send({
            type: "broadcast",
            event: EVENT_MESSAGE,
            payload: {
              ...optimisticMessage,
              id: realId,
              originalLanguage: savedMessage.originalLanguage,
            },
          });

          // Poll for translations until they arrive
          const pollForTranslations = async (attempts = 0) => {
            if (attempts > 10) return; // Max 10 attempts (10 seconds)

            await new Promise((r) => setTimeout(r, 1000));

            try {
              const res = await fetch(`/api/sessions/${sessionId}`);
              if (!res.ok) return;

              const session = await res.json();
              const serverMsg = session.messages?.find((m: { id: string }) => m.id === realId);

              if (serverMsg?.translations?.length > 0) {
                // Translations ready - update state
                const newTranslations = serverMsg.translations.reduce(
                  (acc: Record<string, string>, t: { targetLanguage: string; translatedContent: string }) => ({
                    ...acc,
                    [t.targetLanguage]: t.translatedContent,
                  }),
                  {}
                );

                setMessages((current) =>
                  current.map((msg) =>
                    msg.id === realId
                      ? { ...msg, translations: newTranslations }
                      : msg
                  )
                );
              } else {
                // Keep polling
                pollForTranslations(attempts + 1);
              }
            } catch {
              pollForTranslations(attempts + 1);
            }
          };

          pollForTranslations();
        }
      } catch (error) {
        console.error("Failed to save message:", error);
        setMessages((current) => current.filter((msg) => msg.id !== tempId));
      }
    },
    [isConnected, sessionId, userId, userName, userImageUrl, primaryLanguage]
  );

  // Fetch latest translations from server
  const refreshTranslations = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) return;

      const session = await res.json();
      const serverMessages = session.messages as {
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
        createdAt: string;
      }[];

      // Update translations for existing messages
      setMessages((current) =>
        current.map((msg) => {
          const serverMsg = serverMessages.find((m) => m.id === msg.id);
          if (!serverMsg) return msg;

          const newTranslations = serverMsg.translations.reduce(
            (acc, t) => ({
              ...acc,
              [t.targetLanguage]: t.translatedContent,
            }),
            {} as Partial<Record<LanguageCode, string>>
          );

          return {
            ...msg,
            translations: { ...msg.translations, ...newTranslations },
          };
        })
      );
    } catch (error) {
      console.error("Failed to refresh translations:", error);
    }
  }, [sessionId]);

  const addInitialMessages = useCallback(
    (
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
      }[]
    ) => {
      const formattedMessages: ChatMessageWithTranslation[] = initialMessages.map(
        (msg) => {
          messageIdsRef.current.add(msg.id);
          return {
            id: msg.id,
            content: msg.content,
            originalLanguage: msg.originalLanguage as LanguageCode,
            userId: msg.userId,
            user: {
              id: msg.user.id,
              name: msg.user.firstName || msg.user.username || "User",
              imageUrl: msg.user.imageUrl || undefined,
            },
            translations: msg.translations.reduce(
              (acc, t) => ({
                ...acc,
                [t.targetLanguage]: t.translatedContent,
              }),
              {} as Partial<Record<LanguageCode, string>>
            ),
            createdAt: new Date(msg.createdAt).toISOString(),
          };
        }
      );

      setMessages(formattedMessages);
    },
    []
  );

  return {
    messages,
    sendMessage,
    isConnected,
    onlineUsers,
    addInitialMessages,
    refreshTranslations,
  };
}
