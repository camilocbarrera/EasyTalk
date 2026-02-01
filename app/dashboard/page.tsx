"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionCard } from "@/components/session/session-card";
import { ShareDialog } from "@/components/session/share-dialog";
import { LanguageSelector } from "@/components/user/language-selector";
import { Plus, Settings } from "lucide-react";
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
  const [shareSession, setShareSession] = useState<SessionWithRelations | null>(
    null
  );

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
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 pt-20">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 pt-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            My Sessions
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <LanguageSelector
                value={userLanguage}
                onChange={handleLanguageChange}
              />
            </div>
            <Button asChild>
              <Link href="/session/new">
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Link>
            </Button>
          </div>
        </div>

        {/* Sessions Grid */}
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              You haven&apos;t joined any sessions yet.
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
