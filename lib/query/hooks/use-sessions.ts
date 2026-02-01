"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import type { Session, User, SessionParticipant, Message } from "@/lib/db/schema";

interface SessionWithRelations extends Session {
  creator: User;
  participants: (SessionParticipant & { user: User })[];
}

interface SessionDetailWithMessages extends SessionWithRelations {
  messages: (Message & {
    user: User;
    translations: { targetLanguage: string; translatedContent: string }[];
  })[];
}

async function fetchSessions(): Promise<SessionWithRelations[]> {
  const res = await fetch("/api/sessions");
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

async function fetchSession(id: string): Promise<SessionDetailWithMessages> {
  const res = await fetch(`/api/sessions/${id}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Session not found");
    }
    if (res.status === 403) {
      throw new Error("You are not a participant in this session");
    }
    throw new Error("Failed to fetch session");
  }
  return res.json();
}

async function createSession(name: string): Promise<SessionWithRelations> {
  const res = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions.list(),
    queryFn: fetchSessions,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => fetchSession(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: (newSession) => {
      // Add to the sessions list cache
      queryClient.setQueryData<SessionWithRelations[]>(
        queryKeys.sessions.list(),
        (old) => (old ? [newSession, ...old] : [newSession])
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.list() });
    },
  });
}
