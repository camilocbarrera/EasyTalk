"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionCard } from "@/components/session/session-card";
import { ShareDialog } from "@/components/session/share-dialog";
import { LanguageSelector } from "@/components/user/language-selector";
import { Plus, Globe } from "lucide-react";
import Link from "next/link";
import type { Session, User, SessionParticipant } from "@/lib/db/schema";
import type { LanguageCode } from "@/lib/constants/languages";

interface SessionWithRelations extends Session {
  creator: User;
  participants: (SessionParticipant & { user: User })[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [sessions, setSessions] = useState<SessionWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLanguage, setUserLanguage] = useState<LanguageCode>("en");
  const [shareSession, setShareSession] =
    useState<SessionWithRelations | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      // Fetch user data
      fetch("/api/users/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.languagePreference) {
            setUserLanguage(data.languagePreference as LanguageCode);
          }
        });

      // Fetch sessions
      fetch("/api/sessions")
        .then((res) => res.json())
        .then((data) => {
          setSessions(data);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [isSignedIn]);

  const handleLanguageChange = async (language: LanguageCode) => {
    setUserLanguage(language);
    await fetch("/api/users/me/language", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    });
  };

  if (!isLoaded || isLoading) {
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sessions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your chat sessions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <LanguageSelector
                value={userLanguage}
                onChange={handleLanguageChange}
              />
            </div>
            <Button asChild size="sm">
              <Link href="/session/new">
                <Plus className="h-4 w-4" />
                <span className="ml-2">New</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Sessions Grid */}
        {sessions.length === 0 ? (
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
