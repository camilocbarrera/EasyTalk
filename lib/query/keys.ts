export const queryKeys = {
  user: {
    all: ["user"] as const,
    me: () => [...queryKeys.user.all, "me"] as const,
    languages: () => [...queryKeys.user.all, "languages"] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    list: () => [...queryKeys.sessions.all, "list"] as const,
    detail: (id: string) => [...queryKeys.sessions.all, "detail", id] as const,
  },
} as const;
