"use client";

import { useState, useEffect, use } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Session, User, SessionParticipant } from "@/lib/db/schema";

interface SessionWithRelations extends Session {
  creator: User;
  participants: (SessionParticipant & { user: User })[];
  isParticipant: boolean;
}

export default function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetch(`/api/join/${code}`)
        .then((res) => {
          if (!res.ok) {
            return res.json().then((data) => {
              throw new Error(data.error || "Session not found");
            });
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
  }, [isSignedIn, code]);

  const handleJoin = async () => {
    setIsJoining(true);

    try {
      const res = await fetch(`/api/join/${code}`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join session");
      }

      const data = await res.json();
      toast.success(data.alreadyJoined ? "Rejoining session..." : "Joined session!");
      router.push(`/session/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join");
      setIsJoining(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Join Session</CardTitle>
            <CardDescription>
              Sign in to join this chat session
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="font-mono text-2xl tracking-wider text-primary">
              {code.toUpperCase()}
            </div>
          </CardContent>
          <CardFooter>
            <SignInButton mode="modal">
              <Button className="w-full">Sign in to Join</Button>
            </SignInButton>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Unable to Join</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{session.name}</CardTitle>
          <CardDescription>
            Created by {session.creator.firstName || session.creator.username}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex -space-x-2">
              {session.participants.slice(0, 8).map(({ user }) => (
                <Avatar
                  key={user.id}
                  className="h-8 w-8 border-2 border-background"
                >
                  <AvatarImage src={user.imageUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {user.firstName?.[0] || user.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {session.participants.length} participant
              {session.participants.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : session.isParticipant ? (
              "Enter Session"
            ) : (
              "Join Session"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
