"use client";

import { useState, useEffect, use } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShareDialog } from "@/components/session/share-dialog";
import { SessionChat } from "@/components/session/session-chat";
import { ArrowLeft, Share2, Users } from "lucide-react";
import Link from "next/link";
import type { Session, User, SessionParticipant, Message } from "@/lib/db/schema";
import type { LanguageCode } from "@/lib/constants/languages";

interface SessionWithRelations extends Session {
  creator: User;
  participants: (SessionParticipant & { user: User })[];
  messages: (Message & { user: User; translations: { targetLanguage: string; translatedContent: string }[] })[];
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [userLanguage, setUserLanguage] = useState<LanguageCode>("en");
  const [isLoading, setIsLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Fetch session
      fetch(`/api/sessions/${id}`)
        .then((res) => {
          if (!res.ok) {
            if (res.status === 404) {
              throw new Error("Session not found");
            }
            if (res.status === 403) {
              throw new Error("You are not a participant in this session");
            }
            throw new Error("Failed to load session");
          }
          return res.json();
        })
        .then((data) => {
          setSession(data);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setIsLoading(false);
        });
    }
  }, [isSignedIn, id]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <header className="flex items-center justify-between border-b border-border p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </header>
        <div className="flex-1 p-4">
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    router.push("/");
    return null;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="text-center space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const onlineParticipants = session.participants;

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-zinc-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0 bg-background">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold text-foreground truncate">
              {session.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{session.code}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Participants */}
          <div className="hidden sm:flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex -space-x-2">
              {onlineParticipants.slice(0, 4).map(({ user }) => (
                <Avatar
                  key={user.id}
                  className="h-7 w-7 border-2 border-background"
                >
                  <AvatarImage src={user.imageUrl || undefined} />
                  <AvatarFallback className="text-xs bg-muted">
                    {user.firstName?.[0] || user.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {onlineParticipants.length > 4 && (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                  +{onlineParticipants.length - 4}
                </div>
              )}
            </div>
          </div>

          <Button variant="outline" size="icon" onClick={() => setShowShare(true)}>
            <Share2 className="h-4 w-4" />
          </Button>

          {/* User account */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <SessionChat
          sessionId={session.id}
          userId={clerkUser?.id || ""}
          userName={clerkUser?.username || clerkUser?.firstName || "User"}
          userImageUrl={clerkUser?.imageUrl}
          userLanguage={userLanguage}
          initialMessages={session.messages}
        />
      </div>

      {/* Share Dialog */}
      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        sessionCode={session.code}
        sessionName={session.name}
      />
    </div>
  );
}
