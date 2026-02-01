"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../keys";
import type { User } from "@/lib/db/schema";
import type { LanguageCode } from "@/lib/constants/languages";

interface UserLanguagePreference {
  languageCode: LanguageCode;
  priority: number;
}

async function fetchCurrentUser(): Promise<User> {
  const res = await fetch("/api/users/me");
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

async function fetchUserLanguages(): Promise<UserLanguagePreference[]> {
  const res = await fetch("/api/users/me/languages");
  if (!res.ok) throw new Error("Failed to fetch languages");
  return res.json();
}

async function updateUserLanguages(
  languages: LanguageCode[]
): Promise<UserLanguagePreference[]> {
  const res = await fetch("/api/users/me/languages", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ languages }),
  });
  if (!res.ok) throw new Error("Failed to update languages");
  return res.json();
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: fetchCurrentUser,
  });
}

export function useUserLanguages() {
  return useQuery({
    queryKey: queryKeys.user.languages(),
    queryFn: fetchUserLanguages,
  });
}

export function useUpdateUserLanguages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserLanguages,
    onMutate: async (languages) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.user.languages() });

      // Snapshot previous value
      const previousLanguages = queryClient.getQueryData<
        UserLanguagePreference[]
      >(queryKeys.user.languages());

      // Optimistically update to the new value
      queryClient.setQueryData<UserLanguagePreference[]>(
        queryKeys.user.languages(),
        languages.map((languageCode, index) => ({
          languageCode,
          priority: index,
        }))
      );

      return { previousLanguages };
    },
    onError: (_err, _languages, context) => {
      // Rollback on error
      if (context?.previousLanguages) {
        queryClient.setQueryData(
          queryKeys.user.languages(),
          context.previousLanguages
        );
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.user.languages() });
    },
  });
}
