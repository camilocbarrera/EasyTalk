"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionCard } from "@/components/session/session-card";
import { ShareDialog } from "@/components/session/share-dialog";
import { MultiLanguageSelector } from "@/components/user/multi-language-selector";
import { Plus, Globe } from "lucide-react";
import Link from "next/link";
import type { Session, User, SessionParticipant } from "@/lib/db/schema";
import type { LanguageCode } from "@/lib/constants/languages";
import { toast } from "sonner";
import { useSessions } from "@/lib/query/hooks/use-sessions";
import { useUserLanguages, useUpdateUserLanguages } from "@/lib/query/hooks/use-user";

interface SessionWithRelations extends Session {
  creator: User;
  participants: (SessionParticipant & { user: User })[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [shareSession, setShareSession] =
    useState<SessionWithRelations | null>(null);

  // TanStack Query hooks
  const { data: sessions, isLoading: isLoadingSessions } = useSessions();
  const { data: languagePrefs, isLoading: isLoadingLanguages } = useUserLanguages();
  const updateLanguages = useUpdateUserLanguages();

  const userLanguages: LanguageCode[] =
    languagePrefs?.map((p) => p.languageCode) ?? ["en"];

  const handleLanguagesChange = async (languages: LanguageCode[]) => {
    try {
      await updateLanguages.mutateAsync(languages);
    } catch {
      toast.error("Failed to update language preferences");
    }
  };

  const isLoading = !isLoaded || isLoadingSessions || isLoadingLanguages;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 pt-24 sm:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6 pt-24 sm:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sessions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your chat sessions
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Button asChild size="sm">
              <Link href="/session/new">
                <Plus className="h-4 w-4" />
                <span className="ml-2">New</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Language Preferences */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Your Languages</span>
          </div>
          <MultiLanguageSelector
            value={userLanguages}
            onChange={handleLanguagesChange}
            disabled={updateLanguages.isPending}
          />
        </div>

        {/* Sessions Grid */}
        {!sessions || sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-6">
              No sessions yet. Create one to get started.
            </p>
            <Button asChild>
              <Link href="/">Create or Join a Session</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onShare={setShareSession}
              />
            ))}
          </div>
        )}
      </div>

      {/* Share Dialog */}
      {shareSession && (
        <ShareDialog
          open={!!shareSession}
          onOpenChange={(open) => !open && setShareSession(null)}
          sessionCode={shareSession.code}
          sessionName={shareSession.name}
        />
      )}
    </div>
  );
}
